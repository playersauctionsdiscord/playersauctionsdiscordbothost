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
import { setConfig, getConfig } from "../utils/db.js";

const sessionCache = new Map();

function defaultSession() {
  return {
    embed1: { title: "Embed 1 Title", description: "Click **✏️ Embed 1** to set this text." },
    embed2: { title: "Embed 2 Title", description: "Click **✏️ Embed 2** to set this text." },
    embed3: { title: "Embed 3 Title", description: "Click **✏️ Embed 3** to set this text." },
  };
}

function buildControlRow() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("fw_embed1").setLabel("✏️ Embed 1").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("fw_embed2").setLabel("✏️ Embed 2").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("fw_embed3").setLabel("✏️ Embed 3").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("fw_save").setLabel("✅ Save & Push").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("fw_cancel").setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
    ),
  ];
}

function buildPreviewEmbeds(session) {
  const colors = [0xff85c2, 0xa855f7, 0x5865f2];
  return ["embed1", "embed2", "embed3"].map((key, i) =>
    new EmbedBuilder()
      .setColor(colors[i])
      .setTitle(session[key].title || "(no title)")
      .setDescription(session[key].description || "(no description)")
  );
}

function buildFlowerButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("fw_join")
        .setLabel("💲 Join and be Rich")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("fw_deny")
        .setLabel("😭 Deny and Cry More")
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

export async function run(message) {
  const guildId = message.guild.id;

  // Pre-load saved values if they exist
  const [e1t, e1d, e2t, e2d, e3t, e3d] = await Promise.all([
    getConfig("flowers_embed1_title", "Embed 1 Title"),
    getConfig("flowers_embed1_desc", "Click **✏️ Embed 1** to set this text."),
    getConfig("flowers_embed2_title", "Embed 2 Title"),
    getConfig("flowers_embed2_desc", "Click **✏️ Embed 2** to set this text."),
    getConfig("flowers_embed3_title", "Embed 3 Title"),
    getConfig("flowers_embed3_desc", "Click **✏️ Embed 3** to set this text."),
  ]);

  sessionCache.set(guildId, {
    embed1: { title: e1t, description: e1d },
    embed2: { title: e2t, description: e2d },
    embed3: { title: e3t, description: e3d },
  });

  const session = sessionCache.get(guildId);

  const controlEmbed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle("🌸 Flower Panel Builder")
    .setDescription(
      "> Configure your 3 embeds using the buttons below.\n" +
      "> The **live preview** above updates as you make changes.\n\n" +
      "**✏️ Embed 1 / 2 / 3** — set title and description for each embed\n" +
      "**✅ Save & Push** — saves to database and pushes the panel to this channel\n" +
      "**❌ Cancel** — discard changes\n\n" +
      "-# Only you can use these controls."
    );

  const previewMsg = await message.channel.send({
    content: "-# 👇 Live Preview — updates as you configure",
    embeds: buildPreviewEmbeds(session),
    components: buildFlowerButtons(),
  });

  const controlMsg = await message.channel.send({
    embeds: [controlEmbed],
    components: buildControlRow(),
  });

  const collector = controlMsg.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 600_000,
  });

  collector.on("collect", async (interaction) => {
    const session = sessionCache.get(guildId);
    if (!session) {
      await interaction.reply({ content: "Session expired. Run `.setflowertext` again.", flags: MessageFlags.Ephemeral });
      return;
    }

    // ── Cancel ─────────────────────────────────────────────────────
    if (interaction.customId === "fw_cancel") {
      sessionCache.delete(guildId);
      collector.stop("cancelled");
      await previewMsg.delete().catch(() => {});
      await interaction.update({ content: "❌ Flower panel builder cancelled.", embeds: [], components: [] });
      return;
    }

    // ── Save & Push ─────────────────────────────────────────────────
    if (interaction.customId === "fw_save") {
      await interaction.deferUpdate();

      await Promise.all([
        setConfig("flowers_embed1_title", session.embed1.title),
        setConfig("flowers_embed1_desc",  session.embed1.description),
        setConfig("flowers_embed2_title", session.embed2.title),
        setConfig("flowers_embed2_desc",  session.embed2.description),
        setConfig("flowers_embed3_title", session.embed3.title),
        setConfig("flowers_embed3_desc",  session.embed3.description),
      ]);

      sessionCache.delete(guildId);
      collector.stop("saved");

      await previewMsg.delete().catch(() => {});
      await controlMsg.edit({ content: "✅ Flower panel saved and pushed!", embeds: [], components: [] }).catch(() => {});

      await message.channel.send({
        embeds: buildPreviewEmbeds(session),
        components: buildFlowerButtons(),
      });
      return;
    }

    // ── Embed editors (1 / 2 / 3) ──────────────────────────────────
    const embedMap = { fw_embed1: "embed1", fw_embed2: "embed2", fw_embed3: "embed3" };
    const embedKey = embedMap[interaction.customId];
    if (!embedKey) return;

    const num = interaction.customId.slice(-1);

    const modal = new ModalBuilder()
      .setCustomId(`fw_modal_${embedKey}_${interaction.id}`)
      .setTitle(`Configure Embed ${num}`);

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Title")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(`Embed ${num} title`)
          .setValue(session[embedKey].title)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Description")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder(`Embed ${num} body text`)
          .setValue(session[embedKey].description)
      )
    );

    await interaction.showModal(modal);

    try {
      const resp = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === interaction.user.id,
        time: 120_000,
      });
      await resp.deferUpdate();

      session[embedKey].title       = resp.fields.getTextInputValue("title").trim();
      session[embedKey].description = resp.fields.getTextInputValue("description").trim();
      sessionCache.set(guildId, session);

      await previewMsg.edit({
        embeds: buildPreviewEmbeds(session),
        components: buildFlowerButtons(),
      }).catch(() => {});
    } catch (_) {
      // modal timed out — ignore
    }
  });

  collector.on("end", (_, reason) => {
    if (reason !== "saved" && reason !== "cancelled") {
      sessionCache.delete(guildId);
      controlMsg.edit({ content: "⏰ Builder session timed out.", embeds: [], components: [] }).catch(() => {});
      previewMsg.delete().catch(() => {});
    }
  });
}
