import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit } from "../auth"

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset rate limit state between tests by using unique identifiers
  })

  it("should allow first request", () => {
    const id = `test-allow-${Date.now()}`
    const result = checkRateLimit(id, 5, 60000)
    expect(result.allowed).toBe(true)
  })

  it("should allow requests within limit", () => {
    const id = `test-within-${Date.now()}`
    for (let i = 0; i < 4; i++) {
      const result = checkRateLimit(id, 5, 60000)
      expect(result.allowed).toBe(true)
    }
  })

  it("should block requests exceeding limit", () => {
    const id = `test-exceed-${Date.now()}`
    // Use up all allowed requests
    for (let i = 0; i < 3; i++) {
      checkRateLimit(id, 3, 60000)
    }
    // Next should be blocked
    const result = checkRateLimit(id, 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it("should return retryAfter in seconds when blocked", () => {
    const id = `test-retry-${Date.now()}`
    for (let i = 0; i < 2; i++) {
      checkRateLimit(id, 2, 60000)
    }
    const result = checkRateLimit(id, 2, 60000)
    expect(result.allowed).toBe(false)
    expect(typeof result.retryAfter).toBe("number")
    expect(result.retryAfter).toBeLessThanOrEqual(60)
  })
})
