"use strict";

const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");
const { buildContent } = require("../utils/decks.js");

async function callback(interaction, deck) {
	db.getRandomCard(interaction, deck, (row) => {
		const timeoutId = setTimeout(async () => {
			interaction.reply({
				content: buildContent(row),
				components: [],
			});
		}, 30000);

		const buttons = new ActionRowBuilder().addComponents(
			getCorrectButton().setCustomId(`correct_${row.id}_${timeoutId}`),
			getIncorrectButton().setCustomId(`incorrect_${row.id}_${timeoutId}`)
		);

		interaction.reply({
			content: buildContent(row),
			components: [buttons],
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ask")
		.setDescription("Quizzes you with a random card from a deck.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
