"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck");

	if (!deck) {
		db.getDefaultDeck(interaction, userId, (deck) => {
			if (!deck) {
				interaction.reply({
					content: "You have no default deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			interaction.reply({
				content: `Your default deck is ${deck}.`,
				flags: MessageFlags.Ephemeral,
			});
		});
		return;
	}

	db.isOwner(interaction, userId, deck, (bool) => {
		if (bool === false) {
			interaction.reply({
				content: "You are not the owner of this deck.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		db.updateDefault(interaction, userId, deck, (response) => {
			interaction.reply({
				content: `Default deck set to ${deck}.`,
				flags: MessageFlags.Ephemeral,
			});
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("default")
		.setDescription("Tells you what your default deck is, or changes your default deck if you provide one.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The default deck name").setRequired(false)),
	callback,
};
