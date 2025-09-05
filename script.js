const db = firebase.database();
const boardRef = db.ref("game1"); // You can change this path to support multiple games

let initialBoard = [
  ['♜','♞','♝','♛','♚','♝','♞','♜'],
  ['♟','♟','♟','♟','♟','♟','♟','♟'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['♙','♙','♙','♙','♙','♙','♙','♙'],
  ['♖','♘','♗','♕','♔','♗','♘','♖']
];

let selected = null;
let playerColor = null;
let currentTurn = 'white';

function getClientId() {
  if (!localStorage.getItem('chess_id')) {
    localStorage.setItem('chess_id', Math.random().toString(36).substring(2));
  }
  return localStorage.getItem('chess_id');
}

function isWhite(piece) {
  return ['♙','♖','♘','♗','♕','♔'].includes(piece);
}
function isBlack(piece) {
  return ['♟','♜','♞','♝','♛','♚'].includes(piece);
}

function createBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.textContent = initialBoard[row][col];
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener('click', handleClick);
      boardEl.appendChild(square);
    }
  }
  document.getElementById('status').textContent = `You are playing as: ${playerColor}, Turn: ${currentTurn}`;
}

function handleClick(e) {
  if (currentTurn !== playerColor) return alert("Not your turn!");

  const row = +e.target.dataset.row;
  const col = +e.target.dataset.col;
  const piece = initialBoard[row][col];

  if (selected) {
    const [prevRow, prevCol] = selected;
    const movingPiece = initialBoard[prevRow][prevCol];

    if ((playerColor === 'white' && isWhite(movingPiece)) || (playerColor === 'black' && isBlack(movingPiece))) {
      if (isValidMove(movingPiece, prevRow, prevCol, row, col)) {
        initialBoard[row][col] = movingPiece;
        initialBoard[prevRow][prevCol] = '';
        selected = null;

        boardRef.set({
          board: initialBoard,
          turn: playerColor === 'white' ? 'black' : 'white',
          players: {
            white: getClientId(),
            black: playerColor === 'white' ? null : getClientId()
          }
        });

        return;
      }
    }

    selected = null;
    createBoard();
  } else {
    if ((playerColor === 'white' && isWhite(piece)) || (playerColor === 'black' && isBlack(piece))) {
      selected = [row, col];
      e.target.classList.add('highlight');
    }
  }
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
  // Simplified move check for demo (you can use full move validation here)
  if (initialBoard[toRow][toCol] === '') return true;
  if (playerColor === 'white' && isBlack(initialBoard[toRow][toCol])) return true;
  if (playerColor === 'black' && isWhite(initialBoard[toRow][toCol])) return true;
  return false;
}

// Sync with Firebase
boardRef.on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  initialBoard = data.board;
  currentTurn = data.turn;
  createBoard();

  const players = data.players || {};
  const id = getClientId();
  if (!playerColor) {
    if (!players.white || players.white === id) {
      playerColor = 'white';
      boardRef.child("players/white").set(id);
    } else {
      playerColor = 'black';
      boardRef.child("players/black").set(id);
    }
  }
});

// Initialize board if empty
boardRef.once("value").then(snapshot => {
  if (!snapshot.exists()) {
    boardRef.set({
      board: initialBoard,
      turn: 'white',
      players: { white: getClientId() }
    });
  }
});



