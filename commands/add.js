"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const sentence = interaction.options.getString("sentence") || null;

	function help(deck) {
		db.addCard(interaction, deck, kanji, reading, meanings, sentence, (response) => {
			interaction.reply({
				content: "Kanji added successfully!",
				flags: MessageFlags.Ephemeral,
			});
		});
	}

	function help2(deck) {
		db.getOwner(interaction, deck, (owner_id) => {
			if (owner_id === null) {
				db.setOwner(interaction, userId, deck);
				help(deck);
			} else if (owner_id === userId) {
				help(deck);
			} else {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}

	const deck = interaction.options.getString("deck") || null;

	if (deck) {
		help2(deck);
	} else {
		db.getDefaultDeck(interaction, userId, (deck) => {
			if (deck) {
				help2(deck);
			} else {
				interaction.reply({
					content: "No deck was given and no default deck was set.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}
}

/*

*/

module.exports = {
	callback,
};
