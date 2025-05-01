"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

function checkDeckOwnership(interaction, callback) {
	function help2(deck) {
		db.getOwner(interaction, deck, (owner_id) => {
			if (owner_id === null) {
				interaction.reply({
					content: "The deck does not exist.",
					flags: MessageFlags.Ephemeral,
				});
			} else if (owner_id !== interaction.user.id) {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
			} else {
				callback(deck);
			}
		});
	}

	const deck = interaction.options.getString("deck") || null;

	if (deck) {
		help2(deck);
	} else {
		db.getDefaultDeck(interaction, interaction.user.id, (deck) => {
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

function checkOrCreateDeckOwnership(interaction, callback) {
	function help2(deck) {
		db.getOwner(interaction, deck, (owner_id) => {
			if (owner_id === null) {
				db.setOwner(interaction, interaction.user.id, deck);
				callback(deck);
			} else if (owner_id === interaction.user.id) {
				callback(deck);
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
		db.getDefaultDeck(interaction, interaction.user.id, (deck) => {
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
	checkDeckOwnership,
	checkOrCreateDeckOwnership,
};
