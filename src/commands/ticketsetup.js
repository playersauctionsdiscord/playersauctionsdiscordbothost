import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getGlobals } from "../utils/embed.js";

// Per-guild session cache
const sessionCache = new Map();

function parseColor(raw) {
  if (typeof raw === "number") return raw;
  if (!raw) return 0x5865f2;
  const cleaned = raw.replace(/^#/, "");
  const parsed = parseInt(cleaned, 16);
  return isNaN(parsed) ? 0x5865f2 : parsed;
}

function buildControlRows(session) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ts_title").setLabel("✏️ Title").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ts_desc").setLabel("📄 Description").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ts_color").setLabel("🎨 Color").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ts_image").setLabel("🖼️ Image").setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ts_footer").setLabel("📝 Footer").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ts_button").setLabel("🔵 Add Button").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ts_clearbtn").setLabel("🗑️ Clear Buttons").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ts_skip")
      .setLabel(`➡️ Skip Button: ${session.skipButton ? "ON" : "OFF"}`)
      .setStyle(session.skipButton ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ts_continue").setLabel("✅ Push Panel to Channel").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ts_cancel").setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
  );

  return [row1, row2, row3];
}

async function buildPreviewEmbed(session) {
  const { bannerUrl } = await getGlobals();

  const embed = new EmbedBuilder()
    .setColor(parseColor(session.color))
    .setTitle(session.title || "(no title set)")
    .setDescription(session.description || "(no description set)");

  if (session.image) embed.setImage(session.image);
  if (session.footer) embed.setFooter({ text: session.footer });
  if (bannerUrl) embed.setImage(session.image || bannerUrl);

  return embed;
}

