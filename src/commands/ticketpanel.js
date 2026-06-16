import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder,
} from "discord.js";
import { buildEmbed } from "../utils/embed.js";
import { getConfig } from "../utils/db.js";

// Prevent the same user from opening two tickets simultaneously
const openingTicket = new Set();
// Prevent the same interaction from being handled twice
const handledInteractions = new Set();

export async function run(message) {
  const requestEmbed = await buildEmbed({
    title: "Request Middleman",
    description:
      `### Request Middleman\n\n` +
      `> Please read the rules before proceeding, then click **Request Middleman** and complete the form.\n\n` +
      `### Vouch Required\n` +
      `> You are required to vouch for your Middleman after the trade. Failure to do so within __24 hours__ will result in a **Blacklist** from our MM service.\n\n` +
      `### Troll Tickets\n` +
      `> Any attempt to create fake or troll tickets will result in a Middleman ban.\n\n` +
      `### Disclaimer\n` +
      `> We are NOT responsible for anything that occurs after the trade has been completed.`,
    color: 0x5865f2,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_request_mm")
      .setLabel("Request Middleman")
      .setStyle(ButtonStyle.Primary)
  );

  const sent = await message.channel.send({ embeds: [requestEmbed], components: [row] });

  const collector = sent.createMessageComponentCollector();

  collector.on("collect", async (interaction) => {
    if (interaction.customId !== "ticket_request_mm") return;

    // Deduplicate interaction — same interaction ID must never fire twice
    if (handledInteractions.has(interaction.id)) return;
    handledInteractions.add(interaction.id);
    setTimeout(() => handledInteractions.delete(interaction.id), 30_000);

    // Prevent the same user from opening two tickets at once
    if (openingTicket.has(interaction.user.id)) {
      await interaction.reply({
        content: "⏳ Your previous ticket request is still being processed. Please wait.",
        ephemeral: true,
      });
      return;
    }
    openingTicket.add(interaction.user.id);

    try {
      const modal = new ModalBuilder()
        .setCustomId(`mm_request_modal_${interaction.id}`)
        .setTitle("Middleman Request");

      const otherPartyInput = new TextInputBuilder()
        .setCustomId("other_party")
        .setLabel("Other Trader's User ID")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Enter their Discord user ID")
        .setRequired(true);

      const tradeDetailsInput = new TextInputBuilder()
        .setCustomId("trade_details")
        .setLabel("Trade Details")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Describe what is being traded")
        .setRequired(true);

      const joinLinkInput = new TextInputBuilder()
        .setCustomId("can_join_links")
        .setLabel("Can you join via links?")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Yes / No")
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(otherPartyInput),
        new ActionRowBuilder().addComponents(tradeDetailsInput),
        new ActionRowBuilder().addComponents(joinLinkInput)
      );

      await interaction.showModal(modal);

      const resp = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === interaction.user.id,
        time: 300_000,
      });

      const otherParty = resp.fields.getTextInputValue("other_party");
      const tradeDetails = resp.fields.getTextInputValue("trade_details");
      const canJoinLinks = resp.fields.getTextInputValue("can_join_links");

      // Acknowledge modal immediately to prevent timeout
      await resp.deferReply({ ephemeral: true });

      const staffRoleId = await getConfig("staff_role_id", "");
      const guild = message.guild;

      const safeName = `mm-${interaction.user.username}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 100);

      const ticketChannel = await guild.channels.create({
        name: safeName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          ...(staffRoleId
            ? [{ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
            : []),
        ],
      });

      const ticketEmbed = await buildEmbed({
        title: "Middleman Request",
        description:
          `> A new middleman request has been created. Please wait for staff to claim this ticket.\n\n` +
          `> Requester: <@${interaction.user.id}>\n` +
          `Other Party: \`${otherParty}\`\n` +
          `Trade Details: \`${tradeDetails}\`\n` +
          `Can Join Links: \`${canJoinLinks}\`\n\n` +
          `-# A middleman will be with you shortly.`,
        color: 0x5865f2,
      });

      const ticketRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_ticket_${ticketChannel.id}`)
          .setLabel("Claim Ticket")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`add_user_${ticketChannel.id}`)
          .setLabel("Add User")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`delete_ticket_${ticketChannel.id}`)
          .setLabel("Delete Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      const pingContent = staffRoleId ? `<@&${staffRoleId}>` : "";
      const ticketMsg = await ticketChannel.send({
        content: pingContent || undefined,
        embeds: [ticketEmbed],
        components: [ticketRow],
      });

      await resp.editReply({
        content: `✅ Your ticket has been created in <#${ticketChannel.id}>!`,
      });

      // Track which button interactions in this ticket have been handled
      const handledTicketBtns = new Set();

      const ticketCollector = ticketMsg.createMessageComponentCollector();

      ticketCollector.on("collect", async (btnInt) => {
        if (handledTicketBtns.has(btnInt.id)) return;
        handledTicketBtns.add(btnInt.id);
        setTimeout(() => handledTicketBtns.delete(btnInt.id), 30_000);

        if (btnInt.customId.startsWith("claim_ticket_")) {
          await btnInt.deferUpdate();

          await ticketChannel.permissionOverwrites.set([
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            {
              id: btnInt.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            ...(staffRoleId
              ? [{ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }]
              : []),
          ]);

          const claimEmbed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(
              `# Ticket Claimed\n\n` +
              `> Claimer: <@${btnInt.user.id}>\n` +
              `Status: Active\n\n` +
              `-# Only the claimer can reply in this ticket. __Senior oversight__ roles have view-only access.`
            );

          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`claim_ticket_${ticketChannel.id}`).setLabel("Claim Ticket").setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId(`add_user_${ticketChannel.id}`).setLabel("Add User").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`delete_ticket_${ticketChannel.id}`).setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
          );

          await ticketMsg.edit({ components: [disabledRow] });
          await ticketChannel.send({ embeds: [claimEmbed] });

        } else if (btnInt.customId.startsWith("add_user_")) {
          const addModal = new ModalBuilder()
            .setCustomId(`add_user_modal_${btnInt.id}`)
            .setTitle("Add User to Ticket");

          const userIdInput = new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("User ID or Username")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Enter Discord user ID")
            .setRequired(true);

          addModal.addComponents(new ActionRowBuilder().addComponents(userIdInput));
          await btnInt.showModal(addModal);

          try {
            const addResp = await btnInt.awaitModalSubmit({
              filter: (i) => i.user.id === btnInt.user.id,
              time: 60_000,
            });
            const userId = addResp.fields.getTextInputValue("user_id").trim();
            await addResp.deferReply({ ephemeral: true });

            const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
            if (!member) {
              await addResp.editReply({ content: "❌ Could not find that user." });
              return;
            }

            await ticketChannel.permissionOverwrites.create(member, {
              ViewChannel: true,
              SendMessages: true,
            });

            await addResp.editReply({ content: `✅ Added <@${member.id}> to the ticket.` });
          } catch (_) {}

        } else if (btnInt.customId.startsWith("delete_ticket_")) {
          await btnInt.deferUpdate();
          ticketCollector.stop();

          let allMessages = [];
          let lastId;
          while (true) {
            const opts = { limit: 100 };
            if (lastId) opts.before = lastId;
            const fetched = await ticketChannel.messages.fetch(opts).catch(() => null);
            if (!fetched || fetched.size === 0) break;
            allMessages = allMessages.concat([...fetched.values()]);
            lastId = fetched.last()?.id;
            if (fetched.size < 100) break;
          }
          allMessages.reverse();

          const lines = allMessages.map((m) => {
            const ts = new Date(m.createdTimestamp).toUTCString();
            const content = m.content || "[embed/attachment]";
            return `[${ts}] ${m.author.tag}: ${content}`;
          });

          const buffer = Buffer.from(lines.join("\n"), "utf-8");
          const attachment = new AttachmentBuilder(buffer, {
            name: `transcript-${ticketChannel.name}-${Date.now()}.txt`,
          });

          const logChannelId = await getConfig("log_channel_id", "");
          if (logChannelId) {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (logChannel) {
              const logEmbed = await buildEmbed({
                title: "Ticket Transcript",
                description: `> Channel: **#${ticketChannel.name}**\n> Closed by: <@${btnInt.user.id}>\n> Messages: **${allMessages.length}**`,
                color: 0xed4245,
              });
              await logChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(() => {});
            }
          }

          await ticketChannel.delete("Ticket deleted").catch(() => {});
        }
      });
    } catch (err) {
      if (!err.message?.includes("time")) {
        console.error("Ticket panel error:", err.message);
      }
    } finally {
      // Always release the lock so user can open a new ticket later
      openingTicket.delete(interaction.user.id);
    }
  });
}
