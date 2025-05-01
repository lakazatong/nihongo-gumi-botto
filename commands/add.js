"use strict";

const { MessageFlags } = require("discord.js");
const { db, getOwner, setOwner, getDefaultDeck } = require("../database/decks.js");

async function callback(interaction) {
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const sentence = interaction.options.getString("sentence") || null;

	function help(deck) {
		db.run(
			"INSERT INTO decks (deck, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)",
			[deck, kanji, reading, meanings, sentence],
			async (err) => {
				if (err) {
					if (err.code === "SQLITE_CONSTRAINT") {
						await interaction.reply({
							content: "That kanji already exists in the deck.",
							flags: MessageFlags.Ephemeral,
						});
					} else {
						console.error("db.run", err);
						await interaction.reply({
							content: "An error occurred while saving the card.",
							flags: MessageFlags.Ephemeral,
						});
					}
				} else {
					await interaction.reply({
						content: "Kanji added successfully!",
						flags: MessageFlags.Ephemeral,
					});
				}
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
				setOwner(userId, deck);
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

	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck") || null;
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
