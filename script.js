// Main Menu DOM
const changeThemeEl = document.querySelector('.changeTheme');
const lightModeIconEl = document.querySelector('#lightTheme');
const darkModeIconEl = document.querySelector('#darkTheme');
const gameMenuEl = document.querySelector('.game-menu');
const pvpModeEl = document.querySelector('#pvp-mode');
const pvcModeEl = document.querySelector('#pvc-mode');
const gameModesEls = [pvpModeEl, pvcModeEl];

// Game DOM
let game;
const gameBoxEl = document.querySelector('.game-box');
const gameBoardEl = document.querySelector('.game-board');
const scoresEl = document.querySelector('#scores');
const playerXBadgeEL = document.querySelector('#player-x');
const playerOBadgeEL = document.querySelector('#player-o');
const btnNewGameEl = document.querySelector('#btnNewGame');
const btnNextRoundEl = document.querySelector('#btnNextRound');

class Game {
	constructor(computerPlays = false) {
		this.computerPlays = computerPlays;
		if (computerPlays) this.humanMark = 'X';
		this.scores = [0, 0];
		this.prepareGame();
	}

	/**
	 * Prepare variables needed for a game, e.g. logical interface of a game board.
	 */
	prepareGame() {
		this.grid = new Array(9).fill('');
		this.winningCombinations = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6],
		];
		this.actions = 0;
		this.previousPlayer = 'O';
		this.currentPlayer = 'X';
		this.playable = true;

		this.prepareGameDOM();
	}

	/**
	 * Prepare graphical interface of the game.
	 */
	prepareGameDOM() {
		this.gameTileElements = [];

		// Reset Game board DOM
		gameBoardEl.innerHTML = '';

		// Create game tiles
		for (let i = 1; i <= 9; i++) {
			const gameTileEl = document.createElement('div');
			const gameTileTextEl = document.createElement('p');
			gameTileEl.appendChild(gameTileTextEl);
			gameTileEl.classList.add('game-tile');
			gameTileEl.id = `box${i}`;
			gameBoardEl.appendChild(gameTileEl);
			this.gameTileElements.push(gameTileEl);
		}

		// DOM
		scoresEl.textContent = `${this.scores[0]}:${this.scores[1]}`;
		playerXBadgeEL.classList.add('active');
		playerOBadgeEL.classList.remove('active');
		btnNextRoundEl.classList.remove('active-btn');
	}

	placeMark(tileID, computerMove = false) {
		// Check if the game is still playable
		if (!this.playable) {
			return;
		}

		// Check if it's the computer's turn and the move is not forced
		if (this.computerPlays && this.currentPlayer !== this.humanMark && computerMove === false) {
			return;
		}

		const tile = document.getElementById(`box${tileID}`);

		// Check if the selected tile is already marked
		if (tile.firstChild.textContent !== '') {
			return;
		}

		// Place the mark on the logical and graphical interface of the game board
		this.grid[tileID - 1] = this.currentPlayer;
		this.actions++;
		tile.firstChild.textContent = this.currentPlayer;
		playerXBadgeEL.classList.toggle('active');
		playerOBadgeEL.classList.toggle('active');
		[this.currentPlayer, this.previousPlayer] = [this.previousPlayer, this.currentPlayer];

		// Resolve the game state after the move
		this.resolveGame();
		if (this.computerPlays && this.currentPlayer === 'O') {
			this.findCombinations(this.previousPlayer);
		}
	}

	/**
	 * Find combinations of the enemy and available combinations to decide the next move.
	 * @param {string} enemy - The symbol of the enemy player ('X' or 'O').
	 * @returns {number} - The tile ID to place the next mark.
	 */
	findCombinations(enemy) {
		const dangerCombinations = [];
		const availableCombinations = [];

		// Iterate over all winning combinations
		for (const combination of this.winningCombinations) {
			let enemyCounter = 0;
			// Check if the combination contains enemy marks, decide if the combination is a "danger"
			for (const i of combination) {
				if (this.grid[i] === enemy) {
					enemyCounter++;
					if (enemyCounter === 2) {
						dangerCombinations.push(combination);
						break;
					}
				}
			}

			// If no enemy marks are found in the combination, add it to available combinations
			if (enemyCounter === 0) {
				availableCombinations.push(combination);
			}
		}

		return this.determineNextMove(dangerCombinations, availableCombinations);
	}

	/**
	 * Decide the next move based on danger combinations and available combinations.
	 * @param {Array} dangerCombinations - Combinations where the enemy has two marks.
	 * @param {Array} availableCombinations - Combinations where no enemy marks are present.
	 * @returns {number} - The tile ID to place the next mark.
	 */
	determineNextMove(dangerCombinations, availableCombinations) {
		const toBlock = [];
		const toWin = {};

		// Decide which tiles are a great choice to block enemy from winning
		for (const combination of dangerCombinations) {
			for (const move of combination) {
				if (this.grid[move] === '' && !toBlock.includes(move)) {
					toBlock.push(move);
				}
			}
		}

		// If no danger combinations to block, search for moves which can bring a win
		if (toBlock.length === 0) {
			for (const combination of availableCombinations) {
				for (const move of combination) {
					if (this.grid[move] === '') {
						toWin[move] = (toWin[move] || 0) + 1;
					}
				}
			}

			let bestToWinValue = 0;
			let bestToWinTile = null;

			// Find the best tile to choose based on the highest occurrence in available combinations
			if (Object.keys(toWin).length > 0) {
				for (const [key, value] of Object.entries(toWin)) {
					if (value > bestToWinValue) {
						bestToWinValue = value;
						bestToWinTile = key;
					}
				}
			} else {
				// If no available tiles, choose the first empty tile in the grid
				for (let i = 0; i < this.grid.length; i++) {
					if (this.grid[i] === '') {
						bestToWinTile = i;
						break;
					}
				}
			}

			// If no best tile found, select the first available tile
			if (bestToWinTile === null) {
				bestToWinTile = Object.keys(toWin)[0];
			}

			return this.simulatePlaceMark(Number(bestToWinTile) + 1);
		} else {
			// If danger combinations exist, but it is possible to win in one move, just do it
			for (const combination of availableCombinations) {
				const emptyTiles = combination.filter((i) => this.grid[i] === '');
				if (emptyTiles.length === 1) {
					return this.simulatePlaceMark(Number(emptyTiles[0]) + 1);
				}
			}

			return this.simulatePlaceMark(Number(toBlock[0]) + 1);
		}
	}

	/**
	 * Simulate placing a mark on the game board after a certain delay (1000ms).
	 * @param {number} tileID - The ID of the tile to place the mark.
	 */
	simulatePlaceMark(tileID) {
		setTimeout(() => {
			this.placeMark(tileID, true);
		}, 1000);
	}

	/**
	 * Resolve the game state and check for a winner or a tie.
	 */
	resolveGame() {
		// Check if the maximum number of actions has been reached
		if (this.actions === 9) {
			this.playable = false;
			btnNextRoundEl.classList.add('active-btn');
		}

		// Check if there are enough actions for a potential win
		if (this.actions >= 5) {
			for (const combination of this.winningCombinations) {
				// Check if the current combination is a winning combination
				if (this.checkWinner(combination)) {
					this.playable = false;
					// Highlight the winning tiles on the game board
					combination.forEach((i) => {
						this.gameTileElements[i].classList.add('winner');
					});
					this.grid[combination[0]] === 'X' ? this.scores[0]++ : this.scores[1]++;
					scoresEl.textContent = `${this.scores[0]}:${this.scores[1]}`;
					btnNextRoundEl.classList.add('active-btn');
				}
			}
		}
	}

	/**
	 * Check if a combination of tiles results in a win.
	 * @param {Array} combination - The combination of tile indices to check.
	 * @returns {boolean} - True if the combination is a winning combination, false otherwise.
	 */
	checkWinner(combination) {
		const [x, y, z] = combination;
		return this.grid[x] !== '' && this.grid[x] === this.grid[y] && this.grid[y] === this.grid[z];
	}

	/**
	 * Only for DEV purposes! Print all data from App instance.
	 */
	_printData() {
		console.clear();
		Object.entries(this).forEach(([key, value]) => {
			console.log(`${key}: ${value}`);
		});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	document.body.classList.remove('hidden');
});

