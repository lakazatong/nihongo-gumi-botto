"use strict";

const fs = require("fs");

const { Client, GatewayIntentBits, REST, Routes, Partials } = require("discord.js");
const { checkDeckOwnership, checkOrCreateDeckOwnership } = require("./utils/deck.js");

require("dotenv").config();

// long requires
require("./database/decks.js");
require("./utils/anki_importer.js");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildExpressions,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.DirectMessagePolls,
	],
	partials: [
		Partials.User,
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
		Partials.Reaction,
		Partials.GuildScheduledEvent,
		Partials.ThreadMember,
		Partials.SoundboardSound,
	],
});

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
		body: fs
			.readdirSync("./commands")
			.filter((file) => file.endsWith(".js"))
			.map((file) => require(`./commands/${file}`).data.toJSON()),
	});

	console.log("Slash commands online.");
})();

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isCommand()) {
		const { callback } = require("./commands/" + interaction.commandName + ".js");
		if (callback) {
			if (["default", "help", "ping"].includes(interaction.commandName)) {
				callback(interaction);
			} else {
				(["add", "load"].includes(interaction.commandName) ? checkOrCreateDeckOwnership : checkDeckOwnership)(
					interaction,
					(deck) => {
						callback(interaction, deck);
					}
				);
			}
		}
	} else if (interaction.isButton()) {
		const [action, _] = interaction.customId.split("_");
		const mod = require("./buttons/" + action + ".js");
		if (mod) mod.callback(interaction);
	}
});

client.login(process.env.DISCORD_TOKEN);
