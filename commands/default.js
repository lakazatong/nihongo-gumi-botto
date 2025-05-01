"use strict";

const { getOwner, updateDefault } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck");
	getOwner(deck, (err, owner_id) => {
		if (err) {
			console.error(err);
			interaction.reply({
				content: "An error occurred while getting the deck owner.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (owner_id !== userId) {
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
