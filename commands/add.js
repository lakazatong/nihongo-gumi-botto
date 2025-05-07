"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const forms =
		interaction.options
			.getString("forms")
			?.split(",")
			.filter((form) => form !== kanji)
			.join(",") || null;
	const example = interaction.options.getString("example") || null;

	db.getCardByKanji(interaction, deck, kanji, (card) => {
		if (card) {
			interaction.reply({
				content: `**${kanji}** already exists in **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			db.addCard(interaction, deck, kanji, reading, meanings, forms, example, () => {
				interaction.reply({
					content: `**${kanji}** added successfully to **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
			});
		}
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Adds a new card to a deck.")
		.addStringOption((opt) => opt.setName("kanji").setDescription("The kanjis writing").setRequired(true))
		.addStringOption((opt) => opt.setName("reading").setDescription("The kana writing").setRequired(true))
		.addStringOption((opt) => opt.setName("meanings").setDescription("The meanings").setRequired(true))
		.addStringOption((opt) => opt.setName("forms").setDescription("Alternative forms").setRequired(false))
		.addStringOption((opt) =>
			opt.setName("example").setDescription("An example sentence it's used in").setRequired(false)
		)
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