changeThemeEl.addEventListener('click', () => {
	lightModeIconEl.classList.toggle('hidden');
	darkModeIconEl.classList.toggle('hidden');

	const toggleDarkMode = !lightModeIconEl.classList.contains('hidden');

	if (toggleDarkMode) {
		console.log('Dark Theme');
	} else {
		console.log('Light Theme');
	}

	document.body.classList.toggle('body-dark', toggleDarkMode);
	changeThemeEl.classList.toggle('dark', toggleDarkMode);
	document.querySelectorAll('.player-badge').forEach((badge) => {
		badge.classList.toggle('dark', toggleDarkMode);
	});
	document.querySelector('h5').firstChild.classList.toggle('author-dark', toggleDarkMode);
	document.querySelectorAll('.btn').forEach((btn) => {
		btn.classList.toggle('dark', toggleDarkMode);
	});

	const CheckModeTiles = setInterval(() => {
		const gameTiles = document.querySelectorAll('.game-tile');
		if (gameTiles.length > 0) {
			gameTiles.forEach((tile) => {
				tile.classList.toggle('dark', toggleDarkMode);
			});
		}
		if (
			(toggleDarkMode && lightModeIconEl.classList.contains('hidden')) ||
			(!toggleDarkMode && !lightModeIconEl.classList.contains('hidden'))
		) {
			clearInterval(CheckModeTiles);
		}
	}, 100);
});

gameModesEls.forEach((el) => {
	el.addEventListener('click', (e) => {
		e.target.id === 'pvp-mode' ? (game = new Game(false)) : (game = new Game(true));
		gameMenuEl.classList.add('hidden');
		gameBoxEl.classList.remove('hidden');
	});
});

gameBoardEl.addEventListener('click', function (e) {
	if (e.target.matches('.game-tile') || e.target.matches('.game-tile p')) {
		const tileID = Number(e.target.closest('.game-tile').id.substr(3));
		game.placeMark(tileID);
	}
});

btnNewGameEl.addEventListener('click', () => {
	game = undefined;
	gameBoxEl.classList.add('hidden');
	gameMenuEl.classList.remove('hidden');
});

btnNextRoundEl.addEventListener('click', () => {
	game.prepareGame();
});
