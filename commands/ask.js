"use strict";

const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");

async function callback(interaction, deck) {
	db.getRandomCard(interaction, deck, (row) => {
		const timeoutId = setTimeout(async () => {
			interaction.editReply({
				content: row.sentence
					? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
					: `${row.kanji}\n${row.reading}\n${row.meanings}`,
				components: [],
			});
		}, 30000);

		const buttons = new ActionRowBuilder().addComponents(
			getCorrectButton().setCustomId(`correct_${row.id}_${timeoutId}`),
			getIncorrectButton().setCustomId(`incorrect_${row.id}_${timeoutId}`)
		);

		interaction.reply({
			content: row.sentence
				? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
				: `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
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
