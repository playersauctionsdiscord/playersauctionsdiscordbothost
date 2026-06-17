import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  const target =
    message.mentions.users.first() ||
    (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

  if (!target) return message.reply("Usage: `.ban <@user> [reason]`");

  const reasonParts = message.mentions.users.size ? args.slice(0) : args.slice(1);
  const reason = reasonParts.join(" ") || "No reason provided";

  const member = message.guild.members.cache.get(target.id);
  if (member && !member.bannable) return message.reply("❌ I cannot ban that user (missing permissions or higher role).");

  await message.guild.members.ban(target.id, { reason, deleteMessageSeconds: 0 });

  const embed = await buildEmbed({
    title: "Member Banned",
    description:
      `> <@${target.id}> has been banned from the server.\n\n` +
      `**Reason:** \`${reason}\`\n` +
      `**Moderator:** <@${message.author.id}>`,
    color: 0xed4245,
  });

  return message.reply({ embeds: [embed] });
}
