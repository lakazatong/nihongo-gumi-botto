"use strict";

const { MessageFlags } = require("discord.js");
const { kanjis_db } = require("../database/kanjis.js");
const { isOwner, getOrDefaultDeck } = require("../database/decks.js");

async function callback(interaction) {
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const sentence = interaction.options.getString("sentence") || null;

	function help(deck) {
		kanjis_db.run(
			"INSERT INTO kanjis (deck, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)",
			[deck, kanji, reading, meanings, sentence],
			async (err) => {
				if (err) {
					if (err.code === "SQLITE_CONSTRAINT") {
						await interaction.reply({
							content: "That kanji already exists in the deck.",
							flags: MessageFlags.Ephemeral,
						});
					} else {
						console.error(err);
						await interaction.reply({
							content: "An error occurred while saving the card.",
							flags: MessageFlags.Ephemeral,
						});
					}
				} else {
					await interaction.reply({
						content: "Kanji saved successfully!",
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		);
	}

	function help2(deck) {
		getOrDefaultDeck(interaction.user.id, interaction.user.username, (err, deck) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while fetching the deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			help(deck);
		});
	}

	const deck = interaction.options.getString("deck") || null;
	if (deck) {
		exists(deck, (err, bool) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while checking if the deck exists.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (bool) {
				isOwner(interaction.user.id, deck, (err, bool) => {
					if (err) {
						console.error(err);
						interaction.reply({
							content: "An error occurred while checking the deck owner.",
							flags: MessageFlags.Ephemeral,
						});
						return;
					}
					if (bool) {
						help(deck);
					} else {
						interaction.reply({
							content: "You are not the owner of this deck.",
							flags: MessageFlags.Ephemeral,
						});
					}
				});
			} else {
				help2(deck);
			}
		});
	} else {
		help2(deck);
	}
}

module.exports = {
	callback,
};
