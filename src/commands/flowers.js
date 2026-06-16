import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { getConfig, Flop } from "../utils/db.js";

export async function run(message) {
  await Flop.findOneAndUpdate(
    { key: "flowers_text" },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  const [e1t, e1d, e2t, e2d, e3t, e3d] = await Promise.all([
    getConfig("flowers_embed1_title", "🌸 PlayerAuctions Marketplace"),
    getConfig("flowers_embed1_desc",  "> Welcome to **PlayerAuctions Marketplace** — the safest place to trade Roblox items."),
    getConfig("flowers_embed2_title", "🔒 Protected Trades"),
    getConfig("flowers_embed2_desc",  "> All trades are protected by our verified Middleman service.\n> Trusted by thousands of traders for over **5+ years**."),
    getConfig("flowers_embed3_title", "💎 Join Us"),
    getConfig("flowers_embed3_desc",  "> Use `.mminfo` to learn more about our Middleman service.\n> Use `.ticketpanel` to open a trade ticket."),
  ]);

  const embeds = [
    new EmbedBuilder().setColor(0xff85c2).setTitle(e1t).setDescription(e1d),
    new EmbedBuilder().setColor(0xa855f7).setTitle(e2t).setDescription(e2d),
    new EmbedBuilder().setColor(0x5865f2).setTitle(e3t).setDescription(e3d),
  ];

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fw_join")
      .setLabel("💲 Join and be Rich")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("fw_deny")
      .setLabel("😭 Deny and Cry More")
      .setStyle(ButtonStyle.Danger)
  );

  const panel = await message.channel.send({ embeds, components: [buttons] });

  // Collect button presses — each user gets a private ephemeral reply
  const collector = panel.createMessageComponentCollector({ time: 300_000 });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "fw_join") {
      await interaction.reply({
        content: "✅ You've chosen to join! Please check the staff channels for further information and vouch a Middleman.",
        ephemeral: true,
      });
    } else if (interaction.customId === "fw_deny") {
      await interaction.reply({
        content: "😭 You chose to pass. Feel free to come back any time!",
        ephemeral: true,
      });
    }
  });
}
