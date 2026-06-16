import { Client, GatewayIntentBits, Partials } from "discord.js";
import { connectDB, Permission, claimMessage } from "./utils/db.js";

import * as settitle from "./commands/settitle.js";
import * as setbanner from "./commands/setbanner.js";
import * as bannerremove from "./commands/bannerremove.js";
import * as staffrole from "./commands/staffrole.js";
import * as close from "./commands/close.js";
import * as mminfo from "./commands/mminfo.js";
import * as fee from "./commands/fee.js";
import * as tradeconfirm from "./commands/tradeconfirm.js";
import * as w from "./commands/w.js";
import * as roblox from "./commands/roblox.js";
import * as sabpanel from "./commands/sabpanel.js";
import * as ticketsetup from "./commands/ticketsetup.js";
import * as ticketpanel from "./commands/ticketpanel.js";
import * as help from "./commands/help.js";
import * as list from "./commands/list.js";
import * as config from "./commands/config.js";
import * as permissions from "./commands/permissions.js";
import * as vouchstats from "./commands/vouchstats.js";
import * as flop from "./commands/flop.js";
import * as setfloptext from "./commands/setfloptext.js";
import * as flopstats from "./commands/flopstats.js";

const PREFIX = ".";

const commands = new Map([
  ["settitle", settitle],
  ["setbanner", setbanner],
  ["bannerremove", bannerremove],
  ["staffrole", staffrole],
  ["close", close],
  ["mminfo", mminfo],
  ["fee", fee],
  ["tradeconfirm", tradeconfirm],
  ["w", w],
  ["roblox", roblox],
  ["sabpanel", sabpanel],
  ["ticketsetup", ticketsetup],
  ["ticketpanel", ticketpanel],
  ["help", help],
  ["list", list],
  ["config", config],
  ["permissions", permissions],
  ["vouchstats", vouchstats],
  ["flop", flop],
  ["setfloptext", setfloptext],
  ["flopstats", flopstats],
]);

async function checkPermissions(member, commandName) {
  const record = await Permission.findOne({ commandName });
  if (!record) return true;

  const memberRoleIds = [...member.roles.cache.keys()];

  if (record.deniedRoles.length > 0) {
    if (memberRoleIds.some((id) => record.deniedRoles.includes(id))) return false;
  }

  if (record.allowedRoles.length > 0) {
    return memberRoleIds.some((id) => record.allowedRoles.includes(id));
  }

  return true;
}

async function main() {
  await connectDB();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
  });

  client.once("clientReady", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📦 ${commands.size} commands loaded`);
    console.log(`🎯 Prefix: ${PREFIX}`);
  });

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    if (!message.guild) return;

    // Distributed lock via MongoDB — if another instance (e.g. Railway) already
    // claimed this message ID, this instance skips it entirely. Auto-expires in 30s.
    const claimed = await claimMessage(message.id);
    if (!claimed) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (!command) return;

    try {
      const allowed = await checkPermissions(message.member, commandName);
      if (!allowed) {
        return message.reply("❌ You do not have permission to use this command.");
      }
      await command.run(message, args);
    } catch (err) {
      console.error(`Error executing .${commandName}:`, err);
      try {
        await message.reply(`❌ An error occurred while running \`.${commandName}\`: ${err.message}`);
      } catch (_) {}
    }
  });

  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error("DISCORD_TOKEN environment variable is not set");

  await client.login(token);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
