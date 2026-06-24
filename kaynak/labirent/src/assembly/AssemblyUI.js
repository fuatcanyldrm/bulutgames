import {
  createPuzzleAssets,
  getPieceLayout,
} from './PuzzleImage.js';

const SNAP_THRESHOLD = 28;
const INVENTORY_PIECE_SIZE = 52;

export class AssemblyUI {
  constructor(elements, gameState, callbacks) {
    this.screen = elements.screen;
    this.title = elements.title;
    this.boardWrap = elements.boardWrap;
    this.board = elements.board;
    this.inventory = elements.inventory;
    this.status = elements.status;
    this.backBtn = elements.backBtn;
    this.gameState = gameState;
    this.onBackToMaze = callbacks.onBackToMaze;
    this.onWin = callbacks.onWin;
    this.pieceUrls = [];
    this.fullUrl = '';
    this.pieces = [];
    this.layout = [];
    this.levelConfig = null;
    this._onResize = () => {
      if (this.screen.classList.contains('visible')) this.render();
    };

    this.backBtn.addEventListener('click', () => this.onBackToMaze());
    window.addEventListener('resize', this._onResize);
  }

  show() {
    this.gameState.sanitizePieces();
    this.levelConfig = this.gameState.getLevelConfig();
    const assets = createPuzzleAssets(this.levelConfig);
    this.fullUrl = assets.fullUrl;
    this.pieceUrls = assets.pieceUrls;
    this.title.textContent = `Seviye ${this.levelConfig.level} — ${this.levelConfig.title}`;
    this.screen.classList.remove('hidden');
    this.screen.classList.add('visible');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.render());
    });
  }

  hide() {
    this.screen.classList.remove('visible');
    this.screen.classList.add('hidden');
  }

  computeBoardSize(cols, rows) {
    const panel = this.screen.querySelector('.panel');
    const panelW = panel?.clientWidth ?? window.innerWidth * 0.92;
    const wrapW = this.boardWrap.clientWidth || panelW - 48;
    const maxW = Math.min(wrapW, panelW - 32, window.innerWidth * 0.92);

    const inventoryRows = Math.ceil(this.gameState.collectedPieces.size / Math.max(1, Math.floor(maxW / 56))) || 1;
    const inventoryH = Math.min(140, 56 + inventoryRows * 44);
    const chromeH = 220 + inventoryH;
    const maxH = Math.max(160, window.innerHeight * 0.88 - chromeH);

    const aspect = cols / rows;
    let boardW = maxW;
    let boardH = boardW / aspect;

    if (boardH > maxH) {
      boardH = maxH;
      boardW = boardH * aspect;
    }

    return {
      boardW: Math.floor(Math.max(200, boardW)),
      boardH: Math.floor(Math.max(120, boardH)),
    };
  }

  getInventoryPieceSize(pieceCount) {
    if (pieceCount > 100) return 36;
    if (pieceCount > 50) return 42;
    if (pieceCount > 25) return 46;
    return INVENTORY_PIECE_SIZE;
  }

  render() {
    if (!this.levelConfig) return;

    const { cols, rows, pieces } = this.levelConfig;
    this.board.innerHTML = '';
    this.inventory.innerHTML = '';
    this.pieces = [];

    const { boardW, boardH } = this.computeBoardSize(cols, rows);
    const inventorySize = this.getInventoryPieceSize(pieces);

    this.board.style.width = `${boardW}px`;
    this.board.style.height = `${boardH}px`;
    this.board.style.backgroundImage = `url(${this.fullUrl})`;
    this.board.style.backgroundSize = 'cover';
    this.board.style.backgroundPosition = 'center';
    this.boardWrap.style.height = `${boardH}px`;
    this.boardWrap.style.minHeight = '';
    this.boardWrap.style.maxHeight = '';

    this.layout = getPieceLayout(boardW, boardH, cols, rows, pieces);
    const snap = Math.max(
      8,
      Math.min(SNAP_THRESHOLD, (this.layout[0]?.width ?? 40) * 0.45),
    );

    for (const slot of this.layout) {
      const ghost = this.createImg(slot, this.pieceUrls[slot.id], 'puzzle-slot ghost');
      ghost.style.left = `${slot.slotX}px`;
      ghost.style.top = `${slot.slotY}px`;
      ghost.style.width = `${slot.width}px`;
      ghost.style.height = `${slot.height}px`;
      this.board.appendChild(ghost);

      if (this.gameState.isPiecePlaced(slot.id)) {
        const locked = this.createImg(slot, this.pieceUrls[slot.id], 'puzzle-piece locked');
        locked.style.left = `${slot.slotX}px`;
        locked.style.top = `${slot.slotY}px`;
        locked.style.width = `${slot.width}px`;
        locked.style.height = `${slot.height}px`;
        this.board.appendChild(locked);
        continue;
      }

      if (this.gameState.isPieceCollected(slot.id)) {
        const piece = this.createImg(
          slot,
          this.pieceUrls[slot.id],
          'puzzle-piece inventory-piece',
        );
        piece.style.width = `${inventorySize}px`;
        piece.style.height = `${inventorySize}px`;
        this.inventory.appendChild(piece);
        this.enableDrag(piece, slot, snap);
        this.pieces.push({ el: piece, slot, snap });
      }
    }

    this.updateStatus();
  }

  createImg(slot, src, className) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Parça ${slot.id + 1}`;
    img.className = className;
    img.draggable = false;
    return img;
  }

  enableDrag(piece, slot, snap) {
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    const onPointerDown = (e) => {
      e.preventDefault();
      const inInventory = piece.parentElement === this.inventory;

      if (inInventory) {
        this.board.appendChild(piece);
        piece.classList.remove('inventory-piece');
        piece.style.position = 'absolute';
        piece.style.width = `${slot.width}px`;
        piece.style.height = `${slot.height}px`;
        const boardRect = this.board.getBoundingClientRect();
        piece.style.left = `${e.clientX - boardRect.left - slot.width / 2}px`;
        piece.style.top = `${e.clientY - boardRect.top - slot.height / 2}px`;
      }

      piece.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(piece.style.left) || 0;
      origTop = parseFloat(piece.style.top) || 0;
      piece.style.zIndex = '20';
    };

    const onPointerMove = (e) => {
      if (!piece.hasPointerCapture(e.pointerId)) return;
      piece.style.left = `${origLeft + e.clientX - startX}px`;
      piece.style.top = `${origTop + e.clientY - startY}px`;
    };

    const onPointerUp = (e) => {
      if (!piece.hasPointerCapture(e.pointerId)) return;
      piece.releasePointerCapture(e.pointerId);
      piece.style.zIndex = '10';
      this.trySnap(piece, slot, snap);
    };

    piece.addEventListener('pointerdown', onPointerDown);
    piece.addEventListener('pointermove', onPointerMove);
    piece.addEventListener('pointerup', onPointerUp);
    piece.addEventListener('pointercancel', onPointerUp);
  }

  trySnap(piece, slot, snap) {
    const boardRect = this.board.getBoundingClientRect();
    const pieceRect = piece.getBoundingClientRect();
    const targetLeft = boardRect.left + slot.slotX;
    const targetTop = boardRect.top + slot.slotY;
    const dist = Math.hypot(pieceRect.left - targetLeft, pieceRect.top - targetTop);

    if (dist < snap) {
      piece.style.left = `${slot.slotX}px`;
      piece.style.top = `${slot.slotY}px`;
      piece.style.width = `${slot.width}px`;
      piece.style.height = `${slot.height}px`;
      piece.classList.add('locked');
      piece.classList.remove('inventory-piece');
      this.gameState.placePiece(slot.id);
      this.updateStatus();

      if (this.gameState.isPuzzleComplete()) {
        setTimeout(() => this.onWin(), 600);
      }
    } else if (piece.parentElement === this.board) {
      this.returnToInventory(piece);
    }
  }

  returnToInventory(piece) {
    const inventorySize = this.getInventoryPieceSize(this.levelConfig.pieces);
    this.inventory.appendChild(piece);
    piece.classList.add('inventory-piece');
    piece.classList.remove('locked');
    piece.style.position = '';
    piece.style.left = '';
    piece.style.top = '';
    piece.style.width = `${inventorySize}px`;
    piece.style.height = `${inventorySize}px`;
  }

  updateStatus() {
    const total = this.levelConfig.pieces;
    const collected = this.gameState.collectedPieces.size;
    const placed = this.gameState.placedPieces.size;
    this.status.textContent =
      `${placed}/${total} parça yerleştirildi · ${collected} parça toplandı`;
  }
}
