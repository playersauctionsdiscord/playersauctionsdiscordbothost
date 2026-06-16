import { buildEmbed } from "../utils/embed.js";

const COMMANDS = {
  settitle: {
    syntax: ".settitle <Text>",
    description: "Overwrites the global server title used in all embeds.",
    permissions: "Server administrators only.",
  },
  setbanner: {
    syntax: ".setbanner <URL>",
    description: "Sets the global banner image displayed across all embeds. Must end in .png, .jpg, .jpeg, or .gif.",
    permissions: "Server administrators only.",
  },
  staffrole: {
    syntax: ".staffrole <@role>",
    description: "Designates a role as the official staff group, pinged in all new ticket channels.",
    permissions: "Server administrators only.",
  },
  close: {
    syntax: ".close",
    description: "Compiles a transcript of the ticket channel, sends it to the logs channel, and deletes the channel.",
    permissions: "Staff only.",
  },
  mminfo: {
    syntax: ".mminfo",
    description: "Deploys a public educational embed explaining how Middleman transactions work, with Yes/No confirmation buttons.",
    permissions: "All users.",
  },
  fee: {
    syntax: ".fee",
    description: "Prompts traders to select how the MM service fee is paid — 50/50 split or 100% by one party.",
    permissions: "Staff only (inside ticket).",
  },
  tradeconfirm: {
    syntax: ".tradeconfirm",
    description: "Creates a trade confirmation checkpoint requiring both traders to confirm before the MM proceeds.",
    permissions: "Staff only (inside ticket).",
  },
  w: {
    syntax: ".w <@user>",
    description: "Returns a detailed profile overview: user ID, account creation date, server join date, roles, and key permissions.",
    permissions: "Staff only.",
  },
  roblox: {
    syntax: ".roblox <username>",
    description: "Fetches a Roblox user profile including ID, creation date, and account status (Active/Banned).",
    permissions: "All users.",
  },
  sabpanel: {
    syntax: ".sabpanel",
    description: "Deploys an interactive indexing service panel with a dropdown for 14 base mutations. Selection triggers a modal for trade details and opens a private ticket.",
    permissions: "Staff only.",
  },
  ticketsetup: {
    syntax: ".ticketsetup",
    description: "Launches an interactive embed builder panel for configuring ticket panels with title, description, color, image, webhook, and button settings.",
    permissions: "Developers and server owners only.",
  },
  help: {
    syntax: ".help <command/feature>",
    description: "Returns syntax, permissions, and a description for a given command or feature.",
    permissions: "All users.",
  },
  list: {
    syntax: ".list <commands/features>",
    description: "Returns a formatted index of all registered commands or active features.",
    permissions: "All users.",
  },
  config: {
    syntax: ".config",
    description: "Opens an administrative dashboard to toggle modules, update log channels, and manage global settings.",
    permissions: "Developers and server owners only.",
  },
  permissions: {
    syntax: ".permissions",
    description: "Opens the bot's role-access mapping interface to whitelist or blacklist roles from commands.",
    permissions: "Developers and server owners only.",
  },
  vouchstats: {
    syntax: ".vouchstats <@user>",
    description: "Returns a reputation profile showing vouch count, completed deals, and server uptime.",
    permissions: "All users.",
  },
  flop: {
    syntax: ".flop",
    description: "Outputs the active system announcement text to the current channel.",
    permissions: "All users.",
  },
  setfloptext: {
    syntax: ".setfloptext <text>",
    description: "Sets the text displayed by the .flop command.",
    permissions: "Staff only.",
  },
  flopstats: {
    syntax: ".flopstats",
    description: "Displays usage frequency and metrics for the .flop command.",
    permissions: "All users.",
  },
};

export async function run(message, args) {
  const query = args[0]?.toLowerCase();

  if (!query) {
    const embed = await buildEmbed({
      title: "Help — Command List",
      description:
        `> Use \`.help <command>\` to get details on a specific command.\n\n` +
        Object.keys(COMMANDS).map((k) => `\`${k}\``).join(" • "),
      color: 0x5865f2,
      footer: ".help <command> — for detailed info",
    });
    return message.reply({ embeds: [embed] });
  }

  const cmd = COMMANDS[query];
  if (!cmd) {
    return message.reply(`❌ No command or feature found for \`${query}\`. Use \`.list commands\` to see all available commands.`);
  }

  const embed = await buildEmbed({
    title: `Help — .${query}`,
    description:
      `**Syntax:** \`${cmd.syntax}\`\n\n` +
      `**Description:**\n> ${cmd.description}\n\n` +
      `**Permissions:** ${cmd.permissions}`,
    color: 0x5865f2,
  });

  return message.reply({ embeds: [embed] });
}
