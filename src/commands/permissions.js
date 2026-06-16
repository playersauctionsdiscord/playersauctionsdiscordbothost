import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";
import { Permission } from "../utils/db.js";

const ALL_COMMANDS = [
  "settitle", "setbanner", "staffrole", "close", "mminfo",
  "fee", "tradeconfirm", "w", "roblox", "sabpanel",
  "ticketsetup", "help", "list", "config", "permissions",
  "vouchstats", "flop", "setfloptext", "flopstats",
];

export async function run(message) {
  if (!message.member.permissions.has(8n)) {
    return message.reply("❌ This command is restricted to administrators.");
  }

  const embed = await buildEmbed({
    title: "Role Permission Manager",
    description:
      `> Use the menu below to whitelist or blacklist roles from specific commands.\n\n` +
      `-# Select a command to manage its role access.`,
    color: 0xfee75c,
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId("perms_select")
    .setPlaceholder("Select a command to configure...")
    .addOptions(
      ALL_COMMANDS.map((cmd) =>
        new StringSelectMenuOptionBuilder().setLabel(`.${cmd}`).setValue(cmd)
      )
    );

  const row = new ActionRowBuilder().addComponents(select);
  const sent = await message.channel.send({ embeds: [embed], components: [row] });

  const collector = sent.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 120_000,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "perms_select") {
      const cmdName = interaction.values[0];
      const existing = await Permission.findOne({ commandName: cmdName });

      const modal = new ModalBuilder()
        .setCustomId(`perms_modal_${cmdName}`)
        .setTitle(`Permissions: .${cmdName}`);

      const allowInput = new TextInputBuilder()
        .setCustomId("allow_roles")
        .setLabel("Allowed Role IDs (comma-separated)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("123456789, 987654321")
        .setRequired(false)
        .setValue(existing?.allowedRoles?.join(", ") || "");

      const denyInput = new TextInputBuilder()
        .setCustomId("deny_roles")
        .setLabel("Denied Role IDs (comma-separated)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("123456789, 987654321")
        .setRequired(false)
        .setValue(existing?.deniedRoles?.join(", ") || "");

      modal.addComponents(
        new ActionRowBuilder().addComponents(allowInput),
        new ActionRowBuilder().addComponents(denyInput)
      );

      await interaction.showModal(modal);

      try {
        const resp = await interaction.awaitModalSubmit({ time: 60_000 });
        const allowRoles = resp.fields.getTextInputValue("allow_roles")
          .split(",").map((s) => s.trim()).filter(Boolean);
        const denyRoles = resp.fields.getTextInputValue("deny_roles")
          .split(",").map((s) => s.trim()).filter(Boolean);

        await Permission.findOneAndUpdate(
          { commandName: cmdName },
          { allowedRoles: allowRoles, deniedRoles: denyRoles },
          { upsert: true }
        );

        await resp.reply({
          content: `✅ Permissions updated for \`.${cmdName}\`.\nAllowed: ${allowRoles.length ? allowRoles.map((r) => `<@&${r}>`).join(" ") : "None"}\nDenied: ${denyRoles.length ? denyRoles.map((r) => `<@&${r}>`).join(" ") : "None"}`,
          ephemeral: true,
        });
      } catch (_) {}
    }
  });
}
