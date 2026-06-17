import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";

const LINK = "<:linkicon:1516729713190502491>";

const COMMANDS = {
  settitle:      { syntax: ".settitle <text>",      desc: "Overwrites the global server title used in all embeds.", perms: "Admins only." },
  setbanner:     { syntax: ".setbanner <url>",      desc: "Sets the global banner image (must end in .png/.jpg/.gif).", perms: "Admins only." },
  bannerremove:  { syntax: ".bannerremove",          desc: "Removes the global banner image.", perms: "Admins only." },
  staffrole:     { syntax: ".staffrole <@role>",    desc: "Designates a role as staff — pinged in all new ticket channels.", perms: "Admins only." },
  close:         { syntax: ".close",                 desc: "Saves a transcript and deletes the ticket channel.", perms: "Staff only." },
  mminfo:        { syntax: ".mminfo",                desc: "Posts the Middleman info panel with Yes/No understanding buttons.", perms: "All users." },
  fee:           { syntax: ".fee",                   desc: "Prompts traders to select how the MM fee is paid (50/50 or 100%).", perms: "Staff only (inside ticket)." },
  tradeconfirm:  { syntax: ".tradeconfirm",          desc: "Creates a trade confirmation checkpoint for both traders.", perms: "Staff only (inside ticket)." },
  w:             { syntax: ".w [@user]",             desc: "Shows Discord profile info. No @ = your own info.", perms: "Staff only." },
  roblox:        { syntax: ".roblox <username>",    desc: "Fetches a Roblox profile (ID, created date, status).", perms: "All users." },
  sabpanel:      { syntax: ".sabpanel",              desc: "Deploys the indexing service panel with base-mutation dropdown.", perms: "Staff only." },
  ticketsetup:   { syntax: ".ticketsetup",           desc: "Interactive embed builder for ticket panels.", perms: "Devs / owners only." },
  ticketpanel:   { syntax: ".ticketpanel",           desc: "Deploys the Middleman request panel.", perms: "Admins only." },
  help:          { syntax: ".help [command]",        desc: "Shows info about a command. No arg = this panel.", perms: "All users." },
  list:          { syntax: ".list <commands|features>", desc: "Lists all registered commands or features.", perms: "All users." },
  config:        { syntax: ".config",                desc: "Admin dashboard to toggle modules and manage settings.", perms: "Devs / owners only." },
  permissions:   { syntax: ".permissions",           desc: "Manage which roles can or cannot use each command.", perms: "Devs / owners only." },
  vouchstats:    { syntax: ".vouchstats [@user]",   desc: "Shows vouch count and deals completed. No @ = your own stats.", perms: "All users." },
  flowers:       { syntax: ".flowers",               desc: "Posts the flowers panel (3 embeds + Join/Deny buttons). Ticket only.", perms: "Staff only." },
  setflowertext: { syntax: ".setflowertext",         desc: "Interactive builder to configure the 3 flower panel embeds.", perms: "Admins only." },
  flowerstats:   { syntax: ".flowerstats",           desc: "Shows how many times .flowers has been used.", perms: "All users." },
  values:        { syntax: ".values <item name>",   desc: "Searches Rolimons and game value sites for a Roblox item's worth.", perms: "All users." },
  add:           { syntax: ".add <@user>",           desc: "Adds a user to the current ticket channel.", perms: "Staff only." },
  mute:          { syntax: ".mute <@user> [mins] [reason]", desc: "Times out a user for a set number of minutes (default 10).", perms: "Staff only." },
  ban:           { syntax: ".ban <@user> [reason]",  desc: "Permanently bans a user from the server.", perms: "Staff only." },
  kick:          { syntax: ".kick <@user> [reason]", desc: "Kicks a user from the server.", perms: "Staff only." },
  afk:           { syntax: ".afk [reason]",          desc: "Sets your AFK status. Bot notifies others who mention you.", perms: "All users." },
  joke:          { syntax: ".joke",                  desc: "Sends a random safe joke.", perms: "All users." },
};

export async function run(message, args) {
  const query = args[0]?.toLowerCase();

  // .help <command> — direct lookup, reply with details
  if (query && COMMANDS[query]) {
    const cmd = COMMANDS[query];
    const embed = await buildEmbed({
      title: `Help — .${query}`,
      description:
        `**Syntax:** \`${cmd.syntax}\`\n\n` +
        `**Description:**\n> ${cmd.desc}\n\n` +
        `**Permissions:** ${cmd.perms}`,
      color: 0x5865f2,
    });
    return message.reply({ embeds: [embed] });
  }

  if (query && !COMMANDS[query]) {
    return message.reply(`❌ No command found for \`${query}\`. Use \`.list commands\` to see everything.`);
  }

  // No args — send the panel with dropdown
  const headerEmbed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(
      `> \`.help <command>\` — Shows information about a command\n` +
      `> \`.help <feature>\` — Shows information about a feature\n\n` +
      `> \`.list commands\` — Lists all commands\n` +
      `> \`.list features\` — Lists all features\n\n` +
      `> \`.config\` — Configures <@1516382494377639976>\n` +
      `> \`.permissions\` — Configures permissions\n\n` +
      `## ${LINK}  **select from the drop down.**`
    );

  const select = new StringSelectMenuBuilder()
    .setCustomId("help_select")
    .setPlaceholder("Select a command for details...")
    .addOptions(
      Object.entries(COMMANDS).map(([name, cmd]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`.${name}`)
          .setValue(name)
          .setDescription(cmd.desc.slice(0, 100))
      )
    );

  const row = new ActionRowBuilder().addComponents(select);
  const sent = await message.reply({ embeds: [headerEmbed], components: [row] });

  const collector = sent.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 300_000,
  });

  collector.on("collect", async (interaction) => {
    const name = interaction.values[0];
    const cmd = COMMANDS[name];
    if (!cmd) return;

    const detail = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${LINK} .${name}`)
      .setDescription(
        `**Syntax:** \`${cmd.syntax}\`\n\n` +
        `**Description:**\n> ${cmd.desc}\n\n` +
        `**Permissions:** ${cmd.perms}`
      );

    await interaction.reply({ embeds: [detail], flags: MessageFlags.Ephemeral });
  });

  collector.on("end", () => {
    sent.edit({ components: [] }).catch(() => {});
  });
}
