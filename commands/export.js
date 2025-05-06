"use strict";

const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const db = require("../database/decks.js");

function callback(interaction, deck) {
	interaction.reply("todo");
	const lines = ["#separator:tab", "#html:true"];
	db.getAllCards(interaction, deck, ({ kanji, reading, meanings, forms, example }) => {
		const front = `<div id="frontbg"><div style="font-family: BIZ UDGothic; font-size: 48px">${kanji}</div><br/><div style="font-family: BIZ UDGothic; font-size: 24px">${example}</div></div>`;
		const backFront = `<div id="frontbg">
	<div style="font-family: BIZ UDGothic; font-size: 48px">
		<ruby>読<rt>よ</rt></ruby
		>む
	</div>
	<br />
	<div style="font-family: BIZ UDGothic; font-size: 24px">読め</div>
</div>`;
	});
	interaction.reply({
		content: "",
		files: [new AttachmentBuilder(lines.join("\n"), { name: `${deck}.txt` })],
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Exports all cards from a deck in the same format they were imported.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
