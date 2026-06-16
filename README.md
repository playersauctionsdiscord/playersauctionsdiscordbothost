# PlayerAuctions Marketplace Discord Bot

A fully-featured Discord bot built with Discord.js v14 and MongoDB.

## Railway Deployment

Set these environment variables in Railway:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot token from Discord Developer Portal |
| `MONGODB_URI` | Your MongoDB connection string |

**Root Directory:** `/` (repo root)  
**Start Command:** `node src/index.js`  
**Node Version:** 18+

## Commands

| Command | Description |
|---|---|
| `.settitle <text>` | Set global embed title |
| `.setbanner <url>` | Set global banner image |
| `.staffrole <@role>` | Set staff role for tickets |
| `.close` | Close ticket + save transcript |
| `.mminfo` | Middleman info + Yes/No buttons |
| `.fee` | MM fee split panel |
| `.tradeconfirm` | Trade confirmation panel |
| `.w <@user>` | User whois lookup |
| `.roblox <username>` | Roblox profile lookup |
| `.sabpanel` | Indexing service panel |
| `.ticketpanel` | Deploy MM request panel |
| `.ticketsetup` | Interactive embed builder |
| `.help <command>` | Command help |
| `.list commands/features` | List all commands/features |
| `.config` | Admin config dashboard |
| `.permissions` | Role permission manager |
| `.vouchstats <@user>` | User vouch stats |
| `.flop` | Broadcast announcement |
| `.setfloptext <text>` | Set flop announcement text |
| `.flopstats` | Flop usage statistics |
