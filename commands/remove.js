"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const kanji = interaction.options.getString("kanji");

	function help(deck) {
		db.deleteCard(interaction, deck, kanji, (response) => {
			if (response.changes === 0) {
				interaction.reply({
					content: "No matching kanji found in the specified deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			interaction.reply({
				content: `"${kanji}" removed from deck "${deck}".`,
				flags: MessageFlags.Ephemeral,
			});
		});
	}

	function help2(deck) {
		db.getOwner(interaction, deck, (owner_id) => {
			if (owner_id === null) {
				interaction.reply({
					content: "The deck does not exist.",
					flags: MessageFlags.Ephemeral,
				});
			} else if (owner_id !== userId) {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
			} else {
				help(deck);
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

module.exports = {
	callback,
};
