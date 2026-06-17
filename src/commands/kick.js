import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  const target =
    message.mentions.members.first() ||
    (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

  if (!target) return message.reply("Usage: `.kick <@user> [reason]`");

  const reasonParts = message.mentions.users.size ? args.slice(0) : args.slice(1);
  const reason = reasonParts.join(" ") || "No reason provided";

  if (!target.kickable) return message.reply("❌ I cannot kick that user (missing permissions or higher role).");

  await target.kick(reason);

  const embed = await buildEmbed({
    title: "Member Kicked",
    description:
      `> <@${target.id}> has been kicked from the server.\n\n` +
      `**Reason:** \`${reason}\`\n` +
      `**Moderator:** <@${message.author.id}>`,
    color: 0xff7043,
  });

  return message.reply({ embeds: [embed] });
}
