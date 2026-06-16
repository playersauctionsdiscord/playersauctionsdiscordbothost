import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";
import { getConfig } from "../utils/db.js";

// Prevent the same user from triggering two responses
const handledUsers = new Set();

export async function run(message) {
  const staffRoleId = await getConfig("staff_role_id", "");

  const infoEmbed = await buildEmbed({
    title: "Middleman Info & Explanation",
    description:
      `**What is a Middleman (MM)?**\n> A __trusted person__ with many vouches who helps transactions go smoothly without scams.\n\n` +
      `## Example: One trader is giving $20 for a Garama\n` +
      `> The seller gives the MM the Garama on a private server. The MM holds it safely and confirms both sides are ready. The buyer sends $20 directly to the seller. Once payment is confirmed, the MM releases the Garama to the buyer.`,
    color: 0x5865f2,
  });

  const checkEmbed = await buildEmbed({
    title: "Understanding Check",
    description:
      `> Confirm your understanding of the Middleman process.\n\n` +
      `If you __understand what a Middleman (MM) is,__ click **Yes.**\n` +
      `If not, click **No** and let us know how we can assist you.\n\n` +
      `-# Your response helps us route the ticket correctly.`,
    color: 0x5865f2,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mminfo_yes")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("mminfo_no")
      .setLabel("No")
      .setStyle(ButtonStyle.Danger)
  );

  const sent = await message.channel.send({
    embeds: [infoEmbed, checkEmbed],
    components: [row],
  });

  const collector = sent.createMessageComponentCollector({ time: 300_000 });

  collector.on("collect", async (interaction) => {
    // Each user only gets one response per panel
    const userKey = `${sent.id}_${interaction.user.id}`;
    if (handledUsers.has(userKey)) {
      await interaction.reply({ content: "You have already responded to this panel.", ephemeral: true });
      return;
    }
    handledUsers.add(userKey);
    setTimeout(() => handledUsers.delete(userKey), 600_000);

    await interaction.deferUpdate();

    if (interaction.customId === "mminfo_yes") {
      const yesEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("MM Understanding")
        .setDescription(
          `> User: <@${interaction.user.id}>\nStatus: \`Understands the process\`\n\n-# Cleared to proceed with the trade.`
        );
      await interaction.followUp({ embeds: [yesEmbed] });
    } else {
      const noEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("MM Understanding")
        .setDescription(
          `> User: <@${interaction.user.id}>\nStatus: \`Still confused — needs assistance\`\n\n-# A staff member will walk them through the Middleman process.`
        );
      await interaction.followUp({ embeds: [noEmbed] });
      if (staffRoleId) {
        await interaction.channel.send(
          `<@&${staffRoleId}> — <@${interaction.user.id}> needs guidance on the Middleman process.`
        );
      }
    }
  });

  collector.on("end", () => {
    // Clean up user keys for this panel
    for (const key of handledUsers) {
      if (key.startsWith(sent.id)) handledUsers.delete(key);
    }
  });
}
