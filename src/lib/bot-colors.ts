const BOT_COLORS: Record<string, string> = {
  alpha: "var(--color-bot-alpha)",
  beta: "var(--color-bot-beta)",
  gamma: "var(--color-bot-gamma)",
};

export function getBotColor(source: string): string {
  const key = source.toLowerCase();
  if (BOT_COLORS[key]) return BOT_COLORS[key];

  for (const [name, color] of Object.entries(BOT_COLORS)) {
    if (key.includes(name)) return color;
  }

  return BOT_COLORS.alpha;
}
