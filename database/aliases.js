"use strict";

const sqlite3 = require("sqlite3").verbose();

const aliases_db = new sqlite3.Database("./database/aliases.db", (err) => {
	if (err) {
		console.error("Error opening aliases.db:", err.message);
	} else {
		aliases_db.run(`
            CREATE TABLE IF NOT EXISTS aliases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                alias TEXT NOT NULL
            )
        `);
	}
});

function getOrDefaultAlias(userId, defaultAlias) {
	return new Promise((resolve, reject) => {
		aliases_db.get(`SELECT alias FROM aliases WHERE user_id = ?`, [userId], (err, row) => {
			if (err) {
				reject(err);
			} else if (row) {
				resolve(row.alias);
			} else {
				aliases_db.run(
					`INSERT INTO aliases (user_id, alias) VALUES (?, ?)`,
					[userId, defaultAlias],
					function (err) {
						if (err) {
							reject(err);
						} else {
							resolve(defaultAlias);
						}
					}
				);
			}
		});
	});
}

module.exports = {
	aliases_db,
	getOrDefaultAlias,
};
