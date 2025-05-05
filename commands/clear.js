"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	db.clearDeck(interaction, deck, () => {
		interaction.reply({
			content: `**${deck}** cleared successfully.`,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Clears all cards from a deck.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
