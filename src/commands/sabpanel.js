import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";
import { getConfig } from "../utils/db.js";

const BASES = [
  { label: "Diamond Base",     value: "diamond",     description: "5+ Garamas or $20",  emoji: { id: "1514242526314496091", name: "Diamond_Mutation" } },
  { label: "Rainbow Base",     value: "rainbow",     description: "5+ Garamas or $20",  emoji: { id: "1514242532257566792", name: "Rainbow_Mutation" } },
  { label: "Candy Base",       value: "candy",       description: "3+ Garamas or $8",   emoji: { id: "1514242534736531478", name: "Candy_Mutation" } },
  { label: "Lava Base",        value: "lava",        description: "4+ Garamas or $10",  emoji: { id: "1514242528549802004", name: "Lava_Mutation" } },
  { label: "Galaxy Base",      value: "galaxy",      description: "4+ Garamas or $10",  emoji: { id: "1514242551220146339", name: "Galaxy_Mutation" } },
  { label: "Gold Base",        value: "gold",        description: "4+ Garamas or $10",  emoji: { id: "1514242536871301203", name: "Gold_Mutation" } },
  { label: "Yin Yang Base",    value: "yinyang",     description: "5+ Garamas or $15",  emoji: { id: "1514243476261441616", name: "YinYang_Mutation" } },
  { label: "Radioactive Base", value: "radioactive", description: "5+ Garamas or $17",  emoji: { id: "1514242539840864357", name: "Radioactive_Mutation" } },
  { label: "Cursed Base",      value: "cursed",      description: "5+ Garamas or $17",  emoji: { id: "1514242547302793277", name: "Cursed_Mutation" } },
  { label: "Divine Base",      value: "divine",      description: "8+ Garamas or $25",  emoji: { id: "1514242542642659449", name: "Divine_Mutation" } },
  { label: "Halloween Base",   value: "halloween",   description: "$4 or 1–2 Garamas",  emoji: { id: "1514242553342333000", name: "headlesshorseman" } },
  { label: "Christmas Base",   value: "christmas",   description: "$4 or 1–2 Garamas",  emoji: { name: "🎄" } },
  { label: "Aquatic Base",     value: "aquatic",     description: "$4 or 1–2 Garamas",  emoji: { name: "🫧" } },
  { label: "Easter Base",      value: "easter",      description: "$4 or 1–2 Garamas",  emoji: { id: "1516736855255678976", name: "Indexing_Service" } },
];

const emojiStr = (b) => b.emoji.id ? `<:${b.emoji.name}:${b.emoji.id}>` : b.emoji.name;

const openingTicket = new Set();

export async function run(message) {
  const embed = await buildEmbed({
    title: "Indexing Service",
    description:
      `> Select one of the available bases below and a professional indexer will assist you.\n\n` +
      `One of our professional indexers will assist you in completing it!\n\n` +
      BASES.map((b) => `${emojiStr(b)}  \`${b.label} — ${b.description}\``).join("\n") +
      `\n\n-# Collateral may be required • pricing is negotiable.`,
    color: 0x5865f2,
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId("sabpanel_select")
    .setPlaceholder("Select a base mutation...")
    .addOptions(
      BASES.map((b) => {
        const opt = new StringSelectMenuOptionBuilder()
          .setLabel(b.label)
          .setValue(b.value)
          .setDescription(b.description)
          .setEmoji(b.emoji);
        return opt;
      })
    );

  const row = new ActionRowBuilder().addComponents(select);
  const sent = await message.channel.send({ embeds: [embed], components: [row] });

  const collector = sent.createMessageComponentCollector({ time: 600_000 });

  collector.on("collect", async (interaction) => {
    if (interaction.customId !== "sabpanel_select") return;

    if (openingTicket.has(interaction.user.id)) {
      await interaction.reply({ content: "⏳ Your previous request is still being processed. Please wait.", ephemeral: true });
      return;
    }
    openingTicket.add(interaction.user.id);

    try {
      const selectedValue = interaction.values[0];
      const selectedBase = BASES.find((b) => b.value === selectedValue);

      const modal = new ModalBuilder()
        .setCustomId(`sabpanel_modal_${interaction.id}`)
        .setTitle(`${selectedBase.label} — Indexing Request`);

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("index_progress")
            .setLabel("Index Progress")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("How much have you indexed so far?")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("payment_method")
            .setLabel("Payment Method")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. Garamas, USD, Robux")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("link_accessibility")
            .setLabel("Link Accessibility")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Can you join via links? Yes / No")
            .setRequired(true)
        )
      );

      await interaction.showModal(modal);

      const modalResponse = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === interaction.user.id,
        time: 300_000,
      });

      const indexProgress    = modalResponse.fields.getTextInputValue("index_progress");
      const paymentMethod    = modalResponse.fields.getTextInputValue("payment_method");
      const linkAccessibility = modalResponse.fields.getTextInputValue("link_accessibility");

      await modalResponse.deferReply({ ephemeral: true });

      const staffRoleId = await getConfig("staff_role_id", "");
      const guild = message.guild;

      const ticketChannel = await guild.channels.create({
        name: `sab-${selectedValue}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 100),
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...(staffRoleId ? [{ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
        ],
      });

      const ticketEmbed = await buildEmbed({
        title: "Indexing Service Request",
        description:
          `> A new indexing request has been created.\n\n` +
          `**Requester:** <@${interaction.user.id}>\n` +
          `**Selected Base:** ${emojiStr(selectedBase)} \`${selectedBase.label}\` — ${selectedBase.description}\n` +
          `**Index Progress:** \`${indexProgress}\`\n` +
          `**Payment Method:** \`${paymentMethod}\`\n` +
          `**Can Join Links:** \`${linkAccessibility}\`\n\n` +
          `-# An indexer will be with you shortly.`,
        color: 0x5865f2,
        showBanner: true,
      });

      const pingContent = staffRoleId ? `<@&${staffRoleId}>` : "";
      await ticketChannel.send({ content: pingContent || undefined, embeds: [ticketEmbed] });

      await modalResponse.editReply({ content: `✅ Your indexing request has been created in <#${ticketChannel.id}>!` });
    } catch (err) {
      if (!err.message?.includes("time")) console.error("SAB panel error:", err.message);
    } finally {
      openingTicket.delete(interaction.user.id);
    }
  });
}
