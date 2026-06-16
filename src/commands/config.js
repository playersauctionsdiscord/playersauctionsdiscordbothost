import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";
import { setConfig, getConfig } from "../utils/db.js";

export async function run(message) {
  if (message.author.id !== message.guild.ownerId && !message.member.permissions.has(8n)) {
    return message.reply("❌ This command is restricted to developers and server owners.");
  }

  const staffRoleId = await getConfig("staff_role_id", "None set");
  const logChannelId = await getConfig("log_channel_id", "None set");
  const bannerUrl = await getConfig("global_banner_url", "None set");

  const embed = await buildEmbed({
    title: "Admin Configuration Dashboard",
    description:
      `> Current Configuration\n\n` +
      `**Staff Role:** ${staffRoleId !== "None set" ? `<@&${staffRoleId}>` : "Not configured"}\n` +
      `**Log Channel:** ${logChannelId !== "None set" ? `<#${logChannelId}>` : "Not configured"}\n` +
      `**Global Banner:** ${bannerUrl !== "None set" && bannerUrl ? bannerUrl : "Not configured"}\n\n` +
      `-# Use the menu below to adjust settings.`,
    color: 0xfee75c,
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId("config_select")
    .setPlaceholder("Select a setting to configure...")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("Set Log Channel ID").setValue("set_log_channel").setDescription("Where transcripts and alerts are sent"),
      new StringSelectMenuOptionBuilder().setLabel("Set Global Banner URL").setValue("set_banner").setDescription("Image URL for embed banners"),
      new StringSelectMenuOptionBuilder().setLabel("Set Global Server Title").setValue("set_title").setDescription("Title used across all embeds"),
      new StringSelectMenuOptionBuilder().setLabel("Set Staff Role ID").setValue("set_staff_role").setDescription("Role ID for staff ping in tickets")
    );

  const row = new ActionRowBuilder().addComponents(select);
  const sent = await message.channel.send({ embeds: [embed], components: [row] });

  const collector = sent.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 120_000,
  });

  const configModals = {
    set_log_channel: { key: "log_channel_id", label: "Log Channel ID", placeholder: "Paste channel ID" },
    set_banner: { key: "global_banner_url", label: "Banner URL", placeholder: "https://..." },
    set_title: { key: "global_server_title", label: "Server Title", placeholder: "PlayerAuctions Marketplace" },
    set_staff_role: { key: "staff_role_id", label: "Staff Role ID", placeholder: "Paste role ID" },
  };

  collector.on("collect", async (interaction) => {
    const def = configModals[interaction.values?.[0]];
    if (!def) return;

    const modal = new ModalBuilder()
      .setCustomId(`config_modal_${interaction.values[0]}`)
      .setTitle(`Configure: ${def.label}`);

    const input = new TextInputBuilder()
      .setCustomId("value")
      .setLabel(def.label)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(def.placeholder)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);

    try {
      const resp = await interaction.awaitModalSubmit({ time: 60_000 });
      const value = resp.fields.getTextInputValue("value");
      await setConfig(def.key, value);
      await resp.reply({ content: `✅ **${def.label}** has been updated.`, ephemeral: true });
    } catch (_) {}
  });
}
