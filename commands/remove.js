"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const kanji = interaction.options.getString("kanji");

	db.deleteCardByKanji(interaction, deck, kanji, (response) => {
		if (response.changes === 0) {
			interaction.reply({
				content: `**${kanji}** doesn't exist in **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			interaction.reply({
				content: `**${kanji}** successfully removed from **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Removes a card from a deck.")
		.addStringOption((opt) => opt.setName("kanji").setDescription("The kanjis writing").setRequired(true))
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
