"use strict";

const sqlite3 = require("sqlite3").verbose();

const kanjis_db = new sqlite3.Database("./database/kanjis.db", (err) => {
	if (err) {
		console.error("Error opening kanjis.db:", err.message);
	} else {
		kanjis_db.run(`
            CREATE TABLE IF NOT EXISTS kanjis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deck TEXT NOT NULL,
                kanji TEXT NOT NULL,
                reading TEXT NOT NULL,
                meanings TEXT NOT NULL,
                sentence TEXT,
                score INTEGER DEFAULT 0,
                UNIQUE (deck, kanji)
            )
        `);
	}
});

module.exports = {
	kanjis_db,
};
