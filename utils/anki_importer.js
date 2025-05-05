"use strict";

const fs = require("fs");
const { JSDOM } = require("jsdom");
// const beautify = require("js-beautify").html;

function extractReading(htmlContent) {
	let reading = "";
	let i = 0;

	while (i < htmlContent.length) {
		if (htmlContent.slice(i, i + 6) === "<ruby>") {
			let rubyEnd = htmlContent.indexOf("</ruby>", i);
			let rubyContent = htmlContent.slice(i + 6, rubyEnd);

			let rtStart = rubyContent.indexOf("<rt>");
			if (rtStart !== -1) reading += rubyContent.slice(rtStart + 4, rubyContent.indexOf("</rt>", rtStart));

			i = rubyEnd + 7;
		} else {
			reading += htmlContent[i];
			i++;
		}
	}

	return reading;
}

function parseAnkiExport(path) {
	const content = fs.readFileSync(path, "utf-8");
	const cards = content
		.split("\n")
		.filter((line) => !line.startsWith("#"))
		.join("\n")
		.split('</div>"\n')
		.filter((card) => card.trim() !== "");

	const parsedCards = [];

	for (const card of cards) {
		const parts = card.split("\t");
		const frontDOM = new JSDOM(parts[0].slice(1, parts[0].length - 1).replaceAll('""', '"'));
		const backDOM = new JSDOM((parts[1].slice(1) + "</div>").replaceAll('""', '"'));
		const front = frontDOM.window.document;
		const back = backDOM.window.document;

		const kanji = front.querySelector('div[class="frontbg"] > div:nth-child(1)').textContent.trim();
		const reading = extractReading(back.querySelector('div[class="frontbg"] > div:nth-child(1)').innerHTML);

		const categories = Array.from(new Set(Array.from(back.querySelectorAll("span[data-sc-code]"))));
		const meanings = {};
		const seenMeanings = new Map();

		for (const category of categories) {
			const categoryText = category.textContent.trim();
			const meaningArray = Array.from(
				category.parentElement.querySelectorAll('ul[data-sc-content="glossary"] li')
			).map((li) => li.textContent.trim());

			const meaningString = JSON.stringify(meaningArray);

			if (seenMeanings.has(meaningString)) {
				seenMeanings.get(meaningString).push(categoryText);
			} else {
				seenMeanings.set(meaningString, [categoryText]);
			}
		}

		for (const [meaningString, categoryList] of seenMeanings.entries()) {
			const joinedCategories = categoryList.join(", ");
			meanings[joinedCategories] = JSON.parse(meaningString);
		}

		const exampleDiv = front.querySelector('div[class="frontbg"] > div:nth-child(3)');
		const example = exampleDiv ? exampleDiv.textContent.trim() : "";

		const formsLi = back.querySelector('li[data-sc-content="forms"]');
		const forms = formsLi
			? Array.from(formsLi.querySelectorAll("table tr:first-child th"))
					.slice(1)
					.map((th) => th.textContent.trim())
			: [];

		parsedCards.push({
			kanji,
			reading,
			meanings,
			forms,
			example,
		});
	}

	return parsedCards;
}

function saveCardsToJson(file) {
	const filename = `${file.split(".")[0]}.json`;
	try {
		fs.writeFileSync(filename, JSON.stringify(parseAnkiExport(file), null, 1));
		return filename;
	} catch (err) {
		console.log(err);
		return null;
	}
}

// saveCardsToJson("./Default.txt");

module.exports = {
	saveCardsToJson,
};
