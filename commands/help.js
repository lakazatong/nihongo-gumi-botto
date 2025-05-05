"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

function callback(interaction) {
	interaction.reply({
		content: `All deck related commands use your default deck if none is provided.
They execute only if you are the owner.
For \`add\` and \`import\`, you become the owner if the deck had none.

The anki's export type the \`import\` command expects is "Cards in Plain Text (.txt)" with "Include HTML and media references" checked.`,
		flags: MessageFlags.Ephemeral,
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Details about deck commands."),
	callback,
};
