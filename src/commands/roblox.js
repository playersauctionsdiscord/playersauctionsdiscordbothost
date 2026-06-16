import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import axios from "axios";
import { buildEmbed } from "../utils/embed.js";

export async function run(message, args) {
  const username = args[0];
  if (!username) return message.reply("Usage: `.roblox <username>`");

  try {
    // Get user ID from username
    const usersRes = await axios.post(
      "https://users.roblox.com/v1/usernames/users",
      { usernames: [username], excludeBannedUsers: false },
      { headers: { "Content-Type": "application/json" } }
    );

    const userData = usersRes.data?.data?.[0];
    if (!userData) return message.reply(`❌ No Roblox user found for **${username}**.`);

    const userId = userData.id;
    const displayName = userData.displayName || userData.name;

    // Get detailed user info
    const detailRes = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
    const detail = detailRes.data;

    const createdDate = new Date(detail.created);
    const createdFormatted = createdDate.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });

    const isBanned = detail.isBanned;
    const status = isBanned ? "⛔ Banned" : "✅ Active";
    const profileUrl = `https://www.roblox.com/users/${userId}/profile`;

    const embed = await buildEmbed({
      title: "Roblox Profile Lookup",
      color: isBanned ? 0xed4245 : 0x57f287,
    });

    embed
      .setDescription(
        `[${displayName}](${profileUrl})\n\n` +
        `> Here is the result for **${username}**. Click the button below to visit their profile.\n\n` +
        `> User ID: \`${userId}\`\n` +
        `Created: \`${createdFormatted}\`\n` +
        `Status: \`${status}\``
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("View Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(profileUrl),
      new ButtonBuilder()
        .setLabel("Add Friend")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
    );

    return message.reply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error("Roblox API error:", err?.response?.data || err.message);
    return message.reply("❌ Failed to fetch Roblox profile. Please check the username and try again.");
  }
}
