"use strict";

const { MessageFlags } = require("discord.js");
const { db, getOwner, getDefaultDeck } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;

	function help(deck) {
		db.run("DELETE FROM decks WHERE deck = ?", [deck], async (err) => {
			if (err) {
				console.error("db.run", err);
				await interaction.reply({
					content: "An error occurred with sqlite.",
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.reply({
					content: "Deck cleared successfully!",
					flags: MessageFlags.Ephemeral,
				});
			}
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
