import { buildEmbed } from "../utils/embed.js";
import { Flop } from "../utils/db.js";

export async function run(message) {
  let record = await Flop.findOneAndUpdate(
    { key: "flop_text" },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  const text = record.value || "No flop text has been set yet. Use `.setfloptext <text>` to set it.";

  const embed = await buildEmbed({
    title: "Server Announcement",
    description: `> ${text}`,
    color: 0x5865f2,
  });

  return message.channel.send({ embeds: [embed] });
}