function buildPreviewButtons(session) {
  if (!session.buttons || session.buttons.length === 0) return [];
  // Max 5 buttons per row, max 5 rows — but for panel buttons keep it simple in one row (up to 5)
  const chunks = [];
  for (let i = 0; i < session.buttons.length; i += 5) {
    chunks.push(session.buttons.slice(i, i + 5));
  }
  return chunks.slice(0, 5).map((chunk) =>
    new ActionRowBuilder().addComponents(
      chunk.map((label, idx) =>
        new ButtonBuilder()
          .setCustomId(`panel_btn_${idx}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary)
      )
    )
  );
}

async function updatePreview(previewMsg, session) {
  const embed = await buildPreviewEmbed(session);
  const btnRows = buildPreviewButtons(session);
  await previewMsg.edit({ embeds: [embed], components: btnRows }).catch(() => {});
}

export async function run(message) {
  const guildId = message.guild.id;

  // Initialise a fresh session
  sessionCache.set(guildId, {
    title: "New Panel",
    description: "Click the buttons above to customise this panel.",
    color: 0x5865f2,
    image: "",
    footer: "",
    buttons: [],
    skipButton: false,
  });

  const session = sessionCache.get(guildId);

  // ── Builder control panel ──────────────────────────────────────────────
  const controlEmbed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle("🛠️ Ticket Panel Builder")
    .setDescription(
      "> Use the buttons below to configure your panel.\n" +
      "> The **live preview** above updates as you make changes.\n\n" +
      "**✏️ Title** — set the embed title\n" +
      "**📄 Description** — set the embed body text\n" +
      "**🎨 Color** — set the embed colour (hex e.g. `#FF0000`)\n" +
      "**🖼️ Image** — set the embed image URL\n" +
      "**📝 Footer** — set the embed footer text\n" +
      "**🔵 Add Button** — add a button to the panel output\n" +
      "**🗑️ Clear Buttons** — remove all added buttons\n\n" +
      "Press **✅ Push Panel to Channel** when done."
    )
    .setFooter({ text: "Only you can use these controls." });

  // Send live preview first, then controls beneath
  const previewEmbed = await buildPreviewEmbed(session);
  const previewMsg = await message.channel.send({
    content: "-# 👇 Live Preview — updates as you configure",
    embeds: [previewEmbed],
    components: [],
  });

  const controlMsg = await message.channel.send({
    embeds: [controlEmbed],
    components: buildControlRows(session),
  });

  const collector = controlMsg.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 600_000,
  });

  collector.on("collect", async (interaction) => {
    const session = sessionCache.get(guildId);
    if (!session) {
      await interaction.reply({ content: "Session expired. Run `.ticketsetup` again.", flags: MessageFlags.Ephemeral });
      return;
    }

    // ── Cancel ─────────────────────────────────────────────────────────
    if (interaction.customId === "ts_cancel") {
      sessionCache.delete(guildId);
      collector.stop();
      await previewMsg.delete().catch(() => {});
      await interaction.update({ content: "❌ Panel builder cancelled.", embeds: [], components: [] });
      return;
    }

    // ── Push to channel ────────────────────────────────────────────────
    if (interaction.customId === "ts_continue") {
      sessionCache.delete(guildId);
      collector.stop();

      const finalEmbed = await buildPreviewEmbed(session);
      const finalBtnRows = buildPreviewButtons(session);

      // Delete builder messages
      await previewMsg.delete().catch(() => {});
      await interaction.update({ content: "✅ Panel pushed to channel!", embeds: [], components: [] });

      // Push final panel — embed + any configured buttons on the same message
      await message.channel.send({
        embeds: [finalEmbed],
        components: finalBtnRows,
      });
      return;
    }

    // ── Toggle skip button ─────────────────────────────────────────────
    if (interaction.customId === "ts_skip") {
      session.skipButton = !session.skipButton;
      sessionCache.set(guildId, session);
      await interaction.update({ components: buildControlRows(session) });
      return;
    }

    // ── Clear all buttons ──────────────────────────────────────────────
    if (interaction.customId === "ts_clearbtn") {
      session.buttons = [];
      sessionCache.set(guildId, session);
      await interaction.deferUpdate();
      await updatePreview(previewMsg, session);
      await interaction.followUp({ content: "🗑️ All panel buttons cleared.", flags: MessageFlags.Ephemeral });
      return;
    }

    // ── Modal-based edits ──────────────────────────────────────────────
    const modalDefs = {
      ts_title:   { title: "Set Panel Title",       fields: [{ id: "value", label: "Title",             placeholder: "e.g. Request Middleman" }] },
      ts_desc:    { title: "Set Description",        fields: [{ id: "value", label: "Description",       placeholder: "Enter embed body text", long: true }] },
      ts_color:   { title: "Set Embed Color",        fields: [{ id: "value", label: "Hex Color",         placeholder: "#5865F2" }] },
      ts_image:   { title: "Set Image URL",          fields: [{ id: "value", label: "Image URL",         placeholder: "https://i.imgur.com/..." }] },
      ts_footer:  { title: "Set Footer Text",        fields: [{ id: "value", label: "Footer",            placeholder: "e.g. PlayerAuctions Marketplace" }] },
      ts_button:  { title: "Add Panel Button",       fields: [{ id: "value", label: "Button Label",      placeholder: "e.g. Open Ticket" }] },
    };

    const def = modalDefs[interaction.customId];
    if (!def) return;

    const modal = new ModalBuilder()
      .setCustomId(`ts_modal_${interaction.customId}_${interaction.id}`)
      .setTitle(def.title);

    for (const f of def.fields) {
      const input = new TextInputBuilder()
        .setCustomId(f.id)
        .setLabel(f.label)
        .setStyle(f.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(f.placeholder || "");
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    }

    await interaction.showModal(modal);

    try {
      const resp = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === interaction.user.id,
        time: 120_000,
      });
      await resp.deferUpdate();

      const value = resp.fields.getTextInputValue("value").trim();

      if (interaction.customId === "ts_title")   session.title       = value;
      if (interaction.customId === "ts_desc")    session.description = value;
      if (interaction.customId === "ts_color")   session.color       = value;
      if (interaction.customId === "ts_image")   session.image       = value;
      if (interaction.customId === "ts_footer")  session.footer      = value;
      if (interaction.customId === "ts_button")  {
        if (session.buttons.length >= 25) {
          await interaction.followUp({ content: "❌ Maximum 25 buttons reached.", flags: MessageFlags.Ephemeral });
          return;
        }
        session.buttons.push(value);
      }

      sessionCache.set(guildId, session);

      // Update the live preview immediately
      await updatePreview(previewMsg, session);

    } catch (_) {
      // Modal timed out — ignore silently
    }
  });

  collector.on("end", (_, reason) => {
    if (reason === "time") {
      sessionCache.delete(guildId);
      controlMsg.edit({ content: "⏰ Builder session timed out.", embeds: [], components: [] }).catch(() => {});
      previewMsg.delete().catch(() => {});
    }
  });
}
