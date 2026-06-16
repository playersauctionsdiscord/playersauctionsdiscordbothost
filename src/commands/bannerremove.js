import { setConfig } from "../utils/db.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message) {
  await setConfig("global_banner_url", "");
  const embed = await buildEmbed({
    title: "Global Banner Removed",
    description: `> The global banner image has been cleared.\n> All embeds will no longer display a banner image.`,
    color: 0xed4245,
    footer: "Use .setbanner <URL> to set a new banner.",
  });
  return message.reply({ embeds: [embed] });
}
