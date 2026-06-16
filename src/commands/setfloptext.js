import { buildEmbed } from "../utils/embed.js";
import { Flop } from "../utils/db.js";

export async function run(message, args) {
  if (!args.length) return message.reply("Usage: `.setfloptext <text>`");

  const text = args.join(" ");
  await Flop.findOneAndUpdate(
    { key: "flop_text" },
    { value: text },
    { upsert: true }
  );

  const embed = await buildEmbed({
    title: "Flop Text Updated",
    description: `> The announcement text has been updated.\n\n**New text:**\n> ${text}`,
    color: 0x57f287,
    footer: "Use .flop to broadcast this message.",
  });

  return message.reply({ embeds: [embed] });
}
