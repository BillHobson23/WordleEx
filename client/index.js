"use strict";
// assign each button to event listener
function pageLoaded() {
  for (let i = 5; i < 8; i++) {
    const button = document.querySelector(`#create-random-${i}`);
    button.addEventListener("click", () => {
      createGame(i, false);
    });
  }
  document.querySelector("#create-wotd").addEventListener("click", () => {
    createGame(5, true);
  });
}

let wordLength = 0;

function displayGrid(rows, cols) {
  const gameContainer = document.getElementById("game-container");
  for (let i = 0; i < rows; i++) {
    let row = document.createElement("div");
    row.classList.add("game-row");
    for (let c = 0; c < cols; c++) {
      const letter = document.createElement("div");
      letter.id = `letter-${i}-${c}`;
      row.appendChild(letter).className = "letter";
    }
    gameContainer.appendChild(row);
  }
}

const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "I", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const allKeys = keyboardRows.flat();

// Displays the keyboard
function displayKeyboard() {
  const keyboardContainer = document.getElementById("keyboard-container");
  keyboardRows.forEach((keyboardRow) => {
    let rowDiv = document.createElement("div");
    rowDiv.classList.add("keyboard-row");
    keyboardRow.forEach((letter) => {
      const keyboardLetter = document.createElement("button");
      keyboardLetter.type = "submit";
      keyboardLetter.innerText = letter;
      keyboardLetter.setAttribute("id", `letter-${letter}`);
      keyboardLetter.addEventListener("click", () => handleInput(letter));
      keyboardLetter.tabIndex = -1;
      // gets rid of focus on keyboard
      keyboardLetter.addEventListener("focus", (event) => {
        event.target.blur();
      });
      rowDiv.appendChild(keyboardLetter).className = "keyboard-letter";
    });
    keyboardContainer.appendChild(rowDiv);
  });
}

async function displayStats(win) {
  const response = await fetch("statistics");
  const stats = await response.json();
  console.log(stats);
  const games = stats.games;
  const wins = stats.wins;
  const winRate = stats.winRate;
  const box = document.createElement("div");
  box.classList.add("statistics");
  const innerBox = document.createElement("div");
  const played = document.createElement("div");
  played.textContent = `Played: ${games}`;
  innerBox.appendChild(played);
  const winsDiv = document.createElement("div");
  winsDiv.textContent = `Wins: ${wins}`;
  innerBox.appendChild(winsDiv);
  const winRateDiv = document.createElement("div");
  winRateDiv.textContent = `Winrate: ${winRate}%`;
  innerBox.appendChild(winRateDiv);
  box.appendChild(innerBox);
  document.body.appendChild(box);
}

function handleInput(letter) {
  if (gameOver) {
    return;
  }
  console.log("clicked", letter);
  if (letter === "BACKSPACE") {
    deleteLetter();
    return;
  }
  if (letter === "ENTER") {
    checkRow();
    return;
  }
  if (currentColumn < wordLength && currentRow < 6) {
    addLetter(letter);
  }
}

let currentRow = 0;
let currentColumn = 0;

function addLetter(letter) {
  const grid = document.getElementById(`letter-${currentRow}-${currentColumn}`);
  grid.textContent = letter;
  currentColumn++;
}

function deleteLetter() {
  if (currentColumn > 0) {
    currentColumn--;
    const grid = document.getElementById(
      `letter-${currentRow}-${currentColumn}`
    );
    grid.textContent = "";
  }
}

async function checkRow() {
  if (currentColumn === wordLength) {
    let guess = "";
    for (let i = 0; i < currentColumn; i++) {
      const letter = document.getElementById(`letter-${currentRow}-${i}`);
      guess += letter.textContent;
    }
    const response = await fetch(`game/${gameId}/guess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guess,
      }),
    });
    const json = await response.json();
    if (json.error) {
      return;
    }
    const result = json.result;
    gameOver = json.gameOver;
    console.log(result);
    result.forEach((letterResult, i) => {
      const letter = document.getElementById(`letter-${currentRow}-${i}`);
      letter.classList.add(letterResult);
      const keyboardLetter = document.getElementById(`letter-${guess[i]}`);
      keyboardLetter.classList.add(letterResult);
    });
    currentRow++;
    currentColumn = 0;
    if (gameOver) {
      displayStats(json.win);
    }
  }
}

let gameId;
let gameOver;

// create game when button clicked
async function createGame(length, wotd) {
  const gameDiv = document.getElementById("game-selection");
  gameDiv.style.display = "none";
  const response = await fetch("game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      length,
      wotd,
    }),
  });
  const json = await response.json();
  const maxGuesses = json.maxGuesses;
  wordLength = json.wordLength;
  gameId = json.id;
  gameOver = false;
  displayGrid(maxGuesses, wordLength);
  displayKeyboard();
  window.addEventListener("keydown", (letter) => {
    const upperLetter = letter.key.toUpperCase();
    if (allKeys.includes(upperLetter)) {
      handleInput(upperLetter);
    }
  });
}

window.addEventListener("load", pageLoaded);
