"use strict";

const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");

function callback(interaction) {
	interaction.reply({
		content: `All deck related commands use your default deck if none is provided.
They execute only if you are the owner.
For \`/add\` and \`/import\`, you become the owner if the deck had none.

The anki's export type the \`/import\` command expects is \`Cards in Plain Text (.txt)\` with \`Include HTML and media references\` checked.
To properly setup Anki so that the export works:

- Anki app > Tools > Manage Note Types > Basic > Cards
  - Front Template > \`{{edit:Front}}\`
  - Back Template > \`{{edit:Back}}\`
  - Styling > content of the attached \`styles.css\`

If you use the Yomitan extension to add cards to anki:

- Anki app > Tools > Add-ons > Get Add-ons... > \`2055492159\` > OK
- Yomitan extension > Settings > Anki > Configure Anki flashcards... > For your chosen format
  - Dictionary Type > \`Term\`
  - Model > \`Basic\`
  - Front > \`<div id=frontbg><div style='font-family: BIZ UDGothic; font-size: 48px;'>{expression}</div><br><div style='font-family: BIZ UDGothic; font-size: 24px;'>{sentence}</div></div>\`
  - Back > \`<div id=frontbg><div style='font-family: BIZ UDGothic; font-size: 48px;'>{furigana}</div><br><div style='font-family: BIZ UDGothic; font-size: 24px;'>{sentence}</div></div><div id=backbg>{glossary-brief}</div>\`

This will make sure the cards you add using Yomitan, once exported from Anki, can be properly imported using \`/import\`.

If you want your cards to be formatted just like anki's imported cards are, follow these rules:

- **kanji**, **reading**, **example**
  - No special formatting, they are used as is.
- **meanings**
  - Categories are separated by \`;\`, each category is separated using \`:\`, on the left, the category name, on the right and comma separated, meanings for that category.
  - Example: \`no-adj, na-adj, noun:reverse,opposite;na-adj, noun:converse (of a hypothesis, etc.);prefix, math:inverse (function)\`
- **forms**
  - Comma separated.
  - Example: \`顔,貌,顏\``,
		flags: MessageFlags.Ephemeral,
		files: [new AttachmentBuilder("./styles.css")],
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Details about deck commands."),
	callback,
};
