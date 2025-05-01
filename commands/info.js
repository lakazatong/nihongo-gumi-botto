"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;

	function help(deck) {
		db.getDeckStats(interaction, deck, (row) => {
			interaction.reply({
				content: `Deck: ${deck}\nCards: ${row.count}\nTotal Score: ${row.total || 0}\nAverage Score: ${
					row.average?.toFixed(2) || 0
				}`,
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
