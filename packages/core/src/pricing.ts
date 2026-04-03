import type { SygilConfig } from "./types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DEFAULT_PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus-4": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-sonnet-4": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-3.5": { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 },
};

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
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "claude-opus-4";
  if (lower.includes("haiku")) return "claude-haiku-3.5";
  return "claude-sonnet-4";
}

export function calculateCost(usage: { input: number; output: number; cacheCreation?: number; cacheRead?: number }, model: string): number {
  const pricing = getPricing();
  const key = matchModel(model);
  const rates = pricing[key] || pricing["claude-sonnet-4"];
  const inputCost = (usage.input / 1_000_000) * rates.input;
  const outputCost = (usage.output / 1_000_000) * rates.output;
  const cacheCost = ((usage.cacheCreation || 0) / 1_000_000) * rates.cacheWrite
    + ((usage.cacheRead || 0) / 1_000_000) * rates.cacheRead;
  return inputCost + outputCost + cacheCost;
}
