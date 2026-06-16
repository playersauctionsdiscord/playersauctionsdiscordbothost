import { setConfig } from "../utils/db.js";
import { buildEmbed } from "../utils/embed.js";

const VALID_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif"];

export async function run(message, args) {
  const url = args[0];
  if (!url) return message.reply("Usage: `.setbanner <URL>`");

  const lower = url.toLowerCase().split("?")[0];
  const valid = VALID_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!valid) {
    return message.reply(
      "❌ Invalid image URL. The link must end in `.png`, `.jpg`, `.jpeg`, or `.gif`."
    );
  }

  await setConfig("global_banner_url", url);
  const embed = await buildEmbed({
    title: "Global Banner Updated",
    description: `> The unified banner asset has been set.\n> All embeds that support images will now display this banner.`,
    color: 0x57f287,
    footer: "Banner saved successfully.",
  });
  return message.reply({ embeds: [embed] });
}
