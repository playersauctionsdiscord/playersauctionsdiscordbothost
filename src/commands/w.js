import { PermissionFlagsBits } from "discord.js";
import { buildEmbed } from "../utils/embed.js";

const KEY_PERMS = [
  { flag: PermissionFlagsBits.ManageGuild,      name: "Manage Server" },
  { flag: PermissionFlagsBits.ManageChannels,   name: "Manage Channels" },
  { flag: PermissionFlagsBits.ManageRoles,      name: "Manage Roles" },
  { flag: PermissionFlagsBits.ManageMessages,   name: "Manage Messages" },
  { flag: PermissionFlagsBits.KickMembers,      name: "Kick Members" },
  { flag: PermissionFlagsBits.BanMembers,       name: "Ban Members" },
  { flag: PermissionFlagsBits.ManageNicknames,  name: "Manage Nicknames" },
  { flag: PermissionFlagsBits.Administrator,    name: "Administrator" },
];

export async function run(message, args) {
  // No args = show the command author's own info
  let member = message.mentions.members.first()
    || (args[0] ? message.guild.members.cache.get(args[0]) : null)
    || message.member;

  if (!member) {
    try { member = await message.guild.members.fetch(args[0]); } catch (_) {}
  }
  if (!member) return message.reply("❌ Could not find that user.");

  const user = member.user;
  const roles = member.roles.cache
    .filter((r) => r.id !== message.guild.id)
    .sort((a, b) => b.position - a.position);

  const roleList = roles.size > 0
    ? [...roles.values()].map((r) => `<@&${r.id}>`).join(" ")
    : "None";

  const keyPerms = KEY_PERMS
    .filter((p) => member.permissions.has(p.flag))
    .map((p) => p.name);

  const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
  const joinedAt = member.joinedTimestamp
    ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
    : "Unknown";

  const embed = await buildEmbed({
    title: `Whois — ${user.tag}`,
    color: member.displayColor || 0x5865f2,
  });

  embed
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `> User: <@${user.id}> (\`${user.id}\`)\n` +
      `Type: 👤 Member`
    )
    .addFields(
      { name: "Account Created", value: createdAt, inline: true },
      { name: "Joined Server",   value: joinedAt,  inline: true },
      { name: `Roles [${roles.size}]`, value: roleList, inline: false },
      {
        name: "Key Permissions",
        value: keyPerms.length > 0 ? `\`${keyPerms.join(", ")}\`` : "`None`",
        inline: false,
      }
    );

  return message.reply({ embeds: [embed] });
}
