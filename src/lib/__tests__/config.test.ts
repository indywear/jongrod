import { describe, it, expect } from "vitest"
import { siteConfig } from "../config"

describe("siteConfig", () => {
  it("should have required company fields", () => {
    expect(siteConfig.company.nameEn).toBeTruthy()
    expect(siteConfig.company.nameTh).toBeTruthy()
    expect(siteConfig.company.phone).toBeTruthy()
    expect(siteConfig.company.email).toBeTruthy()
    expect(siteConfig.company.taxId).toBeTruthy()
    expect(siteConfig.company.address).toBeTruthy()
  })

  it("should have a valid email format", () => {
    expect(siteConfig.company.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })

  it("should have site name", () => {
    expect(siteConfig.name).toBe("Jongrod")
  })

  it("should have hours info", () => {
    expect(siteConfig.hours.weekday).toBeTruthy()
    expect(siteConfig.hours.weekend).toBeTruthy()
  })
})
