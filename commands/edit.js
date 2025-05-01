"use strict";

const { MessageFlags } = require("discord.js");
const { db, getOwner, getDefaultDeck, getDeckEntryByKanji } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const sentence = interaction.options.getString("sentence") || null;

	function help(deck) {
		getDeckEntryByKanji(interaction, deck, kanji, (row) => {
			db.run(
				"UPDATE decks SET reading = ?, meanings = ?, sentence = ? WHERE deck = ? AND kanji = ?",
				[reading, meanings, sentence, deck, kanji],
				async (err) => {
					if (err) {
						console.error("db.run", err);
						await interaction.reply({
							content: "An error occurred with sqlite.",
							flags: MessageFlags.Ephemeral,
						});
					} else {
						await interaction.reply({
							content: "Kanji updated successfully!",
							flags: MessageFlags.Ephemeral,
						});
					}
				}
			);
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
