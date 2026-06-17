import { buildEmbed } from "../utils/embed.js";

// In-memory AFK store: userId → { reason, timestamp }
const afkStore = new Map();

export const store = afkStore;

export async function run(message, args) {
  const reason = args.join(" ") || "AFK";

  afkStore.set(message.author.id, { reason, since: Date.now() });

  const embed = await buildEmbed({
    title: "AFK Set",
    description:
      `> <@${message.author.id}> is now AFK.\n\n` +
      `**Reason:** \`${reason}\`\n\n` +
      `-# I'll let people know when they mention you.`,
    color: 0x5865f2,
  });

  return message.reply({ embeds: [embed] });
}
