import { setConfig } from "../utils/db.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  const role = message.mentions.roles.first();
  if (!role) return message.reply("Usage: `.staffrole <@role>`");

  await setConfig("staff_role_id", role.id);
  const embed = await buildEmbed({
    title: "Staff Role Configured",
    description: `> <@&${role.id}> has been designated as the official staff group.\n> This role will be pinged inside all newly created ticket channels.`,
    color: 0x57f287,
    footer: "Staff role saved successfully.",
  });
  return message.reply({ embeds: [embed] });
}
