"use strict";

const { MessageFlags } = require("discord.js");
const { getOwner, updateDefault, getDefaultDeck } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck");

	if (!deck) {
		getDefaultDeck(userId, (err, defaultDeck) => {
			if (err) {
				console.error("getDefaultDeck", err);
				interaction.reply({
					content: "An error occurred while getting the default deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (!defaultDeck) {
				interaction.reply({
					content: "You have no default deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			interaction.reply({
				content: `Your default deck is ${defaultDeck}.`,
				flags: MessageFlags.Ephemeral,
			});
		});
		return;
	}

	getOwner(deck, (err, owner_id) => {
		if (err) {
			console.error("getOwner", err);
			interaction.reply({
				content: "An error occurred while getting the deck owner.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (owner_id !== null && owner_id !== userId) {
			interaction.reply({
				content: "You are not the owner of this deck.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		updateDefault(userId, deck);
		interaction.reply({
			content: `Default deck set to ${deck}.`,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = {
	callback,
};
