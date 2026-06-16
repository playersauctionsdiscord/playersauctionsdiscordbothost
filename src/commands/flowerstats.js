import { buildEmbed } from "../utils/embed.js";
import { Flop } from "../utils/db.js";

export async function run(message) {
  const record = await Flop.findOne({ key: "flowers_text" });
  const count = record?.count || 0;

  const embed = await buildEmbed({
    title: "🌸 Flowers Command Statistics",
    description:
      `> Usage metrics for the \`.flowers\` command.\n\n` +
      `**Total Executions:** \`${count}\`\n\n` +
      `-# Community interaction data from persistent log storage.`,
    color: 0xff85c2,
  });

  return message.reply({ embeds: [embed] });
}
