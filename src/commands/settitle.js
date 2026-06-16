import { setConfig } from "../utils/db.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  if (!args.length) {
    return message.reply("Usage: `.settitle <Text>`");
  }
  const newTitle = args.join(" ");
  await setConfig("global_server_title", newTitle);
  const embed = await buildEmbed({
    title: "Global Title Updated",
    description: `> All system embeds will now use the title:\n> **${newTitle}**`,
    color: 0x57f287,
    footer: "Configuration saved successfully.",
  });
  return message.reply({ embeds: [embed] });
}
