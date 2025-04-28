'use strict';

const fs = require('fs');
const { JSDOM } = require('jsdom');
const beautify = require('js-beautify').html;

function pprint(element) {
    console.log(beautify(element.outerHTML, { indent_size: 4 }));
}

// const JMdictReadings = JSON.parse(fs.readFileSync('JMdictReadings.json', 'utf8'));

function extractReading(htmlContent) {
    let reading = '';
    let i = 0;

    while (i < htmlContent.length) {
        if (htmlContent.slice(i, i + 6) === '<ruby>') {
            let rubyEnd = htmlContent.indexOf('</ruby>', i);
            let rubyContent = htmlContent.slice(i + 6, rubyEnd);

            let rtStart = rubyContent.indexOf('<rt>');
            if (rtStart !== -1)
                reading += rubyContent.slice(rtStart + 4, rubyContent.indexOf('</rt>', rtStart));

            i = rubyEnd + 7;
        } else {
            reading += htmlContent[i];
            i++;
        }
    }

    return reading;
}

function parseAnkiExport(path) {
    const content = fs.readFileSync(path, 'utf-8');
    const cards = content.split('\n').filter(line => !line.startsWith('#')).join('\n').split('</div>"\n').filter(card => card.trim() !== '');

    const parsedCards = [];

    for (const card of cards) {
        const parts = card.split('\t');
        const frontDOM = new JSDOM((parts[0].slice(1, parts[0].length - 1)).replaceAll('""', '"'));
        const backDOM = new JSDOM((parts[1].slice(1) + "</div>").replaceAll('""', '"'));
        const front = frontDOM.window.document;
        const back = backDOM.window.document;

        const kanji = front.querySelector('div[class="frontbg"] > div:nth-child(1)').textContent.trim();
        const reading = extractReading(back.querySelector('div[class="frontbg"] > div:nth-child(1)').innerHTML);

        const categories = Array.from(new Set(Array.from(back.querySelectorAll('span[data-sc-code]'))));
        const meanings = {};
        const seenMeanings = new Set();

        for (const category of categories) {
            const categoryText = category.textContent.trim();
            const meaningArray = Array.from(category.parentElement.querySelectorAll('ul[data-sc-content="glossary"] li'))
                .map(li => li.textContent.trim());

            const meaningString = JSON.stringify(meaningArray);

            if (!seenMeanings.has(meaningString)) {
                meanings[categoryText] = meaningArray;
                seenMeanings.add(meaningString);
            }
        }

        const sentenceDiv = front.querySelector('div[class="frontbg"] > div:nth-child(3)');
        const sentence = sentenceDiv ? sentenceDiv.textContent.trim() : '';

        parsedCards.push({
            kanji,
            reading,
            meanings,
            sentence
        });
    }

    // parsedCards.sort((a, b) => {
    //     return (JMdictReadings[a.kanji] || a.reading).localeCompare(JMdictReadings[b.kanji] || b.reading, 'ja');
    // });

    return parsedCards;
}

function saveCardsToJson(filename) {
    const cards = parseAnkiExport(`${filename}.txt`);

    fs.writeFile(`${filename}.json`, JSON.stringify(cards, null, 4), (err) => {
        if (err) throw err;
        console.log(`${filename}.json has been saved!`);
    });
}

saveCardsToJson('anki');
saveCardsToJson('Yomitan');

// parseAnkiExport('Yomitan.txt');
