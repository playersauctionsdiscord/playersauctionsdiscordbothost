import { buildEmbed } from "../utils/embed.js";

const ALL_COMMANDS = [
  ".settitle", ".setbanner", ".staffrole", ".close", ".mminfo",
  ".fee", ".tradeconfirm", ".w", ".roblox", ".sabpanel",
  ".ticketsetup", ".help", ".list", ".config", ".permissions",
  ".vouchstats", ".flop", ".setfloptext", ".flopstats",
];

const ALL_FEATURES = [
  "Global Branding Tokens (title + banner)",
  "Ticket System (create, claim, close)",
  "Middleman Workflow (mminfo, fee, tradeconfirm)",
  "Indexing Service Panel (sabpanel)",
  "Roblox Profile Lookup",
  "User Whois & Permission Scanner",
  "Reputation / Vouch Tracking",
  "Flop Announcement System",
  "Role-based Permission Control",
  "Admin Config Dashboard",
  "Transcript Logging",
  "Ticket Panel Builder",
];

export async function run(message, args) {
  const type = args[0]?.toLowerCase();

  if (type === "commands") {
    const embed = await buildEmbed({
      title: "Command Index",
      description: "```\n" + ALL_COMMANDS.join("\n") + "\n```",
      color: 0x5865f2,
      footer: `${ALL_COMMANDS.length} commands registered`,
    });
    return message.reply({ embeds: [embed] });
  }

  if (type === "features") {
    const embed = await buildEmbed({
      title: "Feature Index",
      description: "```\n" + ALL_FEATURES.join("\n") + "\n```",
      color: 0x5865f2,
      footer: `${ALL_FEATURES.length} active features`,
    });
    return message.reply({ embeds: [embed] });
  }

  return message.reply("Usage: `.list commands` or `.list features`");
}
