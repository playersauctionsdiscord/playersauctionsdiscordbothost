import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { getConfig, Flop } from "../utils/db.js";

const JOIN_ROLE_ID = "1481016917677445372";

export async function run(message) {
  // Only usable inside a ticket channel (mm- or sab- prefix)
  const ch = message.channel;
  const isTicket = ch.name?.startsWith("mm-") || ch.name?.startsWith("sab-");
  if (!isTicket) {
    return message.reply("❌ This command can only be used inside a ticket channel.");
  }

  await Flop.findOneAndUpdate(
    { key: "flowers_text" },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  const [e1d, e2d, e3d] = await Promise.all([
    getConfig("flowers_embed1_desc", "> Welcome to **PlayerAuctions Marketplace** — the safest place to trade Roblox items."),
    getConfig("flowers_embed2_desc", "> All trades are protected by our verified Middleman service.\n> Trusted by thousands of traders for over **5+ years**."),
    getConfig("flowers_embed3_desc", "> Use `.mminfo` to learn more about our Middleman service.\n> Use `.ticketpanel` to open a trade ticket."),
  ]);

  const embeds = [
    new EmbedBuilder().setColor(0xff85c2).setDescription(e1d),
    new EmbedBuilder().setColor(0xa855f7).setDescription(e2d),
    new EmbedBuilder().setColor(0x5865f2).setDescription(e3d),
  ];

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fw_join_${message.id}`)
      .setLabel("💲 Join and be Rich")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`fw_deny_${message.id}`)
      .setLabel("😭 Deny and Cry More")
      .setStyle(ButtonStyle.Danger)
  );

  const panel = await message.channel.send({ embeds, components: [buttons] });

  const collector = panel.createMessageComponentCollector();

  collector.on("collect", async (interaction) => {
    if (interaction.customId === `fw_join_${message.id}`) {
      try {
        await interaction.member.roles.add(JOIN_ROLE_ID);
      } catch (_) {}

      // Public non-ephemeral message in the ticket
      await interaction.reply({
        content:
          `<@${interaction.user.id}> has accepted the offer and has been granted access to all the necessary channels. Please check the staff channels for further information & vouch a Middleman.\n\n` +
          `<:lock:1516402949499129936> : This ticket will close in **2 minutes** and a transcript will be saved.`,
      });

    } else if (interaction.customId === `fw_deny_${message.id}`) {
      await interaction.reply({
        content: `😭 <@${interaction.user.id}> denied the offer.`,
      });
    }
  });
}
