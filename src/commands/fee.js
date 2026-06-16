import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message) {
  const feeEmbed = await buildEmbed({
    title: "Middleman Service Fee",
    description:
      `### Thank you for using PlayerAuctions Marketplace MM\n` +
      `> Your items are currently being __held.__ To proceed, please make the donation the MM deserves.\n\n` +
      `### Payment\n` +
      `> Please wait while a MM lists a price. Discuss with your trader how you want to pay — split it or one party covers the full fee.\n\n` +
      `-# Once you click a button, you can't redo it. This command is \`.fee\``,
    color: 0x5865f2,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fee_split")
      .setLabel("50/50 Split")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("fee_full")
      .setLabel("100% Full Fee")
      .setStyle(ButtonStyle.Secondary)
  );

  const sent = await message.channel.send({ embeds: [feeEmbed], components: [row] });

  // Lock so only the first button press ever counts
  let locked = false;

  const collector = sent.createMessageComponentCollector({ time: 300_000 });

  collector.on("collect", async (interaction) => {
    if (locked) {
      await interaction.reply({ content: "This fee option has already been selected.", ephemeral: true });
      return;
    }
    locked = true;
    collector.stop();

    await interaction.deferUpdate();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("fee_split")
        .setLabel("50/50 Split")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("fee_full")
        .setLabel("100% Full Fee")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    await sent.edit({ components: [disabledRow] });

    const label = interaction.customId === "fee_split"
      ? "split the Middleman Fee 50/50"
      : "cover the full 100% Middleman Fee";

    const announcement = new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription(
        `<@${interaction.user.id}> have decided to **${label}**.\n\nThe MM will proceed accordingly. Please follow their instructions.`
      );

    await interaction.followUp({ embeds: [announcement] });
  });
}
