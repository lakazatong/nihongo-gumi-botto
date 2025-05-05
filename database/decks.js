"use strict";

const { MessageFlags } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();

function isOk(interaction, err) {
	if (err) {
		interaction.reply({
			content: err?.message || "An error occurred with sqlite.",
			flags: MessageFlags.Ephemeral,
		});
		return false;
	}
	return true;
}

class DecksDatabase {
	constructor(path = "./database/decks.db") {
		this.db = new sqlite3.Database(path, (err) => {
			if (err) {
				console.error("Error opening decks.db:", err.message);
			} else {
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS defaults (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        deck TEXT NOT NULL,
						UNIQUE (user_id)
                    )
                `);
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS owners (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id TEXT NOT NULL,
						deck TEXT NOT NULL,
						UNIQUE (user_id, deck)
					)
                `);
			}
		});
	}

	/* defaults handling */

	/* getters */

	getDefaultDeck(interaction, userId, callback) {
		this.db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
			if (isOk(interaction, err)) callback(row?.deck);
		});
	}

	/* setters */

	updateDefault(interaction, userId, deck, callback) {
		this.db.run(`INSERT OR IGNORE INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
			if (!isOk(interaction, err)) return;
			if (this.changes === 0) {
				interaction.reply({
					content: `Your default deck is already **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback?.(this);
		});
	}

	/* owners handling */

	/* getters */

	getOwners(interaction, deck, callback) {
		this.db.all(`SELECT user_id FROM owners WHERE deck = ?`, [deck], (err, rows) => {
			if (isOk(interaction, err)) callback(rows?.map((row) => row.user_id) || []);
		});
	}

	ifDeckExists(interaction, deck, callback) {
		this.getOwners(interaction, deck, (owner_ids) => {
			if (owner_ids.length > 0) {
				callback(owner_ids);
			} else {
				interaction.reply({
					content: `Deck **${deck}** doesn't exist.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}

	ifOwner(interaction, userId, deck, callback) {
		this.ifDeckExists(interaction, deck, (owner_ids) => {
			if (owner_ids.some((id) => id === userId)) {
				callback(owner_ids);
			} else {
				interaction.reply({
					content: `Your are not the owner of the deck **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}

	/* setters */

	addOwner(interaction, userId, deck, callback) {
		this.db.run(`INSERT OR IGNORE INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	removeOwner(interaction, userId, deck, callback) {
		this.db.run(`DELETE FROM owners WHERE user_id = ? AND deck = ?`, [userId, deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	removeOwners(interaction, deck, callback) {
		this.db.run(`DELETE FROM owners WHERE deck = ?`, [deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	/* decks handling */

	/* getters */

	getRandomCard(interaction, deck, callback) {
		this.db.get(`SELECT * FROM ${deck} ORDER BY RANDOM() LIMIT 1`, [deck], (err, row) => {
			if (!isOk(interaction, err)) return;
			if (!row) {
				interaction.reply({
					content: "Empty deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback(row);
		});
	}

	getCardById(interaction, deck, id, callback) {
		this.db.get(`SELECT * FROM ${deck} WHERE id = ?`, [id], (err, row) => {
			if (!isOk(interaction, err)) return;
			if (!row) {
				interaction.reply({
					content: `No card with id ${id}.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback(row);
		});
	}

	getCardByKanji(interaction, deck, kanji, callback) {
		this.db.get(`SELECT * FROM ${deck} WHERE kanji = ?`, [kanji], (err, row) => {
			if (!isOk(interaction, err)) return;
			if (!row) {
				interaction.reply({
					content: `No card with kanji ${kanji}.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback(row);
		});
	}

	getDecks(interaction, userId, callback) {
		this.db.all(`SELECT deck FROM owners WHERE user_id = ?`, [userId], (err, rows) => {
			if (!isOk(interaction, err)) return;
			if (!rows || rows.length === 0) {
				interaction.reply({
					content: `You don't own any decks.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback(rows.map((row) => row.deck));
		});
	}

	getDeckStats(interaction, deck, callback) {
		this.db.get(
			`SELECT COUNT(*) as count, SUM(score) as total, AVG(score) as average FROM ${deck}`,
			[],
			(err, stats) => {
				if (isOk(interaction, err)) callback(stats);
			}
		);
	}

	getAllDeckStats(interaction, userId, callback) {
		this.getDecks(interaction, userId, (decks) => {
			const stats = [];
			let remaining = decks.length;

			decks.forEach((deck) => {
				this.db.get(
					`SELECT 
						COUNT(*) as count,
						SUM(score) as total,
						AVG(score) as average
					 FROM ${deck}`,
					[],
					(err, row) => {
						if (err) {
							stats.push({ deck, count: undefined, total: undefined, average: undefined });
						} else {
							row.deck = deck;
							stats.push(row);
						}
						if (--remaining === 0) callback(stats);
					}
				);
			});
		});
	}

	/* setters */

	addCard(interaction, deck, kanji, reading, meanings, forms, example, callback) {
		this.db.run(
			`INSERT OR IGNORE INTO ${deck} (kanji, reading, meanings, forms, example) VALUES (?, ?, ?, ?, ?)`,
			[kanji, reading, meanings, forms, example],
			function (err) {
				if (!isOk(interaction, err)) return;
				if (this.changes === 0) {
					interaction.reply({
						content: `The kanji **${kanji}** already exists in the deck **${deck}**.`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				callback?.(this);
			}
		);
	}

	clearDeck(interaction, deck, callback) {
		this.db.run(`DELETE FROM ${deck}`, [], function (err) {
			if (!isOk(interaction, err)) return;
			if (this.changes === 0) {
				interaction.reply({
					content: `The deck **${deck}** is already empty.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback?.(this);
		});
	}

	updateCard(interaction, deck, kanji, reading, meanings, forms, example, callback) {
		const fields = [];
		const values = [];

		if (reading) {
			fields.push("reading = ?");
			values.push(reading);
		}
		if (meanings) {
			fields.push("meanings = ?");
			values.push(meanings);
		}
		if (forms) {
			fields.push("forms = ?");
			values.push(forms);
		}
		if (example) {
			fields.push("example = ?");
			values.push(example);
		}

		if (fields.length === 0) {
			interaction.reply({
				content: "No values provided to update.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		values.push(kanji);

		this.db.run(`UPDATE ${deck} SET ${fields.join(", ")} WHERE kanji = ?`, values, function (err) {
			if (!isOk(interaction, err)) return;
			if (this.changes === 0) {
				interaction.reply({
					content: `The kanji **${kanji}** in deck **${deck}** is unchanged.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback?.(this);
		});
	}

	deleteCard(interaction, deck, kanji, callback) {
		this.db.run(`DELETE FROM ${deck} WHERE kanji = ?`, [kanji], function (err) {
			if (!isOk(interaction, err)) return;
			if (this.changes === 0) {
				interaction.reply({
					content: `The kanji **${kanji}** in deck **${deck}** never existed.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback?.(this);
		});
	}

	updateScoreById(interaction, deck, id, newScore, callback) {
		this.db.run(`UPDATE ${deck} SET score = ? WHERE id = ?`, [newScore, id], function (err) {
			if (!isOk(interaction, err)) return;
			if (this.changes === 0) {
				interaction.reply({
					content: `The score is unchanged.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback?.(this);
		});
	}

	createDeck(interaction, userId, deck, callback) {
		const self = this;
		self.db.run(
			`CREATE TABLE ${deck} (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				kanji TEXT,
				reading TEXT NOT NULL,
				meanings TEXT NOT NULL,
				forms TEXT,
				example TEXT,
				score INTEGER NOT NULL DEFAULT 0,
				UNIQUE (kanji)
			)`,
			[],
			function (err) {
				if (!isOk(interaction, err)) return;
				const createDeckResponse = this;
				self.addOwner(interaction, userId, deck, function (addOwnerResponse) {
					callback?.(createDeckResponse, addOwnerResponse);
				});
			}
		);
	}

	dropDeck(interaction, deck, callback) {
		const self = this;
		self.db.run(`DROP TABLE ${deck}`, [], function (err) {
			if (!isOk(interaction, err)) return;
			const dropDeckResponse = this;
			self.removeOwners(interaction, deck, function (removeOwnersResponse) {
				callback?.(dropDeckResponse, removeOwnersResponse);
			});
		});
	}
}

module.exports = new DecksDatabase();
