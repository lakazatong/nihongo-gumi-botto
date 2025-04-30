"use strict";

const { ActionRowBuilder, MessageFlags } = require("discord.js");
const { kanjis_db } = require("../database/kanjis.js");
const { getDeck } = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");

async function callback(interaction) {
	function help(deck) {
		kanjis_db.get("SELECT * FROM kanjis WHERE deck = ? ORDER BY RANDOM() LIMIT 1", [deck], async (err, row) => {
			if (err) {
				console.error(err);
				return;
			}
			if (!row) {
				await interaction.reply("Empty deck.");
				return;
			}
			const buttons = new ActionRowBuilder().addComponents(
				getCorrectButton().setCustomId(`correct_${row.id}`),
				getIncorrectButton().setCustomId(`incorrect_${row.id}`)
			);

			await interaction.reply({
				content: row.sentence
					? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
					: `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
				components: [buttons],
			});

			setTimeout(async () => {
				await interaction.editReply({
					content: row.sentence
						? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
						: `${row.kanji}\n${row.reading}\n${row.meanings}`,
					components: [],
				});
			}, 30000);
		});
	}

	const deck = interaction.options.getString("deck") || null;
	if (deck) {
		exists(deck, async (err, bool) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while checking if the deck exists.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (bool) {
				help(deck);
			} else {
				await interaction.reply("Empty deck.");
			}
		});
	} else {
		getDeck(interaction.user.id, (err, deck) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while fetching the deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			if (deck) {
				help(deck);
			} else {
				interaction.reply({
					content: "You don't have a default deck yet. Please set it first with the deck command.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		});
	}
}

module.exports = {
	callback,
};
