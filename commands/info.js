"use strict";

const { MessageFlags } = require("discord.js");
const { db, getDefaultDeck, getOwner } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck") || null;

	function help(deck) {
		db.get(
			`SELECT COUNT(*) as count, SUM(score) as total, AVG(score) as average FROM decks WHERE deck = ?`,
			[deck],
			(err, row) => {
				if (err) {
					console.error("db", err);
					interaction.reply({
						content: "An error occurred while retrieving deck info.",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				interaction.reply({
					content: `Deck: ${deck}\nCards: ${row.count}\nTotal Score: ${row.total || 0}\nAverage Score: ${
						row.average?.toFixed(2) || 0
					}`,
					flags: MessageFlags.Ephemeral,
				});
			}
		);
	}

	function help2(deck) {
		getOwner(deck, (err, owner_id) => {
			if (err) {
				console.error("getOwner", err);
				interaction.reply({
					content: "An error occurred while getting the deck owner.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

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

	if (deck) {
		help2(deck);
	} else {
		getDefaultDeck(userId, (err, deck) => {
			if (err) {
				console.error("getDefaultDeck", err);
				interaction.reply({
					content: "An error occurred while fetching the default deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
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
