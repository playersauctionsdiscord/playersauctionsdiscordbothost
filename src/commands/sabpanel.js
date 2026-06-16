import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";
import { getConfig } from "../utils/db.js";

const BASES = [
  { label: "Diamond Base", value: "diamond", description: "5+ Garamas or $20" },
  { label: "Rainbow Base", value: "rainbow", description: "5+ Garamas or $20" },
  { label: "Candy Base", value: "candy", description: "3+ Garamas or $8" },
  { label: "Lava Base", value: "lava", description: "4+ Garamas or $10" },
  { label: "Galaxy Base", value: "galaxy", description: "4+ Garamas or $10" },
  { label: "Gold Base", value: "gold", description: "4+ Garamas or $10" },
  { label: "Yin Yang Base", value: "yinyang", description: "5+ Garamas or $15" },
  { label: "Radioactive Base", value: "radioactive", description: "5+ Garamas or $17" },
  { label: "Cursed Base", value: "cursed", description: "5+ Garamas or $17" },
  { label: "Divine Base", value: "divine", description: "8+ Garamas or $25" },
  { label: "Halloween Base", value: "halloween", description: "$4 or 1–2 Garamas" },
  { label: "Christmas Base", value: "christmas", description: "$4 or 1–2 Garamas" },
  { label: "Aquatic Base", value: "aquatic", description: "$4 or 1–2 Garamas" },
  { label: "Easter Base", value: "easter", description: "$4 or 1–2 Garamas" },
];

export async function run(message) {
  const embed = await buildEmbed({
    title: "Indexing Service",
    description:
      `> Select one of the available bases below and a professional indexer will assist you.\n\n` +
      `One of our professional indexers will assist you in completing it!\n\n` +
      BASES.map((b) => `\`${b.label}\` — ${b.description}`).join("\n") +
      `\n\n-# Collateral may be required • pricing is negotiable.`,
    color: 0x5865f2,
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId("sabpanel_select")
    .setPlaceholder("Select a base mutation...")
    .addOptions(
      BASES.map((b) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(b.label)
          .setValue(b.value)
          .setDescription(b.description)
      )
    );

  const row = new ActionRowBuilder().addComponents(select);
  const sent = await message.channel.send({ embeds: [embed], components: [row] });

  const collector = sent.createMessageComponentCollector({ time: 600_000 });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "sabpanel_select") {
      const selectedValue = interaction.values[0];
      const selectedBase = BASES.find((b) => b.value === selectedValue);

      const modal = new ModalBuilder()
        .setCustomId(`sabpanel_modal_${selectedValue}`)
        .setTitle(`${selectedBase.label} — Indexing Request`);

      const indexInput = new TextInputBuilder()
        .setCustomId("index_progress")
        .setLabel("Index Progress")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("How much have you indexed so far?")
        .setRequired(true);

      const paymentInput = new TextInputBuilder()
        .setCustomId("payment_method")
        .setLabel("Payment Method")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g. Garamas, USD, Robux")
        .setRequired(true);

      const linkInput = new TextInputBuilder()
        .setCustomId("link_accessibility")
        .setLabel("Link Accessibility")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Can you join via links? Yes / No")
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(indexInput),
        new ActionRowBuilder().addComponents(paymentInput),
        new ActionRowBuilder().addComponents(linkInput)
      );

      await interaction.showModal(modal);

      try {
        const modalResponse = await interaction.awaitModalSubmit({ time: 300_000 });

        const indexProgress = modalResponse.fields.getTextInputValue("index_progress");
        const paymentMethod = modalResponse.fields.getTextInputValue("payment_method");
        const linkAccessibility = modalResponse.fields.getTextInputValue("link_accessibility");

        // Create private ticket channel
        const staffRoleId = await getConfig("staff_role_id", "");
        const guild = message.guild;

        const ticketChannel = await guild.channels.create({
          name: `sab-${selectedValue}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ""),
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            ...(staffRoleId
              ? [{
                  id: staffRoleId,
                  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                }]
              : []),
          ],
        });

        const ticketEmbed = await buildEmbed({
          title: "Indexing Service Request",
          description:
            `> A new indexing request has been created.\n\n` +
            `**Requester:** <@${interaction.user.id}>\n` +
            `**Selected Base:** \`${selectedBase.label}\` — ${selectedBase.description}\n` +
            `**Index Progress:** \`${indexProgress}\`\n` +
            `**Payment Method:** \`${paymentMethod}\`\n` +
            `**Can Join Links:** \`${linkAccessibility}\`\n\n` +
            `-# An indexer will be with you shortly.`,
          color: 0x5865f2,
        });

        let pingContent = "";
        if (staffRoleId) pingContent = `<@&${staffRoleId}>`;

        await ticketChannel.send({
          content: pingContent || undefined,
          embeds: [ticketEmbed],
        });

        await modalResponse.reply({
          content: `✅ Your indexing request has been created in <#${ticketChannel.id}>!`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("SAB panel modal error:", err.message);
      }
    }
  });
}
