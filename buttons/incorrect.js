"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { kanjis_db } = require("../database/kanjis.js");

const getIncorrectButton = () =>
	new ButtonBuilder().setCustomId("incorrect").setLabel("❌").setStyle(ButtonStyle.Danger);

async function callback(interaction) {
	const [_, id] = interaction.customId.split("_");
	kanjis_db.get("SELECT * FROM kanjis WHERE id = ?", [id], (err, row) => {
		if (err) {
			console.error(err);
			return;
		}
		kanjis_db.run("UPDATE kanjis SET score = ? WHERE id = ?", [Math.max(0, row.score - 1), id], async (err) => {
			if (err) {
				console.error(err);
				return;
			}
			const button = new ActionRowBuilder().addComponents(getIncorrectButton().setDisabled(true));
			await interaction.update({
				content: `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`,
				components: [button],
			});
		});
	});
}

module.exports = {
	callback,
	getIncorrectButton,
};
