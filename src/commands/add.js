import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  const isTicket = message.channel.name?.startsWith("mm-") || message.channel.name?.startsWith("sab-");
  if (!isTicket) return message.reply("❌ This command can only be used inside a ticket channel.");

  const target =
    message.mentions.members.first() ||
    (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

  if (!target) return message.reply("Usage: `.add <@user or ID>`");

  await message.channel.permissionOverwrites.create(target, {
    ViewChannel: true,
    SendMessages: true,
  });

  const embed = await buildEmbed({
    title: "User Added",
    description:
      `> <@${target.id}> has been added to the ticket channel.\n` +
      `> You can now move forward with the trade.\n\n` +
      `-# all cleared, stay safe __PlayerAuctions Marketplace__`,
    color: 0x57f287,
  });

  return message.channel.send({ embeds: [embed] });
}
