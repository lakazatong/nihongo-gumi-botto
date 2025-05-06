const fs = require("fs");
const path = require("path");

const overview = [];

fs.readdirSync("../commands")
	.filter((file) => file.endsWith(".js"))
	.forEach((file) => {
		const command = require(`./commands/${file}`);
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

fs.writeFileSync("./bot_overview.txt", overviewText);

console.log("Bot overview written to 'bot_overview.txt'.");
