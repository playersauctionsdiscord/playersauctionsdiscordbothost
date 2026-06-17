import { EmbedBuilder } from "discord.js";
import { buildEmbed } from "../utils/embed.js";

export async function run(message) {
  try {
    const res = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode&type=twopart,single", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    let description;
    if (data.type === "twopart") {
      description = `**${data.setup}**\n\n||${data.delivery}||`;
    } else {
      description = data.joke;
    }

    const embed = await buildEmbed({
      title: "😂 Random Joke",
      description: `> ${description}\n\n-# Category: \`${data.category}\``,
      color: 0xfee75c,
    });

    return message.reply({ embeds: [embed] });
  } catch {
    return message.reply("😅 Couldn't fetch a joke right now. Try again!");
  }
}
