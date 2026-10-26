import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitScope = "analysis" | "reply";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const POLICIES = {
  analysis: { limit: 10, windowMs: 60_000, window: "1 m" },
  reply: { limit: 20, windowMs: 60_000, window: "1 m" },
} as const;

const LOCAL_MAX_ENTRIES = 5_000;
const localCounters = new Map<string, { count: number; reset: number }>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const distributedLimiters = redis
  ? {
      analysis: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(POLICIES.analysis.limit, POLICIES.analysis.window),
        prefix: "sentimind:analysis",
      }),
      reply: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(POLICIES.reply.limit, POLICIES.reply.window),
        prefix: "sentimind:reply",
      }),
    }
  : null;

function clientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || forwardedFor || "unknown";
}

function pruneLocalCounters(now: number): void {
  if (localCounters.size < LOCAL_MAX_ENTRIES) return;

  for (const [key, value] of localCounters) {
    if (value.reset <= now) localCounters.delete(key);
  }

  if (localCounters.size >= LOCAL_MAX_ENTRIES) {
    const oldestKey = localCounters.keys().next().value;
    if (oldestKey) localCounters.delete(oldestKey);
  }
}

function checkLocalLimit(scope: RateLimitScope, identifier: string): RateLimitResult {
  const policy = POLICIES[scope];
  const now = Date.now();
  const key = `${scope}:${identifier}`;
  const current = localCounters.get(key);

  if (!current || current.reset <= now) {
    pruneLocalCounters(now);
    localCounters.set(key, { count: 1, reset: now + policy.windowMs });
    return { success: true, limit: policy.limit, remaining: policy.limit - 1, reset: now + policy.windowMs };
  }

  current.count += 1;
  return {
    success: current.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - current.count),
    reset: current.reset,
  };
}

export async function checkRateLimit(
  request: Request,
  scope: RateLimitScope,
): Promise<RateLimitResult> {
  const identifier = clientIdentifier(request);
  const limiter = distributedLimiters?.[scope];

  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error("Distributed rate limit failed; using local fallback", error);
    }
  }

  return checkLocalLimit(scope, identifier);
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1_000));
  return {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1_000)),
  };
}
