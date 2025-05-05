"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const { saveCardsToJson } = require("../utils/anki_importer.js");
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

		fs.unlink(cardsPath, (err) => {
			if (err) {
				console.error("fs.unlink", err);
			}
		});
		fs.unlink(filename, (err) => {
			if (err) {
				console.error("fs.unlink", err);
			}
		});

		const errKanjis = [];

		JSON.parse(fileContent).forEach(({ kanji, reading, meanings, forms, example }) => {
			db.db.run(
				`INSERT OR REPLACE INTO ${deck} (kanji, reading, meanings, forms, example) VALUES (?, ?, ?, ?, ?)`,
				[
					kanji,
					reading,
					Object.entries(meanings)
						.map(([category, values]) => `${category}:${values.join(",")}`)
						.join(";"),
					forms.join(",") || null,
					example || null,
				],
				function (err) {
					if (err) {
						errKanjis.push({
							kanji,
							message: err?.message || "An error occurred with sqlite.",
						});
					}
				}
			);
		});

		if (errKanjis.length > 0) {
			let replyContent = `The following kanjis failed to be added to **${deck}**:\n`;
			let currentLength = replyContent.length;

			for (let i = 0; i < errKanjis.length; i++) {
				const errorMessage = `- **${errKanjis[i].kanji}**: ${errKanjis[i].message}\n`;

				if (currentLength + errorMessage.length <= 2000) {
					replyContent += errorMessage;
					currentLength += errorMessage.length;
				} else {
					break;
				}
			}

			interaction.editReply({
				content: replyContent,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			interaction.editReply({
				content: `All kanjis of **${filename}** were successfully imported into **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	} catch (err) {
		interaction.editReply({
			content: "An error occurred while downloading or processing the file.",
			flags: MessageFlags.Ephemeral,
		});
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Imports all cards from the provided anki's exported file in a deck.")
		.addAttachmentOption((opt) => opt.setName("file").setDescription("The file to import").setRequired(true))
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
