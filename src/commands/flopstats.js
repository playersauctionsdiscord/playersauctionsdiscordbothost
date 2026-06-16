import { buildEmbed } from "../utils/embed.js";
import { Flop } from "../utils/db.js";

export async function run(message) {
  const record = await Flop.findOne({ key: "flop_text" });
  const count = record?.count || 0;
  const text = record?.value || "Not set";

  const embed = await buildEmbed({
    title: "Flop Command Statistics",
    description:
      `> Usage metrics for the \`.flop\` command.\n\n` +
      `**Total Executions:** \`${count}\`\n` +
      `**Current Text:** \`${text.slice(0, 100)}${text.length > 100 ? "..." : ""}\`\n\n` +
      `-# Community interaction data from persistent log storage.`,
    color: 0x5865f2,
  });

  return message.reply({ embeds: [embed] });
}
