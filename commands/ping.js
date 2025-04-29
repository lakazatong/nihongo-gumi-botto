"use strict";

async function callback(interaction) {
	await interaction.reply("Pong!");
}

module.exports = {
	callback,
};
