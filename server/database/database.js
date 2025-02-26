import { open } from "sqlite";
import sqlite from "sqlite3";

async function init() {
  const db = await open({
    filename: "./server/database/database.sqlite",
    driver: sqlite.Database,
  });
  await db.migrate({ migrationsPath: "./server/database/migrations" });
  return db;
}

const connection = init();

export async function createGame(word) {
  const db = await connection;
  const result = await db.run("INSERT INTO Games (word) values (?)", [word]);
  return result.lastID;
}

export async function getWord(length, wotd) {
  switch (length) {
    case 5:
      if (wotd) {
        return getWOTD();
      }
      return getWord5();
    case 6:
      return getWord6();
    case 7:
      return getWord7();
    default:
      throw new Error("Word length not supported");
  }
}

export async function getNumberOfGames() {
  const db = await connection;
  const result = await db.get("SELECT COUNT(*) as count from Games;");
  return result.count;
}

export async function getNumberOfWins() {
  const db = await connection;
  const result = await db.get(
    "SELECT COUNT(*) as count from Games WHERE result = true;"
  );
  return result.count;
}

export async function updateWin(gameId, win) {
  const db = await connection;
  await db.run("UPDATE Games SET result = ? where id = ?", [win, gameId]);
}

export async function getWOTD() {
  const db = await connection;
  const result = await db.get(
    "SELECT word FROM Words WHERE DATE('now') = DATE(date);"
  );
  return result.word;
}

export async function getWord5() {
  const db = await connection;
  const result = await db.get(
    "SELECT word FROM Words ORDER BY RANDOM() LIMIT 1;"
  );
  return result.word;
}

export async function getWord6() {
  const db = await connection;
  const result = await db.get(
    "SELECT word FROM Words6 ORDER BY RANDOM() LIMIT 1;"
  );
  return result.word;
}

export async function getWord7() {
  const db = await connection;
  const result = await db.get(
    "SELECT word FROM Words7 ORDER BY RANDOM() LIMIT 1;"
  );
  return result.word;
}

export async function isWord(word) {
  switch (word.length) {
    case 5:
      return isWord5(word);
    case 6:
      return isWord6(word);
    case 7:
      return isWord7(word);
    default:
      return false;
  }
}

export async function isWord5(word) {
  const db = await connection;
  const result = await db.get(
    "SELECT * FROM Words WHERE word = ? COLLATE NOCASE",
    [word]
  );
  return !!result;
}
export async function isWord6(word) {
  const db = await connection;
  const result = await db.get(
    "SELECT * FROM Words6 WHERE word = ? COLLATE NOCASE",
    [word]
  );
  return !!result;
}
export async function isWord7(word) {
  const db = await connection;
  const result = await db.get(
    "SELECT * FROM Words7 WHERE word = ? COLLATE NOCASE",
    [word]
  );
  return !!result;
}

export async function getGame(id) {
  const db = await connection;
  const game = await db.get("SELECT * FROM Games WHERE id = ?", [id]);
  return game;
}

export async function getGuessCount(gameId) {
  const db = await connection;
  const count = await db.get(
    "SELECT count(*) as GuessCount FROM Guesses WHERE GameId = ?",
    [gameId]
  );
  return count.GuessCount;
}

export async function insertGuess(guess) {
  const db = await connection;
  db.run("INSERT INTO Guesses (guess, gameId) values (?, ?)", [
    guess.word,
    guess.gameId,
  ]);
}
