"use strict";

const { SlashCommandBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");
const { buildContent } = require("../utils/decks.js");

async function callback(interaction, deck) {
	const userId = interaction.user.id;
	db.getRandomCard(interaction, deck, userId, (card) => {
		if (!card) {
			interaction.reply({
				content: `**${deck}** empty.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const timeoutId = setTimeout(
			async () =>
				interaction.editReply({
					content: buildContent(card, false),
					flags: MessageFlags.Ephemeral,
				}),
			30000
		);

		const buttons = new ActionRowBuilder().addComponents(
			getCorrectButton().setCustomId(`correct_${deck}_${card.id}_${timeoutId}`),
			getIncorrectButton().setCustomId(`incorrect_${deck}_${card.id}_${timeoutId}`)
		);

		interaction.reply({
			content: buildContent(card),
			flags: MessageFlags.Ephemeral,
			components: [buttons],
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Quizzes you with a random card from a deck.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
