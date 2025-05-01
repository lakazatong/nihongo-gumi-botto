"use strict";

const { ActionRowBuilder } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");

async function callback(interaction, deck) {
	db.getRandomCard(interaction, deck, (row) => {
		const buttons = new ActionRowBuilder().addComponents(
			getCorrectButton().setCustomId(`correct_${row.id}`),
			getIncorrectButton().setCustomId(`incorrect_${row.id}`)
		);

		interaction.reply({
			content: row.sentence
				? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
				: `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
			components: [buttons],
		});

		setTimeout(async () => {
			interaction.editReply({
				content: row.sentence
					? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
					: `${row.kanji}\n${row.reading}\n${row.meanings}`,
				components: [],
			});
		}, 30000);
	});
}

module.exports = callback;
