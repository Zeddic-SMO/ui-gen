import { test, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getUsageCount,
  resetRateLimit,
  clearAllRateLimits,
  RATE_LIMITS,
} from "@/lib/rate-limit";

beforeEach(() => {
  clearAllRateLimits();
});

test("allows requests within limit", () => {
  const result = checkRateLimit("user:123", 5);

  expect(result.allowed).toBe(true);
  expect(result.remaining).toBe(4);
  expect(result.limit).toBe(5);
});

test("tracks usage count correctly", () => {
  expect(getUsageCount("user:123")).toBe(0);

  checkRateLimit("user:123", 5);
  expect(getUsageCount("user:123")).toBe(1);

  checkRateLimit("user:123", 5);
  expect(getUsageCount("user:123")).toBe(2);
});

test("blocks requests when limit is reached", () => {
  const identifier = "user:456";

  // Use all 3 requests
  checkRateLimit(identifier, 3);
  checkRateLimit(identifier, 3);
  checkRateLimit(identifier, 3);

  // 4th request should be blocked
  const result = checkRateLimit(identifier, 3);

  expect(result.allowed).toBe(false);
  expect(result.remaining).toBe(0);
  expect(result.limit).toBe(3);
});

test("remaining count decreases correctly", () => {
  const identifier = "user:789";
  const limit = 5;

  expect(checkRateLimit(identifier, limit).remaining).toBe(4);
  expect(checkRateLimit(identifier, limit).remaining).toBe(3);
  expect(checkRateLimit(identifier, limit).remaining).toBe(2);
  expect(checkRateLimit(identifier, limit).remaining).toBe(1);
  expect(checkRateLimit(identifier, limit).remaining).toBe(0);
  expect(checkRateLimit(identifier, limit).allowed).toBe(false);
});

test("different identifiers have separate limits", () => {
  // Use up all requests for user1
  checkRateLimit("user:1", 2);
  checkRateLimit("user:1", 2);

  // user1 should be blocked
  expect(checkRateLimit("user:1", 2).allowed).toBe(false);

  // user2 should still have full quota
  expect(checkRateLimit("user:2", 2).allowed).toBe(true);
  expect(checkRateLimit("user:2", 2).remaining).toBe(0);
});

test("resetRateLimit clears usage for specific identifier", () => {
  checkRateLimit("user:123", 5);
  checkRateLimit("user:123", 5);
  expect(getUsageCount("user:123")).toBe(2);

  resetRateLimit("user:123");
  expect(getUsageCount("user:123")).toBe(0);

  // Should be able to use again
  expect(checkRateLimit("user:123", 5).remaining).toBe(4);
});

test("clearAllRateLimits clears all usage", () => {
  checkRateLimit("user:1", 5);
  checkRateLimit("user:2", 5);
  checkRateLimit("anon:abc", 2);

  clearAllRateLimits();

  expect(getUsageCount("user:1")).toBe(0);
  expect(getUsageCount("user:2")).toBe(0);
  expect(getUsageCount("anon:abc")).toBe(0);
});

test("RATE_LIMITS has correct values", () => {
  expect(RATE_LIMITS.anonymous).toBe(2);
  expect(RATE_LIMITS.authenticated).toBe(5);
});

test("anonymous limit of 2 works correctly", () => {
  const identifier = "anon:session123";
  const limit = RATE_LIMITS.anonymous;

  expect(checkRateLimit(identifier, limit).allowed).toBe(true);
  expect(checkRateLimit(identifier, limit).allowed).toBe(true);
  expect(checkRateLimit(identifier, limit).allowed).toBe(false);
});

test("authenticated limit of 5 works correctly", () => {
  const identifier = "user:session123";
  const limit = RATE_LIMITS.authenticated;

  for (let i = 0; i < 5; i++) {
    expect(checkRateLimit(identifier, limit).allowed).toBe(true);
  }
  expect(checkRateLimit(identifier, limit).allowed).toBe(false);
});

test("does not increment count when already blocked", () => {
  const identifier = "user:blocked";

  // Use all 2 requests
  checkRateLimit(identifier, 2);
  checkRateLimit(identifier, 2);
  expect(getUsageCount(identifier)).toBe(2);

  // Try to use more - should be blocked and count should not increase
  checkRateLimit(identifier, 2);
  checkRateLimit(identifier, 2);
  expect(getUsageCount(identifier)).toBe(2);
});
