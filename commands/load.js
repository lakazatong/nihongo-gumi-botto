"use strict";

const { MessageFlags } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const { saveCardsToJson } = require("../utils/anki_parser.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const attachment = interaction.options.getAttachment("file");

	await interaction.reply({
		content: "Processing your file...",
		flags: MessageFlags.Ephemeral,
	});

	const fileUrl = attachment.url;
	const filename = attachment.name;

	try {
		const response = await axios.get(fileUrl, {
			responseType: "stream",
		});
		const writer = fs.createWriteStream(filename);
		response.data.pipe(writer);

		await new Promise((resolve, reject) => {
			writer.on("finish", resolve);
			writer.on("error", reject);
		});

		const cardsPath = saveCardsToJson(filename);
		if (!cardsPath) {
			interaction.editReply({
				content: "An error occurred while parsing the file.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const fileContent = fs.readFileSync(cardsPath, "utf-8");
		const errorKanji = [];

		JSON.parse(fileContent).forEach(({ kanji, reading, meanings, sentence }) => {
			const formattedMeanings = Object.entries(meanings)
				.map(([category, values]) => `${category}:\n- ${values.join("\n- ")}`)
				.join("\n\n");

			db.db.run(
				`INSERT OR REPLACE INTO decks (deck, kanji, reading, meanings, sentence)
						 VALUES (?, ?, ?, ?, ?)`,
				[deck, kanji, reading, formattedMeanings, sentence || null],
				(err) => {
					errorKanji.push(kanji);
				}
			);
		});

		await Promise.all([
			fs.unlink(cardsPath, (err) => {
				console.error("fs.unlink", err);
			}),
			fs.unlink(filename, (err) => {
				console.error("fs.unlink", err);
			}),
		]);

		if (errorKanji.length > 0) {
			interaction.editReply({
				content: `The following kanjis failed to be added to the deck ${deck}:\n${errorKanji.join(", ")}`,
			});
		} else {
			interaction.editReply({
				content: `All kanjis of ${filename} were successfully loaded into the deck ${deck}!`,
			});
		}
	} catch (err) {
		console.error("load", err);
		interaction.editReply({
			content: "An error occurred while getting the file.",
			flags: MessageFlags.Ephemeral,
		});
	}
}

module.exports = callback;
