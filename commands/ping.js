"use strict";

const { SlashCommandBuilder } = require("discord.js");

async function callback(interaction) {
	await interaction.reply("Pong!");
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Replies with Pong!"),
	callback,
};
