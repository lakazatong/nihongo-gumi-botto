"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	db.dropDeck(interaction, deck, (response) => {
		interaction.reply({
			content: `The deck ${deck} was successfully dropped.`,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = callback;
