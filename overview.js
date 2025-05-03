const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder } = require("discord.js");

const commandsDir = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith(".js"));

const overview = [];

commandFiles.forEach((file) => {
	const command = require(path.join(commandsDir, file));
	const commandName = command.data.name;
	const commandDescription = command.data.description;
	let options = "";

	if (command.data.options?.length > 0) {
		options = command.data.options
			.map((option) => {
				const optionName = option.name;
				const optionDescription = option.description;
				const optionRequired = option.required ? "Required" : "Optional";
				return `- ${optionName}: ${optionDescription} (${optionRequired})`;
			})
			.join("\n");

		options = `Options:\n${options}`;
	}

	overview.push({
		name: commandName,
		description: commandDescription,
		options: options,
	});
});

const overviewText = overview
	.map((cmd) => {
		return `**/${cmd.name}**: ${cmd.description}\n${cmd.options}`.trim();
	})
	.join("\n\n");

fs.writeFileSync(path.join(__dirname, "bot_overview.txt"), overviewText);

console.log("Bot overview written to 'bot_overview.txt'.");
