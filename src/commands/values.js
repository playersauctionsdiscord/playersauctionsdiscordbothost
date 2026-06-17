import { EmbedBuilder } from "discord.js";

const DEMAND_LABELS = ["Unassigned", "Terrible", "Low", "Normal", "High", "Amazing"];
const TREND_LABELS  = ["Lowering", "Stable", "Raising"];

let roliCache = null;
let roliCacheTime = 0;
const ROLI_TTL = 10 * 60 * 1000; // cache 10 minutes

async function fetchRolimons() {
  if (roliCache && Date.now() - roliCacheTime < ROLI_TTL) return roliCache;

  const res = await fetch("https://www.rolimons.com/itemapi/itemdetails", {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PlayerAuctionsBot/1.0)",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`Rolimons returned ${res.status}`);
  const data = await res.json();
  roliCache = data.items || {};
  roliCacheTime = Date.now();
  return roliCache;
}

function searchRolimons(items, query) {
  const q = query.toLowerCase();
  const results = [];

  for (const [id, arr] of Object.entries(items)) {
    const name = arr[0];
    if (!name) continue;
    if (name.toLowerCase().includes(q)) {
      results.push({
        id,
        name,
        rap:    arr[3] > 0 ? arr[3] : null,
        value:  arr[4] > 0 ? arr[4] : null,
        demand: arr[6] >= 0 ? arr[6] : null,
        trend:  arr[7] >= 0 ? arr[7] : null,
        rare:   arr[10] === 1,
        hyped:  arr[9]  === 1,
      });
    }
  }

  // Sort: exact match first, then alphabetical
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === q ? -1 : 0;
    const bExact = b.name.toLowerCase() === q ? -1 : 0;
    if (aExact !== bExact) return aExact - bExact;
    return a.name.localeCompare(b.name);
  });

  return results.slice(0, 5);
}

function robuxToUsd(robux) {
  if (!robux) return null;
  // ~80 Robux per $1 (approximate market rate)
  return (robux / 80).toFixed(2);
}

function buildItemEmbed(item, index, total) {
  const lines = [];

  if (item.value)  lines.push(`💎 **Value:** \`${item.value.toLocaleString()}\` Robux  (~$${robuxToUsd(item.value)})`);
  if (item.rap)    lines.push(`📊 **RAP:** \`${item.rap.toLocaleString()}\` Robux  (~$${robuxToUsd(item.rap)})`);
  if (item.demand !== null) lines.push(`📈 **Demand:** \`${DEMAND_LABELS[item.demand] ?? "Unknown"}\``);
  if (item.trend  !== null) lines.push(`🔀 **Trend:** \`${TREND_LABELS[item.trend]   ?? "Unknown"}\``);

  const tags = [];
  if (item.rare)  tags.push("🔴 Rare");
  if (item.hyped) tags.push("🔥 Hyped");
  if (tags.length) lines.push(tags.join("  "));

  lines.push(`\n🔗 [View on Rolimons](https://www.rolimons.com/item/${item.id})`);
  lines.push(`-# Source: rolimons.com`);

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🏷️ ${item.name}${total > 1 ? ` (${index + 1}/${total})` : ""}`)
    .setDescription(lines.join("\n"));
}

export async function run(message, args) {
  if (!args.length) return message.reply("Usage: `.values <item name>`");

  const itemName = args.join(" ");
  const searching = await message.reply(`🔍 Searching values for **${itemName}**...`);

  try {
    const items = await fetchRolimons();
    const results = searchRolimons(items, itemName);

    if (!results.length) {
      await searching.edit({
        content: "",
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("❌ No Results Found")
            .setDescription(
              `No Roblox limited found matching **${itemName}**.\n\n` +
              `> Make sure you're searching for a Roblox **catalog limited** (accessories, gear, etc.).\n` +
              `> For in-game items (Adopt Me, MM2, etc.) check the game's own trading sites.\n\n` +
              `-# Powered by [Rolimons](https://www.rolimons.com)`
            ),
        ],
      });
      return;
    }

    const embeds = results.map((item, i) => buildItemEmbed(item, i, results.length));

    await searching.edit({ content: "", embeds });

  } catch (err) {
    await searching.edit({
      content: "",
      embeds: [
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("❌ Lookup Failed")
          .setDescription(
            `Could not fetch item data right now.\n> ${err.message}\n\n` +
            `-# Try again in a moment or visit [rolimons.com](https://www.rolimons.com) directly.`
          ),
      ],
    });
  }
}
