import { buildEmbed } from "../utils/embed.js";

const GAME_APIS = [
  {
    game: "Adopt Me",
    url: (item) =>
      `https://supremevalues.com/api/search?game=adoptme&query=${encodeURIComponent(item)}`,
    emoji: "🐾",
  },
  {
    game: "MM2",
    url: (item) =>
      `https://supremevalues.com/api/search?game=mm2&query=${encodeURIComponent(item)}`,
    emoji: "🔪",
  },
  {
    game: "Grow a Garden",
    url: (item) =>
      `https://supremevalues.com/api/search?game=growagardenroblox&query=${encodeURIComponent(item)}`,
    emoji: "🌱",
  },
  {
    game: "Steal a Brainrot",
    url: (item) =>
      `https://supremevalues.com/api/search?game=stealabrainrot&query=${encodeURIComponent(item)}`,
    emoji: "🧠",
  },
];

async function fetchSupremeValues(itemName) {
  const results = [];

  for (const source of GAME_APIS) {
    try {
      const res = await fetch(source.url(itemName), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PlayerAuctionsBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      // Supreme Values typically returns an array of item objects
      const items = Array.isArray(data) ? data : data?.items || data?.results || [];
      if (!items.length) continue;

      // Find the closest match
      const match = items.find(
        (i) => i.name?.toLowerCase().includes(itemName.toLowerCase())
      ) || items[0];

      if (!match) continue;

      results.push({
        game: source.game,
        emoji: source.emoji,
        name: match.name || itemName,
        robux: match.robux ?? match.value ?? match.rap ?? null,
        usd: match.usd ?? match.price ?? null,
        inGame: match.in_game ?? match.inGame ?? match.game_value ?? null,
        demand: match.demand ?? null,
        trend: match.trend ?? null,
      });
    } catch {
      // silently skip failed sources
    }
  }

  return results;
}

function formatValue(val) {
  if (val === null || val === undefined) return "`N/A`";
  if (typeof val === "number") return `\`${val.toLocaleString()}\``;
  return `\`${val}\``;
}

export async function run(message, args) {
  if (!args.length) return message.reply("Usage: `.values <item name>`");

  const itemName = args.join(" ");
  const searching = await message.reply(`🔍 Searching values for **${itemName}**...`);

  const results = await fetchSupremeValues(itemName);

  if (!results.length) {
    await searching.edit(
      `❌ No values found for **${itemName}**.\nTry a more specific name or check [Supreme Values](https://supremevalues.com).`
    );
    return;
  }

  let description = `> Item values for **${itemName}** from Supreme Values\n\n`;

  for (const r of results) {
    description += `${r.emoji} **${r.game}** — ${r.name}\n`;
    description += `> 💵 USD: ${formatValue(r.usd)}  |  🔷 Robux: ${formatValue(r.robux)}  |  🎮 In-Game: ${formatValue(r.inGame)}\n`;
    if (r.demand) description += `> 📊 Demand: \`${r.demand}\``;
    if (r.trend) description += `  |  📈 Trend: \`${r.trend}\``;
    if (r.demand || r.trend) description += `\n`;
    description += `\n`;
  }

  description += `-# Source: [supremevalues.com](https://supremevalues.com)`;

  const embed = await buildEmbed({
    title: "🏷️ Item Values",
    description,
    color: 0x5865f2,
  });

  await searching.edit({ content: "", embeds: [embed] });
}
