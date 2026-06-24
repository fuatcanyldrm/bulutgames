import { getLevelConfig } from './levels.js';

const STORAGE_KEY = 'maze-puzzle-state';

export const STATES = {
  MAZE: 'MAZE',
  ASSEMBLY: 'ASSEMBLY',
  RIDDLE: 'RIDDLE',
  STORY: 'STORY',
  WIN: 'WIN',
  GAME_OVER: 'GAME_OVER',
};

export class GameState {
  constructor() {
    this.state = STATES.MAZE;
    this.level = 1;
    this.collectedPieces = new Set();
    this.placedPieces = new Set();
    this.riddleAttempts = 0;
    this.listeners = new Set();
    this.load();
  }

  getLevelConfig() {
    return getLevelConfig(this.level);
  }

  getPieceCount() {
    return this.getLevelConfig().pieces;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.save();
    for (const fn of this.listeners) fn(this);
  }

  collectPiece(id) {
    const max = this.getPieceCount();
    if (id < 0 || id >= max) return false;
    const before = this.collectedPieces.size;
    this.collectedPieces.add(id);
    if (this.collectedPieces.size !== before) this.notify();
    return true;
  }

  placePiece(id) {
    if (!this.collectedPieces.has(id)) return false;
    const before = this.placedPieces.size;
    this.placedPieces.add(id);
    if (this.placedPieces.size !== before) this.notify();
    return true;
  }

  isPieceCollected(id) {
    return this.collectedPieces.has(id);
  }

  isPiecePlaced(id) {
    return this.placedPieces.has(id);
  }

  isPuzzleComplete() {
    return this.placedPieces.size === this.getPieceCount();
  }

  setState(state) {
    this.state = state;
    this.notify();
  }

  resetRiddleAttempts() {
    this.riddleAttempts = 0;
    this.notify();
  }

  incrementRiddleAttempt() {
    this.riddleAttempts += 1;
    this.notify();
    return this.riddleAttempts;
  }

  getRiddleAttemptsLeft() {
    return Math.max(0, 3 - this.riddleAttempts);
  }

  advanceLevel() {
    if (this.level >= 5) return;
    this.level += 1;
    this.resetPieces();
    this.riddleAttempts = 0;
    this.state = STATES.MAZE;
    this.notify();
  }

  resetPieces() {
    this.collectedPieces = new Set();
    this.placedPieces = new Set();
  }

  sanitizePieces() {
    const max = this.getPieceCount();
    this.collectedPieces = new Set(
      [...this.collectedPieces].filter((id) => id >= 0 && id < max),
    );
    this.placedPieces = new Set(
      [...this.placedPieces].filter((id) => id >= 0 && id < max),
    );
  }

  onPuzzleComplete() {
    this.resetPieces();
    this.setState(STATES.STORY);
  }

  reset() {
    this.state = STATES.MAZE;
    this.level = 1;
    this.collectedPieces = new Set();
    this.placedPieces = new Set();
    this.riddleAttempts = 0;
    sessionStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  save() {
    const data = {
      state: this.state,
      level: this.level,
      collectedPieces: [...this.collectedPieces],
      placedPieces: [...this.placedPieces],
      riddleAttempts: this.riddleAttempts,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.state = data.state ?? STATES.MAZE;
      this.level = data.level ?? 1;
      this.collectedPieces = new Set(data.collectedPieces ?? []);
      this.placedPieces = new Set(data.placedPieces ?? []);
      this.riddleAttempts = data.riddleAttempts ?? 0;
      if (this.level < 1 || this.level > 5) this.level = 1;
      this.sanitizePieces();
    } catch {
      this.reset();
    }
  }
}
