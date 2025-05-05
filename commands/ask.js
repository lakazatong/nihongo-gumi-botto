"use strict";

const { SlashCommandBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");
const { buildContent } = require("../utils/decks.js");

async function callback(interaction, deck) {
	db.getRandomCard(interaction, deck, (card) => {
		if (!card) {
			interaction.reply({
				content: `**${deck}** empty.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const timeoutId = setTimeout(async () => interaction.reply(buildContent(card)), 30000);

		const buttons = new ActionRowBuilder().addComponents(
			getCorrectButton().setCustomId(`correct_${deck}_${card.id}_${timeoutId}`),
			getIncorrectButton().setCustomId(`incorrect_${deck}_${card.id}_${timeoutId}`)
		);

		interaction.reply({
			content: buildContent(card),
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
