const PIECE_UNICODE = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
};

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const newGameBtn = document.getElementById("new-game");
const flipBoardBtn = document.getElementById("flip-board");

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const initialState = () => ({
  board: [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
  ],
  turn: "w",
  selected: null,
  legalTargets: [],
  orientation: "w",
  gameOver: false,
  result: null,
  enPassant: null,
  castling: {
    wK: true,
    wQ: true,
    bK: true,
    bQ: true,
  },
});

let state = initialState();

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function otherColor(color) {
  return color === "w" ? "b" : "w";
}

function cloneState(s) {
  return {
    ...s,
    board: s.board.map((row) => [...row]),
    castling: { ...s.castling },
    enPassant: s.enPassant ? { ...s.enPassant } : null,
    legalTargets: [],
    selected: null,
    result: s.result,
  };
}

function squareName(r, c) {
  return `${FILES[c]}${8 - r}`;
}

function locateKing(board, color) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (board[r][c] === `${color}k`) {
        return { r, c };
      }
    }
  }
  return null;
}

function isSquareAttacked(board, targetR, targetC, byColor) {
  const pawnDir = byColor === "w" ? -1 : 1;
  const pawnRow = targetR - pawnDir;
  for (const dc of [-1, 1]) {
    const c = targetC + dc;
    if (inBounds(pawnRow, c) && board[pawnRow][c] === `${byColor}p`) {
      return true;
    }
  }

  const knightSteps = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [dr, dc] of knightSteps) {
    const r = targetR + dr;
    const c = targetC + dc;
    if (inBounds(r, c) && board[r][c] === `${byColor}n`) {
      return true;
    }
  }

  const rookDirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of rookDirs) {
    let r = targetR + dr;
    let c = targetC + dc;
    while (inBounds(r, c)) {
      const piece = board[r][c];
      if (piece) {
        if (piece[0] === byColor && (piece[1] === "r" || piece[1] === "q")) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  const bishopDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [dr, dc] of bishopDirs) {
    let r = targetR + dr;
    let c = targetC + dc;
    while (inBounds(r, c)) {
      const piece = board[r][c];
      if (piece) {
        if (piece[0] === byColor && (piece[1] === "b" || piece[1] === "q")) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = targetR + dr;
      const c = targetC + dc;
      if (inBounds(r, c) && board[r][c] === `${byColor}k`) {
        return true;
      }
    }
  }

  return false;
}

function inCheck(board, color) {
  const king = locateKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king.r, king.c, otherColor(color));
}

function pseudoMoves(game, r, c, includeCastling = true) {
  const piece = game.board[r][c];
  if (!piece) return [];
  const color = piece[0];
  const kind = piece[1];
  const moves = [];

  if (kind === "p") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const oneStep = r + dir;

    if (inBounds(oneStep, c) && !game.board[oneStep][c]) {
      moves.push({ from: { r, c }, to: { r: oneStep, c }, special: null });

      const twoStep = r + dir * 2;
      if (r === startRow && !game.board[twoStep][c]) {
        moves.push({
          from: { r, c },
          to: { r: twoStep, c },
          special: "doublePawn",
        });
      }
    }

    for (const dc of [-1, 1]) {
      const tr = r + dir;
      const tc = c + dc;
      if (!inBounds(tr, tc)) continue;
      const target = game.board[tr][tc];
      if (target && target[0] !== color) {
        moves.push({ from: { r, c }, to: { r: tr, c: tc }, special: null });
      }

      if (
        game.enPassant &&
        game.enPassant.r === tr &&
        game.enPassant.c === tc &&
        game.enPassant.color !== color
      ) {
        moves.push({
          from: { r, c },
          to: { r: tr, c: tc },
          special: "enPassant",
        });
      }
    }
  }

  if (kind === "n") {
    const jumps = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    for (const [dr, dc] of jumps) {
      const tr = r + dr;
      const tc = c + dc;
      if (!inBounds(tr, tc)) continue;
      const target = game.board[tr][tc];
      if (!target || target[0] !== color) {
        moves.push({ from: { r, c }, to: { r: tr, c: tc }, special: null });
      }
    }
  }

  if (kind === "b" || kind === "r" || kind === "q") {
    const dirs = [];
    if (kind === "b" || kind === "q") {
      dirs.push(
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      );
    }
    if (kind === "r" || kind === "q") {
      dirs.push(
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      );
    }
    for (const [dr, dc] of dirs) {
      let tr = r + dr;
      let tc = c + dc;
      while (inBounds(tr, tc)) {
        const target = game.board[tr][tc];
        if (!target) {
          moves.push({ from: { r, c }, to: { r: tr, c: tc }, special: null });
        } else {
          if (target[0] !== color) {
            moves.push({ from: { r, c }, to: { r: tr, c: tc }, special: null });
          }
          break;
        }
        tr += dr;
        tc += dc;
      }
    }
  }

  if (kind === "k") {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const tr = r + dr;
        const tc = c + dc;
        if (!inBounds(tr, tc)) continue;
        const target = game.board[tr][tc];
        if (!target || target[0] !== color) {
          moves.push({ from: { r, c }, to: { r: tr, c: tc }, special: null });
        }
      }
    }

    if (includeCastling) {
      const enemy = otherColor(color);
      const row = color === "w" ? 7 : 0;
      if (
        r === row &&
        c === 4 &&
        !inCheck(game.board, color) &&
        game.board[row][4] === `${color}k`
      ) {
        const kSide = color === "w" ? game.castling.wK : game.castling.bK;
        if (
          kSide &&
          !game.board[row][5] &&
          !game.board[row][6] &&
          game.board[row][7] === `${color}r` &&
          !isSquareAttacked(game.board, row, 5, enemy) &&
          !isSquareAttacked(game.board, row, 6, enemy)
        ) {
          moves.push({
            from: { r, c },
            to: { r: row, c: 6 },
            special: "castleKing",
          });
        }

        const qSide = color === "w" ? game.castling.wQ : game.castling.bQ;
        if (
          qSide &&
          !game.board[row][1] &&
          !game.board[row][2] &&
          !game.board[row][3] &&
          game.board[row][0] === `${color}r` &&
          !isSquareAttacked(game.board, row, 3, enemy) &&
          !isSquareAttacked(game.board, row, 2, enemy)
        ) {
          moves.push({
            from: { r, c },
            to: { r: row, c: 2 },
            special: "castleQueen",
          });
        }
      }
    }
  }

  return moves;
}

