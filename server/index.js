import express from "express";
import bodyParser from "body-parser";
import {
  createGame,
  getGame,
  getGuessCount,
  getWord,
  getNumberOfGames,
  getNumberOfWins,
  insertGuess,
  isWord,
  updateWin,
} from "./database/database.js";

const app = express();

app.use(express.static("./client"));
app.use(bodyParser.json());

function asyncWrap(f) {
  return (req, res, next) => {
    Promise.resolve(f(req, res, next)).catch((e) => next(e || new Error()));
  };
}

app.post(
  "/game",
  asyncWrap(async (req, res) => {
    const wordLength = req.body.length;
    console.log(req.body);
    const wotd = req.body.wotd;
    const word = await getWord(wordLength, wotd);
    console.log(word);
    const upperWord = word.toUpperCase();
    const gameId = await createGame(upperWord);
    res.json({
      id: gameId,
      wordLength: wordLength,
      maxGuesses: 6,
    });
  })
);
app.get(
  "/statistics",
  asyncWrap(async (req, res) => {
    const wins = await getNumberOfWins();
    const games = await getNumberOfGames();
    const winRate = wins > 0 ? Math.round((wins / games) * 100) : 0;
    res.json({
      games: games,
      wins: wins,
      winRate: winRate,
    });
  })
);

app.post(
  "/game/:gameId/guess",
  asyncWrap(async (req, res) => {
    const gameId = req.params.gameId;
    const game = await getGame(gameId);
    console.log(game);
    const word = game.word;
    const guess = req.body.guess;
    // Throw 400 if guess not same length as word
    if (guess.length != word.length) {
      res.status(400).send("Guess wrong length");
      return;
    }
    // Throw 400 if guesses database bigger than max guess
    const guessCount = await getGuessCount(gameId);
    if (guessCount >= 6) {
      res.status(400).send("Too many guesses");
      return;
    }
    if (!(await isWord(guess))) {
      res.json({ error: "NOT_WORD" });
      return;
    }
    insertGuess({
      gameId: gameId,
      word: guess,
    });
    let unmatchedLetters = word.split("").map((wordChar, i) => {
      const guessChar = guess[i];
      if (wordChar === guessChar) {
        return null;
      }
      return wordChar;
    });

    const result = guess.split("").map((guessChar, i) => {
      const wordChar = word[i];
      if (wordChar === guessChar) {
        return "correct";
      }
      if (unmatchedLetters.includes(guessChar)) {
        return "place";
      }
      return "wrong";
    });

    console.log(guess);
    console.log(guessCount);
    const isWin = guess === word;

    const gameOver = isWin || guessCount === 5;

    if (gameOver) {
      updateWin(gameId, isWin);
    }

    res.json({
      result: result,
      win: isWin,
      gameOver: gameOver,
    });
  })
);

app.listen(8080);
