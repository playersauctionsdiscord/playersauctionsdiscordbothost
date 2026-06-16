import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message) {
  const confirmEmbed = await buildEmbed({
    title: "Trade Confirmation",
    description:
      `### Confirm\n` +
      `> Do both of you confirm this trade? Please select **Yes** or **No** below.\n\n` +
      `-# Both traders must respond before the MM proceeds.`,
    color: 0x5865f2,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("trade_confirm")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("trade_deny")
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
  );

  const sent = await message.channel.send({ embeds: [confirmEmbed], components: [row] });

  const confirmedUsers = new Set();
  const respondedUsers = new Set(); // each user may only respond once
  let finished = false;
  const MAX_TRADERS = 2;

  const collector = sent.createMessageComponentCollector({ time: 600_000 });

  collector.on("collect", async (interaction) => {
    if (finished) {
      await interaction.reply({ content: "This confirmation panel is already closed.", ephemeral: true });
      return;
    }

    // Each user may only press one button once
    if (respondedUsers.has(interaction.user.id)) {
      await interaction.reply({ content: "You have already responded to this trade confirmation.", ephemeral: true });
      return;
    }
    respondedUsers.add(interaction.user.id);

    await interaction.deferUpdate();

    if (interaction.customId === "trade_confirm") {
      confirmedUsers.add(interaction.user.id);
      await interaction.followUp({
        content: `✅ <@${interaction.user.id}> has confirmed the trade. (${confirmedUsers.size}/${MAX_TRADERS} confirmations)`,
      });

      if (confirmedUsers.size >= MAX_TRADERS) {
        finished = true;
        collector.stop();
        const clearedEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("Trade Confirmed — Both Parties Agreed")
          .setDescription(
            `> Both traders have confirmed.\n> The MM may now proceed with the final trade execution.\n\n-# This stage is now cleared.`
          );
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("trade_confirm").setLabel("Confirm").setStyle(ButtonStyle.Success).setDisabled(true),
          new ButtonBuilder().setCustomId("trade_deny").setLabel("Deny").setStyle(ButtonStyle.Danger).setDisabled(true)
        );
        await sent.edit({ components: [disabledRow] });
        await sent.channel.send({ embeds: [clearedEmbed] });
      }
    } else {
      finished = true;
      collector.stop();
      const deniedEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("Trade Denied")
        .setDescription(
          `> <@${interaction.user.id}> has **denied** the trade.\n> Please resolve any issues before proceeding.\n\n-# A staff member may be needed.`
        );
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("trade_confirm").setLabel("Confirm").setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId("trade_deny").setLabel("Deny").setStyle(ButtonStyle.Danger).setDisabled(true)
      );
      await sent.edit({ components: [disabledRow] });
      await sent.channel.send({ embeds: [deniedEmbed] });
    }
  });
}
