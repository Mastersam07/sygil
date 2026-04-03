import type { SygilConfig } from "./types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface ModelPricing {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

const DEFAULT_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-6":            { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-opus-4-5-20251101":   { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-opus-4-0-20250514":   { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-sonnet-4-6":          { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-sonnet-4-5-20251022": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-sonnet-4-0-20250514": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5":           { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 },
  "claude-haiku-3-5-20241022":  { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 },
};

const SONNET_KEY = "claude-sonnet-4-6";

let configCache: SygilConfig | null = null;

export function loadConfig(): SygilConfig {
  if (configCache) return configCache;
  const configPath = join(homedir(), ".sygil.json");
  if (existsSync(configPath)) {
    try {
      configCache = JSON.parse(readFileSync(configPath, "utf-8"));
      return configCache!;
    } catch { /* ignore */ }
  }
  configCache = {};
  return configCache;
}

function getPricing() {
  const config = loadConfig();
  return { ...DEFAULT_PRICING, ...config.pricing };
}

function matchModel(model: string): string {
  const pricing = getPricing();
  if (pricing[model]) return model;
  const prefix = model.split("-").slice(0, 3).join("-");
  for (const key of Object.keys(pricing)) {
    if (key.startsWith(prefix) || model.startsWith(key)) return key;
  }
  return SONNET_KEY;
}

export function calculateCost(usage: { input: number; output: number; cacheCreation?: number; cacheRead?: number }, model: string): number {
  const pricing = getPricing();
  const key = matchModel(model);
  const rates = pricing[key] || pricing[SONNET_KEY];
  const inputCost = (usage.input / 1_000_000) * rates.input;
  const outputCost = (usage.output / 1_000_000) * rates.output;
  const cacheCost = ((usage.cacheCreation || 0) / 1_000_000) * rates.cacheWrite
    + ((usage.cacheRead || 0) / 1_000_000) * rates.cacheRead;
  return inputCost + outputCost + cacheCost;
}

export function calculateCostWithoutCache(usage: { input: number; output: number; cacheCreation?: number; cacheRead?: number }, model: string): number {
  const pricing = getPricing();
  const key = matchModel(model);
  const rates = pricing[key] || pricing[SONNET_KEY];
  const allInput = usage.input + (usage.cacheCreation || 0) + (usage.cacheRead || 0);
  return (allInput / 1_000_000) * rates.input + (usage.output / 1_000_000) * rates.output;
}
