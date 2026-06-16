import { AttachmentBuilder } from "discord.js";
import { getConfig } from "../utils/db.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message) {
  const channel = message.channel;
  const logChannelId = await getConfig("log_channel_id", "");

  // Fetch full message history
  let allMessages = [];
  let lastId;
  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const fetched = await channel.messages.fetch(options);
    if (fetched.size === 0) break;
    allMessages = allMessages.concat([...fetched.values()]);
    lastId = fetched.last()?.id;
    if (fetched.size < 100) break;
  }

  allMessages.reverse();

  // Build transcript
  const lines = allMessages.map((m) => {
    const ts = new Date(m.createdTimestamp).toUTCString();
    const content = m.content || "[embed/attachment]";
    return `[${ts}] ${m.author.tag}: ${content}`;
  });

  const transcript = lines.join("\n");
  const buffer = Buffer.from(transcript, "utf-8");
  const attachment = new AttachmentBuilder(buffer, {
    name: `transcript-${channel.name}-${Date.now()}.txt`,
  });

  if (logChannelId) {
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const logEmbed = await buildEmbed({
        title: "Ticket Transcript",
        description: `> Channel: **#${channel.name}**\n> Closed by: <@${message.author.id}>\n> Messages: **${allMessages.length}**`,
        color: 0xed4245,
      });
      await logChannel.send({ embeds: [logEmbed], files: [attachment] });
    }
  } else {
    await message.reply({ content: "⚠️ No log channel set. Sending transcript here.", files: [attachment] });
  }

  await channel.delete("Ticket closed by staff");
}
