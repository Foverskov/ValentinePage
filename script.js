(function () {
  const size = 3;
  const tileCount = size * size;

  const screenQuestion = document.getElementById("screen-question");
  const screenPuzzle = document.getElementById("screen-puzzle");
  const screenVideo = document.getElementById("screen-video");
  const screenGallery = document.getElementById("screen-gallery");

  const yesButton = document.getElementById("yes-button");
  const noButton = document.getElementById("no-button");
  const noFeedback = document.getElementById("no-feedback");

  const puzzleBoard = document.getElementById("puzzle-board");
  const puzzleStatus = document.getElementById("puzzle-status");
  const shuffleButton = document.getElementById("shuffle-button");
  const continueButton = document.getElementById("continue-button");
  const memoryVideo = document.getElementById("memory-video");
  const skipVideoButton = document.getElementById("skip-video-button");
  const toCardsButton = document.getElementById("to-cards-button");
  const restartButton = document.getElementById("restart-button");
  const gratitudeCards = document.getElementById("gratitude-cards");
  const gratitudeModal = document.getElementById("gratitude-modal");
  const modalImage = document.getElementById("modal-image");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalCloseButton = document.getElementById("modal-close-button");

  const dots = Array.from(document.querySelectorAll(".progress-dot"));
  let gratitudeContent = {};

  let pieces = [];
  let selected = null;
  let moves = 0;
  let lastFocusedCard = null;

  async function loadGratitudeContent() {
    try {
      const response = await fetch("gratitude-content.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load gratitude-content.json (${response.status})`);
      }

      const data = await response.json();
      gratitudeContent = data || {};
      renderGratitudeCards();
    } catch (error) {
      console.error(error);
      gratitudeCards.innerHTML = '<p class="hint">Kunne ikke hente kortdata lige nu.</p>';
    }
  }

  function renderGratitudeCards() {
    gratitudeCards.innerHTML = "";
    Object.entries(gratitudeContent).forEach(([key, content]) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gratitude-card";
      card.dataset.gratitude = key;
      card.textContent = content.cardLabel || content.title || key;
      gratitudeCards.appendChild(card);
    });
  }

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
      video: screenVideo,
      gallery: screenGallery
    };

    Object.values(screenMap).forEach((screen) => {
      screen.classList.remove("is-active");
    });
    screenMap[screenId].classList.add("is-active");

    if (screenId === "question") setProgress(0);
    if (screenId === "puzzle") setProgress(1);
    if (screenId === "video") setProgress(2);
    if (screenId === "gallery") setProgress(3);
  }

  function openModal(contentKey, sourceElement) {
    const content = gratitudeContent[contentKey];
    if (!content) return;

    lastFocusedCard = sourceElement || null;
    modalTitle.textContent = content.title;
    modalBody.textContent = content.text;
    if (content.imageSrc) {
      modalImage.src = content.imageSrc;
      modalImage.alt = content.imageAlt || content.title || "";
      modalImage.hidden = false;
    } else {
      modalImage.removeAttribute("src");
      modalImage.alt = "";
      modalImage.hidden = true;
    }
    gratitudeModal.hidden = false;
    document.body.classList.add("modal-open");
    modalCloseButton.focus();
  }

  function closeModal() {
    gratitudeModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocusedCard) {
      lastFocusedCard.focus();
    }
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
    puzzleStatus.textContent = "";
    renderBoard();
  }

  function handleBoardTap(event) {
    const tile = event.target.closest(".puzzle-tile");
    if (!tile) return;

    const tileIndex = Number(tile.dataset.index);

    if (selected === null) {
      selected = tileIndex;
      puzzleStatus.dataset.state = "idle";
      puzzleStatus.textContent = "Brik valgt. Tryk på en anden brik for at bytte.";
      renderBoard();
      return;
    }

    if (selected === tileIndex) {
      selected = null;
      puzzleStatus.dataset.state = "idle";
      puzzleStatus.textContent = "Valg ryddet. Tryk på en brik for at vælge igen.";
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
      puzzleStatus.textContent = `Puslespil løst på ${moves} træk. Fortsæt er nu låst op.`;
      return;
    }

    puzzleStatus.dataset.state = "idle";
    puzzleStatus.textContent = `${moves} træk lavet. Bliv ved!`;
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
    showScreen("video");
    memoryVideo.currentTime = 0;
    memoryVideo.play().catch(() => {});
  });

  skipVideoButton.addEventListener("click", () => {
    memoryVideo.pause();
    showScreen("gallery");
  });

  toCardsButton.addEventListener("click", () => {
    memoryVideo.pause();
    showScreen("gallery");
  });

  memoryVideo.addEventListener("ended", () => {
    showScreen("gallery");
  });

  restartButton.addEventListener("click", () => {
    if (!gratitudeModal.hidden) {
      closeModal();
    }
    memoryVideo.pause();
    memoryVideo.currentTime = 0;
    showScreen("question");
    noFeedback.hidden = true;
  });

  puzzleBoard.addEventListener("click", handleBoardTap);
  gratitudeCards.addEventListener("click", (event) => {
    const card = event.target.closest("[data-gratitude]");
    if (!card) return;
    openModal(card.dataset.gratitude, card);
  });

  gratitudeModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) closeModal();
  });
  modalCloseButton.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !gratitudeModal.hidden) {
      closeModal();
    }
  });

  loadGratitudeContent();
  showScreen("question");
})();
