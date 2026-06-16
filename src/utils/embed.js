import { EmbedBuilder } from "discord.js";
import { getConfig } from "./db.js";

export async function buildEmbed(options = {}) {
  const title = await getConfig("global_server_title", "PlayerAuctions Marketplace");
  const bannerUrl = await getConfig("global_banner_url", "");

  const embed = new EmbedBuilder()
    .setColor(options.color ?? 0x5865f2)
    .setTitle(options.title ? `${title} — ${options.title}` : title);

  if (options.description) embed.setDescription(options.description);
  if (options.fields) embed.addFields(options.fields);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.author) embed.setAuthor(options.author);

  if (bannerUrl && bannerUrl.trim() !== "") {
    embed.setImage(bannerUrl);
  }

  return embed;
}

export async function getGlobals() {
  const title = await getConfig("global_server_title", "PlayerAuctions Marketplace");
  const bannerUrl = await getConfig("global_banner_url", "");
  return { title, bannerUrl };
}