function applyMove(game, move) {
  const next = cloneState(game);
  const piece = next.board[move.from.r][move.from.c];
  const color = piece[0];

  next.board[move.from.r][move.from.c] = null;

  if (move.special === "enPassant") {
    const captureRow = color === "w" ? move.to.r + 1 : move.to.r - 1;
    next.board[captureRow][move.to.c] = null;
  }

  if (move.special === "castleKing") {
    next.board[move.to.r][move.to.c] = piece;
    next.board[move.to.r][5] = next.board[move.to.r][7];
    next.board[move.to.r][7] = null;
  } else if (move.special === "castleQueen") {
    next.board[move.to.r][move.to.c] = piece;
    next.board[move.to.r][3] = next.board[move.to.r][0];
    next.board[move.to.r][0] = null;
  } else {
    next.board[move.to.r][move.to.c] = piece;
  }

  const movedKind = piece[1];
  if (movedKind === "p" && (move.to.r === 0 || move.to.r === 7)) {
    next.board[move.to.r][move.to.c] = `${color}q`;
  }

  next.enPassant = null;
  if (move.special === "doublePawn") {
    next.enPassant = {
      r: (move.from.r + move.to.r) / 2,
      c: move.from.c,
      color,
    };
  }

  if (piece === "wk") {
    next.castling.wK = false;
    next.castling.wQ = false;
  }
  if (piece === "bk") {
    next.castling.bK = false;
    next.castling.bQ = false;
  }
  if (piece === "wr" && move.from.r === 7 && move.from.c === 0) next.castling.wQ = false;
  if (piece === "wr" && move.from.r === 7 && move.from.c === 7) next.castling.wK = false;
  if (piece === "br" && move.from.r === 0 && move.from.c === 0) next.castling.bQ = false;
  if (piece === "br" && move.from.r === 0 && move.from.c === 7) next.castling.bK = false;

  const captured = game.board[move.to.r][move.to.c];
  if (captured === "wr" && move.to.r === 7 && move.to.c === 0) next.castling.wQ = false;
  if (captured === "wr" && move.to.r === 7 && move.to.c === 7) next.castling.wK = false;
  if (captured === "br" && move.to.r === 0 && move.to.c === 0) next.castling.bQ = false;
  if (captured === "br" && move.to.r === 0 && move.to.c === 7) next.castling.bK = false;

  next.turn = otherColor(game.turn);
  return next;
}

