"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

async function callback(interaction) {
	await interaction.reply({
		content: "Pong!",
		flags: MessageFlags.Ephemeral,
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Replies with Pong!"),
	callback,
};
