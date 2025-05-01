"use strict";

const { MessageFlags } = require("discord.js");
const { db, getOwner, getDefaultDeck } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const kanji = interaction.options.getString("kanji");

	function help(deck) {
		db.run("DELETE FROM decks WHERE deck = ? AND kanji = ?", [deck, kanji], function (err) {
			if (err) {
				console.error("db.run", err);
				interaction.reply({
					content: "An error occurred with sqlite.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (this.changes === 0) {
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
		getOwner(deck, (err, owner_id) => {
			if (err) {
				console.error("getOwner", err);
				interaction.reply({
					content: "An error occurred with sqlite.",
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

	const deck = interaction.options.getString("deck") || null;

	if (deck) {
		help2(deck);
	} else {
		getDefaultDeck(userId, (err, deck) => {
			if (err) {
				console.error("getDefaultDeck", err);
				interaction.reply({
					content: "An error occurred with sqlite.",
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
