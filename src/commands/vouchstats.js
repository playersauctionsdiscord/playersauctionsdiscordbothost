import { buildEmbed } from "../utils/embed.js";
import { Vouch } from "../utils/db.js";

export async function run(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
  if (!target) return message.reply("Usage: `.vouchstats <@user>`");

  let record = await Vouch.findOne({ userId: target.id });
  if (!record) {
    record = { vouches: 0, deals: 0 };
  }

  const embed = await buildEmbed({
    title: "Middleman vouches",
    description:
      `> Vouches for <@${target.id}> are below\n\n` +
      `🔗 **${record.vouches}** Vouches\n` +
      `🔗 **${record.deals}** Deals completed\n\n` +
      `> Our Server Has been up for over __5+ years__`,
    color: 0x5865f2,
    thumbnail: target.displayAvatarURL({ dynamic: true }),
  });

  return message.reply({ embeds: [embed] });
}
