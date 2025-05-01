"use strict";

const { SlashCommandBuilder } = require("discord.js");

function callback(interaction) {
	interaction.reply(`All deck related commands use your default deck if none is provided.
They execute only if you are the owner.
For \`add\` and \`load\`, you become the owner if the deck had none.

The anki's export type the \`load\` command expects is "Cards in Plain Text (.txt)" with "Include HTML and media references" checked.`);
}

module.exports = {
	data: new SlashCommandBuilder().setName("help").setDescription("Details about deck commands."),
	callback,
};
