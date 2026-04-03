import chalk from "chalk";
import { loadAllSessions, getProjectDirs, calculateCostWithoutCache } from "@sygil/core";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE = "\x1b[2K";

const blue = chalk.hex("#4a9eff");
const blueBold = chalk.hex("#4a9eff").bold;
const blueDim = chalk.hex("#2a5a9a");
const dim = chalk.hex("#3a3a5a");
const white = chalk.hex("#c8c8e0");
const bright = chalk.hex("#e8e8ff").bold;

async function typewrite(text: string, style: (s: string) => string, delay = 10) {
  for (let i = 0; i <= text.length; i++) {
    process.stdout.write(`\r${CLEAR_LINE}${style(text.slice(0, i))}${dim("█")}`);
    await sleep(delay);
  }
  process.stdout.write(`\r${CLEAR_LINE}${style(text)}`);
}

function rightPad(text: string, width: number): string {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = width - stripped.length;
  return text + (pad > 0 ? " ".repeat(pad) : "");
}

function centerPad(text: string, width: number): string {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = Math.max(0, Math.floor((width - stripped.length) / 2));
  return " ".repeat(pad) + text;
}

const LOGO = [
  "╔═══╗ ╔╗   ╔╗ ╔═══╗ ╔══╗ ╔╗     ",
  "║╔══╝ ║╚╗ ╔╝║ ║╔══╝  ║║  ║║     ",
  "║╚══╗  ║║ ║║  ║║ ╔═╗ ║║  ║║     ",
  "╚══╗║  ║╚═╝║  ║║ ╚╗║ ║║  ║║     ",
  "╔══╝║  ╚╗ ╔╝  ║╚═╝║ ╔╝╚╗ ║╚══╗ ",
  "╚═══╝   ╚═╝   ╚═══╝ ╚══╝ ╚═══╝ ",
];

export async function printStartup(claudeDir: string) {
  const cols = process.stdout.columns || 80;
  const boxW = Math.min(cols - 4, 52);
  const inner = boxW - 2;

  process.stdout.write(HIDE_CURSOR);
  console.clear();
  await sleep(100);

  for (const line of LOGO) {
    console.log(blue(centerPad(line, cols)));
    await sleep(15);
  }
  console.log();
  await sleep(80);

  await typewrite("  [Notification]", s => blueBold(s));
  console.log();
  console.log();
  await sleep(60);

  await typewrite("  Your System has awakened.", s => white(s));
  console.log();
  console.log();
  await sleep(120);

  const scanMsg = "  Analyzing usage data...";
  await typewrite(scanMsg, s => dim(s), 8);

  const sessions = loadAllSessions(claudeDir);
  const projects = getProjectDirs(claudeDir);
  const totalTokens = sessions.reduce((a, s) => a + s.tokens.input + s.tokens.output + s.tokens.cacheCreation + s.tokens.cacheRead, 0);
  const totalCost = sessions.reduce((a, s) => a + s.cost, 0);
  const noCacheCost = sessions.reduce((a, s) => a + calculateCostWithoutCache(s.tokens, s.model), 0);
  const saved = noCacheCost - totalCost;

  process.stdout.write(`\r${CLEAR_LINE}`);
  await typewrite(`  ${sessions.length} sessions detected across ${projects.length} projects.`, s => dim(s), 8);
  console.log();
  console.log();
  await sleep(100);

  await typewrite("  [Status Window]", s => blueBold(s));
  console.log();
  console.log();
  await sleep(60);

  const border = blueDim("─".repeat(inner));
  console.log(`  ${border}`);

  const stats: [string, string][] = [
    ["Tokens Consumed", totalTokens.toLocaleString()],
    ["Estimated Cost", "$" + totalCost.toFixed(2)],
    ["Cache Savings", "$" + saved.toFixed(2) + " (" + (noCacheCost > 0 ? Math.round((saved / noCacheCost) * 100) : 0) + "% saved)"],
    ["Total Sessions", sessions.length.toString()],
    ["Active Projects", projects.length.toString()],
  ];

  for (const [label, value] of stats) {
    const line = `  ${dim("│")}  ${white(label.padEnd(20))} ${bright(value)}`;
    await typewrite(rightPad(line, inner + 10), s => s, 5);
    console.log();
    await sleep(20);
  }

  console.log(`  ${border}`);
  console.log();
  await sleep(120);

  await typewrite("  [Interface Ready]", s => blueBold(s));
  console.log();
  console.log();

  process.stdout.write(SHOW_CURSOR);
}
