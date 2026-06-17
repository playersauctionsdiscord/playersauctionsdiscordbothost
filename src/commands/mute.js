import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  const target =
    message.mentions.members.first() ||
    (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

  if (!target) return message.reply("Usage: `.mute <@user> [minutes] [reason]`");

  const minuteArg = message.mentions.users.size ? args[0] : args[1];
  const minutes = parseInt(minuteArg) || 10;
  const reasonParts = message.mentions.users.size ? args.slice(1) : args.slice(2);
  const reason = reasonParts.join(" ") || "No reason provided";

  if (!target.moderatable) return message.reply("❌ I cannot mute that user (missing permissions or higher role).");

  await target.timeout(minutes * 60 * 1000, reason);

  const embed = await buildEmbed({
    title: "Member Muted",
    description:
      `> <@${target.id}> has been muted.\n\n` +
      `**Duration:** \`${minutes} minute${minutes !== 1 ? "s" : ""}\`\n` +
      `**Reason:** \`${reason}\`\n` +
      `**Moderator:** <@${message.author.id}>`,
    color: 0xfee75c,
  });

  return message.reply({ embeds: [embed] });
}
