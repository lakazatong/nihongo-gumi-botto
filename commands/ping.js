"use strict";

const { SlashCommandBuilder } = require("discord.js");

async function callback(interaction) {
	await interaction.reply("Pong!");
}

module.exports = {
	data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
	callback,
};
