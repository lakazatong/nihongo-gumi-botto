"use strict";

const { MessageFlags } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const { saveCardsToJson } = require("../utils/anki_parser.js");
const { kanjis_db } = require("../database/kanjis.js");
const { getOrDefaultAlias } = require("../database/aliases.js");

async function callback(interaction) {
	const attachment = interaction.options.getAttachment("file");
	if (!attachment) {
		await interaction.reply({
			content: "No file provided.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.reply({
		content: "Processing your file...",
		flags: MessageFlags.Ephemeral,
	});

	getOrDefaultAlias(interaction.user.id, interaction.user.username, async (err, alias) => {
		if (err) {
			console.error(err);
			await interaction.editReply({
				content: "An error occurred while fetching the alias.",
			});
			return;
		}

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
				await interaction.editReply({
					content: "An error occurred while parsing the file.",
				});
				return;
			}
			const fileContent = fs.readFileSync(cardsPath, "utf-8");

			JSON.parse(fileContent).forEach(({ kanji, reading, meanings, sentence }) => {
				const formattedMeanings = Object.entries(meanings)
					.map(([category, values]) => `${category}: ${values.join(", ")}`)
					.join("\n");

				kanjis_db.run(
					"INSERT INTO kanjis (alias, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)",
					[alias, kanji, reading, formattedMeanings, sentence || null],
					async (err) => {
						if (err) console.error(err);
					}
				);
			});

			await Promise.all([
				fs.unlink(cardsPath, (err) => {
					console.error(err);
				}),
				fs.unlink(filename, (err) => {
					console.error(err);
				}),
			]);

			await interaction.editReply({
				content: `File ${filename} loaded successfully!`,
			});
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				content: "An error occurred while getting the file.",
			});
		}
	});
}

module.exports = {
	callback,
};
