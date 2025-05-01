"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const kanji = interaction.options.getString("kanji");

	db.deleteCard(interaction, deck, kanji, (response) => {
		if (response.changes === 0) {
			interaction.reply({
				content: "No matching kanji found in the specified deck.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		interaction.reply({
			content: `${kanji} successfully removed from the deck ${deck}.`,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = callback;
