(function () {
  const size = 3;
  const tileCount = size * size;

  const screenQuestion = document.getElementById("screen-question");
  const screenPuzzle = document.getElementById("screen-puzzle");
  const screenGallery = document.getElementById("screen-gallery");

  const yesButton = document.getElementById("yes-button");
  const noButton = document.getElementById("no-button");
  const noFeedback = document.getElementById("no-feedback");

  const puzzleBoard = document.getElementById("puzzle-board");
  const puzzleStatus = document.getElementById("puzzle-status");
  const shuffleButton = document.getElementById("shuffle-button");
  const continueButton = document.getElementById("continue-button");
  const restartButton = document.getElementById("restart-button");

  const dots = Array.from(document.querySelectorAll(".progress-dot"));

  let pieces = [];
  let selected = null;
  let moves = 0;

  function createSortedPieces() {
    return Array.from({ length: tileCount }, (_, index) => index);
  }

  function isSolved(order) {
    return order.every((piece, index) => piece === index);
  }

  function shufflePieces() {
    const shuffled = createSortedPieces();

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    // Keep shuffling until the board starts unsolved.
    if (isSolved(shuffled)) {
      return shufflePieces();
    }

    return shuffled;
  }

  function swapPositions(first, second) {
    [pieces[first], pieces[second]] = [pieces[second], pieces[first]];
  }

  function setProgress(step) {
    dots.forEach((dot, index) => {
      dot.classList.toggle("progress-dot--active", index === step);
    });
  }

  function showScreen(screenId) {
    const screenMap = {
      question: screenQuestion,
      puzzle: screenPuzzle,
      gallery: screenGallery
    };

    Object.values(screenMap).forEach((screen) => {
      screen.classList.remove("is-active");
    });
    screenMap[screenId].classList.add("is-active");

    if (screenId === "question") setProgress(0);
    if (screenId === "puzzle") setProgress(1);
    if (screenId === "gallery") setProgress(2);
  }

  function renderBoard() {
    puzzleBoard.innerHTML = "";

    pieces.forEach((pieceNumber, boardIndex) => {
      const tile = document.createElement("button");
      const row = Math.floor(pieceNumber / size);
      const col = pieceNumber % size;

      tile.type = "button";
      tile.className = "puzzle-tile";
      tile.dataset.index = String(boardIndex);
      tile.setAttribute("aria-label", `Tile ${pieceNumber + 1}`);
      tile.style.backgroundPosition = `${(col / (size - 1)) * 100}% ${(row / (size - 1)) * 100}%`;

      if (selected === boardIndex) {
        tile.classList.add("is-selected");
      }

      puzzleBoard.appendChild(tile);
    });
  }

  function resetPuzzle() {
    pieces = shufflePieces();
    selected = null;
    moves = 0;
    continueButton.disabled = true;
    puzzleBoard.classList.remove("is-solved");
    puzzleStatus.dataset.state = "idle";
    puzzleStatus.textContent = "Tap one tile, then tap another tile to swap.";
    renderBoard();
  }

  function handleBoardTap(event) {
    const tile = event.target.closest(".puzzle-tile");
    if (!tile) return;

    const tileIndex = Number(tile.dataset.index);

    if (selected === null) {
      selected = tileIndex;
      puzzleStatus.dataset.state = "idle";
      puzzleStatus.textContent = "Tile selected. Tap another tile to swap.";
      renderBoard();
      return;
    }

    if (selected === tileIndex) {
      selected = null;
      puzzleStatus.dataset.state = "idle";
      puzzleStatus.textContent = "Selection cleared. Tap one tile to choose again.";
      renderBoard();
      return;
    }

    swapPositions(selected, tileIndex);
    selected = null;
    moves += 1;
    renderBoard();

    if (isSolved(pieces)) {
      continueButton.disabled = false;
      puzzleBoard.classList.add("is-solved");
      puzzleStatus.dataset.state = "done";
      puzzleStatus.textContent = `Puzzle solved in ${moves} move${moves === 1 ? "" : "s"}. Continue unlocked.`;
      return;
    }

    puzzleStatus.dataset.state = "idle";
    puzzleStatus.textContent = `${moves} move${moves === 1 ? "" : "s"} made. Keep going.`;
  }

  yesButton.addEventListener("click", () => {
    noFeedback.hidden = true;
    showScreen("puzzle");
    resetPuzzle();
  });

  noButton.addEventListener("click", () => {
    noFeedback.hidden = false;
  });

  shuffleButton.addEventListener("click", () => {
    resetPuzzle();
  });

  continueButton.addEventListener("click", () => {
    showScreen("gallery");
  });

  restartButton.addEventListener("click", () => {
    showScreen("question");
    noFeedback.hidden = true;
  });

  puzzleBoard.addEventListener("click", handleBoardTap);

  showScreen("question");
})();