function legalMovesForSquare(game, r, c) {
  const piece = game.board[r][c];
  if (!piece || piece[0] !== game.turn) return [];

  const candidates = pseudoMoves(game, r, c, true);
  return candidates.filter((move) => {
    const tested = applyMove(game, move);
    return !inCheck(tested.board, game.turn);
  });
}

function allLegalMoves(game, color) {
  const moves = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = game.board[r][c];
      if (p && p[0] === color) {
        const local = legalMovesForSquare({ ...game, turn: color }, r, c);
        moves.push(...local);
      }
    }
  }
  return moves;
}

function statusText(game) {
  if (game.gameOver) return game.result;
  const side = game.turn === "w" ? "White" : "Black";
  if (inCheck(game.board, game.turn)) {
    return `${side} to move (Check)`;
  }
  return `${side} to move`;
}

function finalizeGameState(game) {
  const moves = allLegalMoves(game, game.turn);
  const checked = inCheck(game.board, game.turn);
  if (moves.length === 0) {
    game.gameOver = true;
    if (checked) {
      const winner = game.turn === "w" ? "Black" : "White";
      game.result = `Checkmate. ${winner} wins.`;
    } else {
      game.result = "Stalemate. Draw.";
    }
  } else {
    game.gameOver = false;
    game.result = null;
  }
}

function squareClass(r, c) {
  return (r + c) % 2 === 0 ? "light" : "dark";
}

function orientedCoords() {
  const rows = [...Array(8).keys()];
  const cols = [...Array(8).keys()];
  if (state.orientation === "w") {
    return { rows, cols };
  }
  return { rows: rows.reverse(), cols: cols.reverse() };
}

function isTarget(r, c) {
  return state.legalTargets.some((m) => m.to.r === r && m.to.c === c);
}

function isCaptureTarget(r, c) {
  const targetMove = state.legalTargets.find((m) => m.to.r === r && m.to.c === c);
  if (!targetMove) return false;

  if (targetMove.special === "enPassant") return true;
  const selectedPiece = state.selected ? state.board[state.selected.r][state.selected.c] : null;
  const targetPiece = state.board[r][c];
  return Boolean(selectedPiece && targetPiece && selectedPiece[0] !== targetPiece[0]);
}

function render() {
  boardEl.innerHTML = "";

  const { rows, cols } = orientedCoords();
  const checkedKing = inCheck(state.board, state.turn) ? locateKing(state.board, state.turn) : null;

  for (const r of rows) {
    for (const c of cols) {
      const sq = document.createElement("button");
      sq.type = "button";
      sq.className = `square ${squareClass(r, c)}`;
      sq.dataset.r = String(r);
      sq.dataset.c = String(c);

      if (state.selected && state.selected.r === r && state.selected.c === c) {
        sq.classList.add("selected");
      }
      if (isTarget(r, c)) {
        sq.classList.add(isCaptureTarget(r, c) ? "capture" : "move");
      }
      if (checkedKing && checkedKing.r === r && checkedKing.c === c) {
        sq.classList.add("in-check");
      }

      const piece = state.board[r][c];
      sq.textContent = piece ? PIECE_UNICODE[piece] : "";

      if ((r === 7 && state.orientation === "w") || (r === 0 && state.orientation === "b")) {
        const coord = document.createElement("span");
        coord.className = "coord";
        coord.textContent = FILES[c];
        sq.appendChild(coord);
      }

      sq.addEventListener("click", onSquareClick);
      boardEl.appendChild(sq);
    }
  }

  statusEl.textContent = statusText(state);
}

function clearSelection() {
  state.selected = null;
  state.legalTargets = [];
}

function onSquareClick(e) {
  if (state.gameOver) return;

  const r = Number(e.currentTarget.dataset.r);
  const c = Number(e.currentTarget.dataset.c);
  const piece = state.board[r][c];

  if (state.selected) {
    const chosen = state.legalTargets.find((m) => m.to.r === r && m.to.c === c);
    if (chosen) {
      state = applyMove(state, chosen);
      clearSelection();
      finalizeGameState(state);
      render();
      return;
    }
  }

  if (piece && piece[0] === state.turn) {
    state.selected = { r, c };
    state.legalTargets = legalMovesForSquare(state, r, c);
  } else {
    clearSelection();
  }

  render();
}

newGameBtn.addEventListener("click", () => {
  const orientation = state.orientation;
  state = initialState();
  state.orientation = orientation;
  render();
});

flipBoardBtn.addEventListener("click", () => {
  state.orientation = state.orientation === "w" ? "b" : "w";
  render();
});

render();
