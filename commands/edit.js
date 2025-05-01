"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading") || null;
	const meanings = interaction.options.getString("meanings") || null;
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

module.exports = {
	data: new SlashCommandBuilder()
		.setName("edit")
		.setDescription("Edits a card from a deck.")
		.addStringOption((opt) => opt.setName("kanji").setDescription("The kanjis writing").setRequired(true))
		.addStringOption((opt) => opt.setName("reading").setDescription("The kana writing").setRequired(false))
		.addStringOption((opt) => opt.setName("meanings").setDescription("The meanings").setRequired(false))
		.addStringOption((opt) =>
			opt.setName("sentence").setDescription("The sentence it was found in").setRequired(false)
		)
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
