'use strict';

const fs = require('fs');
const { Client } = require('basic-ftp');
const zlib = require('zlib');
const xml2js = require('xml2js');

const ftpHost = 'ftp.edrdg.org';
const ftpPath = '/pub/Nihongo//JMdict_e.gz';
const localFilePath = 'JMdict.gz';
const xmlFilePath = 'JMdict.xml';

async function downloadFile() {
    const client = new Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: ftpHost,
            secure: false,
        });

        console.log('Downloading JMdict.gz from FTP...');
        await client.downloadTo(localFilePath, ftpPath);
        console.log('Download complete.');
    } catch (err) {
        console.error('Error downloading the file:', err);
    } finally {
        client.close();
    }

    decompressAndParse();
}

function decompressAndParse() {
    const readStream = fs.createReadStream(localFilePath);
    const writeStream = fs.createWriteStream(xmlFilePath);

    const gunzip = zlib.createGunzip();
    readStream.pipe(gunzip).pipe(writeStream);

    writeStream.on('finish', () => {
        console.log('Decompression complete, now parsing the XML file...');
        parseXML(xmlFilePath);
    });

    writeStream.on('error', (err) => {
        console.error('Error during decompression:', err);
    });
}

`
entry example

{
    "ent_seq": "1417550",
    "k_ele": {
        "keb": "単純",
        "ke_pri": [
            "ichi1",
            "news1",
            "nf04"
        ]
    },
    "r_ele": {
        "reb": "たんじゅん",
        "re_pri": [
            "ichi1",
            "news1",
            "nf04"
        ]
    },
    "sense": {
        "pos": [
            "&adj-na;",
            "&n;"
        ],
        "ant": "複雑",
        "gloss": [
            "simple",
            "plain",
            "uncomplicated",
            "straightforward",
            "simple-minded",
            "naive"
        ]
    }
}
`

function parseXML() {
    fs.readFile(xmlFilePath, 'utf8', (err, data) => {
        if (err) throw err;

        const parser = new xml2js.Parser({
            explicitArray: false,
            normalizeTags: true,
            strict: false
        });

        parser.parseString(data, (err, result) => {
            if (err) throw err;

            const JMdictReadings = {};
            for (const entry of result.jmdict.entry) {
                if (entry?.k_ele && !entry.k_ele.keb) {
                    for (let i = 0; i < Math.min(entry.k_ele.length, entry.r_ele.length); i++)
                        JMdictReadings[entry.k_ele[i].keb] = entry.r_ele[i].reb;
                } else if (entry?.k_ele?.keb) {
                    // if (kanjiOrder[entry.k_ele.keb]) {
                    //     console.log(`Duplicate entry for ${entry.k_ele.keb}: ${JSON.stringify(entry, null, 4)}`);
                    // }
                    JMdictReadings[entry.k_ele.keb] = entry.r_ele.reb;
                }
            }

            fs.writeFileSync('JMdictReadings.json', JSON.stringify(JMdictReadings, null, 1), 'utf8');
            console.log('JMdictReadings.json file has been saved.');
        });
    });
}

if (fs.existsSync(xmlFilePath)) {
    console.log('XML file exists, parsing it...');
    parseXML();
} else if (fs.existsSync(localFilePath)) {
    console.log('GZ file exists, decompressing it...');
    decompressAndParse();
} else {
    console.log('Neither file exists, downloading the GZ file...');
    downloadFile();
}
