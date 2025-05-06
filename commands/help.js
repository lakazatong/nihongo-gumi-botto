"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");

function callback(interaction) {
	interaction.reply({
		content: `All deck related commands use your default deck if none is provided.
They execute only if you are the owner.
For \`add\` and \`import\`, you become the owner if the deck had none.

The anki's export type the \`import\` command expects is "Cards in Plain Text (.txt)" with "Include HTML and media references" checked.
To properly setup anki so that the export works, DM lakazatong on Discord.

If you want your cards to be formatted just like anki's imported cards look like, follow these rules:

kanji, reading and example have no special formatting, they are used as is

meanings:
\`no-adj, na-adj, noun:reverse,opposite;na-adj, noun:converse (of a hypothesis, etc.);prefix, math:inverse (function)\`
categories are separated by \`;\`
each category is separated using \`:\`
on the left, the category name, on the right and comma separated, meanings for that category

and finally forms are simply comma separated`,
		flags: MessageFlags.Ephemeral,
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Details about deck commands."),
	callback,
};
