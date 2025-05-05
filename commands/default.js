"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck");

	if (deck) {
		db.getOwners(interaction, deck, (owner_ids) => {
			if (owner_ids.length > 0 && !owner_ids.includes(userId)) {
				interaction.reply({
					content: `Your are not the owner of the deck **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
			} else {
				db.updateDefault(interaction, userId, deck, (response) => {
					interaction.reply({
						content: `Default deck set to **${deck}**.`,
						flags: MessageFlags.Ephemeral,
					});
				});
			}
		});
	} else {
		db.getDefaultDeck(interaction, userId, (deck) => {
			if (deck) {
				interaction.reply({
					content: `Your default deck is **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
			} else {
				interaction.reply({
					content: "You have no default deck.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Tells you what your default deck is, or changes your default deck if you provide one.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The default deck name").setRequired(false)),
	callback,
};
