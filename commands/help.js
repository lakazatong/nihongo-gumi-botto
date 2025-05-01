"use strict";

async function callback(interaction) {
	const explainationMessage1 = `Uses the provided deck or your default deck.
    The command executes only if you are the owner of the deck.`;
	const explainationMessage2 = `Uses the provided deck or your default deck.
The command executes only if the deck has no owner or if you are the owner of the deck.
If the deck has no owner, you become the owner of the deck.`;

	await interaction.reply("Pong!");
}

module.exports = {
	callback,
};
