import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";

// In-memory cache per guild
const sessionCache = new Map();

export async function run(message) {
  const guildId = message.guild.id;
  sessionCache.set(guildId, {
    title: "New Panel",
    description: "Configure this embed using the buttons below.",
    color: 0x5865f2,
    image: "",
    footer: "",
    webhookUrl: "",
    buttons: [],
    skipButton: false,
  });

  const embed = await buildEmbed({
    title: "Ticket Panel Builder",
    description: "> Use the buttons below to configure your ticket panel embed.\n> Press ✅ Continue to Channels when done.",
    color: 0x5865f2,
    footer: "Changes are stored in memory until you confirm.",
  });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ts_title").setLabel("✏️ Title").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ts_desc").setLabel("📄 Description").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ts_color").setLabel("🎨 Color").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ts_image").setLabel("🖼️ Image").setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ts_webhook").setLabel("🔧 Webhook").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ts_button").setLabel("🔵 Button").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ts_custombtn").setLabel("🔗 Custom Buttons").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ts_skip").setLabel("➡️ Skip Button: OFF").setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ts_continue").setLabel("✅ Continue to Channels").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ts_cancel").setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
  );

  const sent = await message.channel.send({
    embeds: [embed],
    components: [row1, row2, row3],
  });

  const collector = sent.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 300_000,
  });

  collector.on("collect", async (interaction) => {
    const session = sessionCache.get(guildId) || {};

    if (interaction.customId === "ts_cancel") {
      sessionCache.delete(guildId);
      await interaction.update({ content: "❌ Panel builder cancelled.", embeds: [], components: [] });
      return collector.stop();
    }

    if (interaction.customId === "ts_continue") {
      const finalEmbed = new EmbedBuilder()
        .setTitle(session.title)
        .setDescription(session.description)
        .setColor(parseInt(session.color?.replace("#", ""), 16) || 0x5865f2);
      if (session.image) finalEmbed.setImage(session.image);
      if (session.footer) finalEmbed.setFooter({ text: session.footer });

      await interaction.update({ content: "✅ Panel pushed to channel!", components: [] });
      await message.channel.send({ embeds: [finalEmbed] });
      sessionCache.delete(guildId);
      return collector.stop();
    }

    if (interaction.customId === "ts_skip") {
      session.skipButton = !session.skipButton;
      sessionCache.set(guildId, session);
      const updatedRow2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ts_webhook").setLabel("🔧 Webhook").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ts_button").setLabel("🔵 Button").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ts_custombtn").setLabel("🔗 Custom Buttons").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("ts_skip")
          .setLabel(`➡️ Skip Button: ${session.skipButton ? "ON" : "OFF"}`)
          .setStyle(session.skipButton ? ButtonStyle.Success : ButtonStyle.Secondary)
      );
      await interaction.update({ components: [row1, updatedRow2, row3] });
      return;
    }

    // Modal-based inputs
    const modalMap = {
      ts_title: { id: "ts_modal_title", title: "Set Panel Title", fields: [{ id: "value", label: "Title", placeholder: "Enter panel title" }] },
      ts_desc: { id: "ts_modal_desc", title: "Set Description", fields: [{ id: "value", label: "Description", placeholder: "Enter description", long: true }] },
      ts_color: { id: "ts_modal_color", title: "Set Color", fields: [{ id: "value", label: "Hex Color", placeholder: "#5865F2" }] },
      ts_image: { id: "ts_modal_image", title: "Set Image URL", fields: [{ id: "value", label: "Image URL", placeholder: "https://..." }, { id: "footer", label: "Footer Text", placeholder: "Optional footer text" }] },
      ts_webhook: { id: "ts_modal_webhook", title: "Set Webhook URL", fields: [{ id: "value", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." }] },
      ts_button: { id: "ts_modal_button", title: "Add Button", fields: [{ id: "value", label: "Button Label", placeholder: "e.g. Open Ticket" }] },
      ts_custombtn: { id: "ts_modal_custombtn", title: "Custom Buttons", fields: [{ id: "value", label: "Button Labels (comma-separated)", placeholder: "Button 1, Button 2" }] },
    };

    const modalDef = modalMap[interaction.customId];
    if (!modalDef) return;

    const modal = new ModalBuilder().setCustomId(modalDef.id).setTitle(modalDef.title);
    for (const f of modalDef.fields) {
      const input = new TextInputBuilder()
        .setCustomId(f.id)
        .setLabel(f.label)
        .setStyle(f.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(f.id !== "footer")
        .setPlaceholder(f.placeholder || "");
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    }

    await interaction.showModal(modal);

    try {
      const resp = await interaction.awaitModalSubmit({ time: 120_000 });
      const value = resp.fields.getTextInputValue("value");
      const footer = resp.fields.fields?.get("footer")?.value || "";

      if (interaction.customId === "ts_title") session.title = value;
      if (interaction.customId === "ts_desc") session.description = value;
      if (interaction.customId === "ts_color") session.color = value;
      if (interaction.customId === "ts_image") { session.image = value; if (footer) session.footer = footer; }
      if (interaction.customId === "ts_webhook") session.webhookUrl = value;
      if (interaction.customId === "ts_button") session.buttons.push(value);
      if (interaction.customId === "ts_custombtn") session.buttons = value.split(",").map((s) => s.trim());

      sessionCache.set(guildId, session);
      await resp.reply({ content: `✅ Updated **${modalDef.title.replace("Set ", "")}**.`, ephemeral: true });
    } catch (_) {}
  });

  collector.on("end", () => sessionCache.delete(guildId));
}
