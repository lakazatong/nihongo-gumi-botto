"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const friend = interaction.options.getUser("friend");

	db.addOwner(interaction, friend.id, deck, (response) => {
		interaction.reply({
			content: `${friend.username} now also has ownership of the deck ${deck}.`,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("share")
		.setDescription("Gives someone else access to one of your decks.")
		.addUserOption((opt) => opt.setName("friend").setDescription("The user to share a deck with").setRequired(true))
		.addStringOption((opt) =>
			opt.setName("deck").setDescription("The name of the deck to share").setRequired(false)
		),
	callback,
};
