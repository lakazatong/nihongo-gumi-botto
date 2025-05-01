"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const sentence = interaction.options.getString("sentence") || null;
	db.getCardByKanji(interaction, deck, kanji, (row) => {
		db.updateCard(interaction, deck, kanji, reading, meanings, sentence, (response) => {
			interaction.reply({
				content: "Kanji updated successfully!",
				flags: MessageFlags.Ephemeral,
			});
		});
	});
}

module.exports = callback;
