"use strict";

function callback(interaction) {
	interaction.reply({
		content: `All deck related commands use your default deck if none is provided.
They execute only if you are the owner.
For \`add\` and \`load\`, you become the owner if the deck had none.`,
	});
}

module.exports = callback;
