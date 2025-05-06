"use strict";

const { ButtonBuilder, ButtonStyle } = require("discord.js");

const getCorrectButton = () => new ButtonBuilder().setCustomId("correct").setLabel("✅").setStyle(ButtonStyle.Success);

const getIncorrectButton = () =>
	new ButtonBuilder().setCustomId("incorrect").setLabel("❌").setStyle(ButtonStyle.Danger);

module.exports = {
	getCorrectButton,
	getIncorrectButton,
};
