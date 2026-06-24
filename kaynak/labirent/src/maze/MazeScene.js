import {
  generateMaze,
  isWalkable,
  pickPieceLocations,
  findEntrances,
} from './MazeGenerator.js';

const MOVE_SPEED = 12;
const PLAYER_RADIUS = 0.32;

const COLORS = {
  background: '#b8d4e8',
  floor: '#f5ecd7',
  floorAlt: '#ebe0c8',
  wall: '#5c4a7a',
  wallEdge: '#3d2f55',
  player: '#2e86ab',
  playerOutline: '#1a5276',
  piece: '#e8a317',
  pieceGlow: '#ffd966',
  start: '#6bcb77',
  entrance: '#5b9bd5',
};

export class MazeScene {
  constructor(container, gameState, callbacks) {
    this.container = container;
    this.gameState = gameState;
    this.onExitToAssembly = callbacks.onExitToAssembly;
    this.onPieceCollected = callbacks.onPieceCollected;

    this.canvas = null;
    this.ctx = null;
    this.grid = null;
    this.cellSize = 20;
    this.offsetX = 0;
    this.offsetY = 0;
    this.pieceLocations = new Map();
    this.keys = {};
    this.timeLeft = 60;
    this.running = false;
    this.animationId = null;
    this.lastTime = 0;
    this.entrances = [];
    this.activeEntranceId = 0;
    this.playerX = 1.5;
    this.playerZ = 1.5;
    this.mazeCols = 31;
    this.mazeRows = 31;
    this.pieceCount = 10;
    this.staticCanvas = null;
    this.staticCtx = null;
    this.touchDx = 0;
    this.touchDz = 0;
    this.touchRoot = null;
    this._touchHandlers = null;

    this._onKeyDown = (e) => { this.keys[e.code] = true; };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    this._onResize = () => this.resize();
  }

  _isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  setupTouchControls() {
    if (!this._isTouchDevice() || this.touchRoot) return;

    this.touchRoot = document.createElement('div');
    this.touchRoot.className = 'maze-touch-controls';
    this.touchRoot.innerHTML = `
      <div class="maze-joystick-zone" aria-hidden="true">
        <div class="maze-joystick-knob"></div>
      </div>
    `;
    document.getElementById('app').appendChild(this.touchRoot);

    const zone = this.touchRoot.querySelector('.maze-joystick-zone');
    const knob = this.touchRoot.querySelector('.maze-joystick-knob');
    const maxR = 42;
    let activePointer = null;

    const updateFromPoint = (clientX, clientY) => {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.touchDx = dist > 10 ? dx / maxR : 0;
      this.touchDz = dist > 10 ? dy / maxR : 0;
    };

    const reset = () => {
      activePointer = null;
      this.touchDx = 0;
      this.touchDz = 0;
      knob.style.transform = 'translate(0, 0)';
    };

    const onPointerDown = (e) => {
      if (activePointer !== null) return;
      activePointer = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      updateFromPoint(e.clientX, e.clientY);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (e.pointerId !== activePointer) return;
      updateFromPoint(e.clientX, e.clientY);
      e.preventDefault();
    };

    const onPointerUp = (e) => {
      if (e.pointerId !== activePointer) return;
      if (zone.hasPointerCapture(e.pointerId)) {
        zone.releasePointerCapture(e.pointerId);
      }
      reset();
    };

    zone.addEventListener('pointerdown', onPointerDown);
    zone.addEventListener('pointermove', onPointerMove);
    zone.addEventListener('pointerup', onPointerUp);
    zone.addEventListener('pointercancel', onPointerUp);

    this._touchHandlers = { zone, onPointerDown, onPointerMove, onPointerUp };
    this.updateMazeHint(true);
  }

  teardownTouchControls() {
    if (!this.touchRoot) return;

    const { zone, onPointerDown, onPointerMove, onPointerUp } = this._touchHandlers ?? {};
    if (zone) {
      zone.removeEventListener('pointerdown', onPointerDown);
      zone.removeEventListener('pointermove', onPointerMove);
      zone.removeEventListener('pointerup', onPointerUp);
      zone.removeEventListener('pointercancel', onPointerUp);
    }

    this.touchRoot.remove();
    this.touchRoot = null;
    this._touchHandlers = null;
    this.touchDx = 0;
    this.touchDz = 0;
    this.updateMazeHint(false);
  }

  updateMazeHint(isTouch) {
    const hint = document.getElementById('maze-hint');
    if (!hint) return;
    hint.textContent = isTouch
      ? 'Sol alttaki joystick ile hareket et'
      : 'WASD veya ok tuşları ile hareket et';
  }

  start(options = {}) {
    const { entranceId = 0, newMaze = true } = options;
    const level = this.gameState.getLevelConfig();
    this.mazeCols = level.mazeSize;
    this.mazeRows = level.mazeSize;
    this.pieceCount = level.pieces;

    if (newMaze) {
      this.disposeInternal();
      this.timeLeft = level.timer;
      this.grid = generateMaze(this.mazeCols, this.mazeRows);
      this.entrances = findEntrances(this.grid);
      this.pieceLocations.clear();
      this.spawnPieces(this.entrances[0].x, this.entrances[0].z);

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'maze-canvas';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
      window.addEventListener('resize', this._onResize);
      this.setupTouchControls();
    } else {
      this.stop();
      this.timeLeft = level.timer;
    }

    this.setEntrance(entranceId);
    this.resize();
    this.buildStaticLayer();

    if (this.touchRoot) this.touchRoot.classList.remove('hidden');

    this.running = true;
    this.lastTime = performance.now();
    this.animate(this.lastTime);
  }

  getEntrances() {
    return this.entrances;
  }

  setEntrance(entranceId) {
    const entrance = this.entrances[entranceId] ?? this.entrances[0];
    this.activeEntranceId = entrance?.id ?? 0;
    if (entrance) {
      this.playerX = entrance.x + 0.5;
      this.playerZ = entrance.z + 0.5;
    }
  }

  spawnPieces(startX, startZ) {
    const locations = pickPieceLocations(this.grid, startX, startZ, this.pieceCount);
    locations.forEach((loc, index) => {
      if (!this.gameState.isPieceCollected(index)) {
        this.pieceLocations.set(index, { x: loc.x + 0.5, z: loc.z + 0.5 });
      }
    });
  }

  lock() {
    // 2D modda fare kilidi gerekmez
  }

  stop() {
    this.running = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.touchRoot) this.touchRoot.classList.add('hidden');
  }

  disposeInternal() {
    this.stop();
    this.teardownTouchControls();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('resize', this._onResize);

    if (this.canvas?.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.grid = null;
    this.entrances = [];
  }

  dispose() {
    this.disposeInternal();
  }

  resize() {
    if (!this.canvas) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.canvas.width = w;
    this.canvas.height = h;

    const padding = 24;
    const mazeW = this.mazeCols;
    const mazeH = this.mazeRows;
    this.cellSize = Math.min(
      (w - padding * 2) / mazeW,
      (h - padding * 2) / mazeH,
    );
    this.offsetX = (w - mazeW * this.cellSize) / 2;
    this.offsetY = (h - mazeH * this.cellSize) / 2;
    this.buildStaticLayer();
  }

  buildStaticLayer() {
    if (!this.ctx || !this.grid) return;

    if (!this.staticCanvas) {
      this.staticCanvas = document.createElement('canvas');
      this.staticCtx = this.staticCanvas.getContext('2d');
    }

    this.staticCanvas.width = this.canvas.width;
    this.staticCanvas.height = this.canvas.height;
    const ctx = this.staticCtx;
    const cs = this.cellSize;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);

    for (let z = 0; z < this.grid.length; z++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        const px = this.offsetX + x * cs;
        const py = this.offsetY + z * cs;

        if (this.grid[z][x] === 0) {
          ctx.fillStyle = (x + z) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
          ctx.fillRect(px, py, cs, cs);
        } else {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
          ctx.strokeStyle = COLORS.wallEdge;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
        }
      }
    }

    for (const entrance of this.entrances) {
      const px = this.offsetX + (entrance.x + 0.5) * cs;
      const py = this.offsetY + (entrance.z + 0.5) * cs;

      ctx.fillStyle = entrance.color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(px, py, cs * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = entrance.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, cs * 0.38, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  gridToPixel(gx, gz) {
    return {
      x: this.offsetX + gx * this.cellSize,
      y: this.offsetY + gz * this.cellSize,
    };
  }

  tryMove(dx, dz, delta) {
    const speed = MOVE_SPEED * delta;
    const nextX = this.playerX + dx * speed;
    const nextZ = this.playerZ + dz * speed;

    const tryAxis = (x, z) => {
      const gx = Math.floor(x);
      const gz = Math.floor(z);
      const margin = PLAYER_RADIUS * 0.9;
      const points = [
        [x - margin, z - margin],
        [x + margin, z - margin],
        [x - margin, z + margin],
        [x + margin, z + margin],
      ];
      return points.every(([px, pz]) => {
        const cx = Math.floor(px);
        const cz = Math.floor(pz);
        return isWalkable(this.grid, cx, cz);
      });
    };

    if (tryAxis(nextX, nextZ)) {
      this.playerX = nextX;
      this.playerZ = nextZ;
    } else if (tryAxis(nextX, this.playerZ)) {
      this.playerX = nextX;
    } else if (tryAxis(this.playerX, nextZ)) {
      this.playerZ = nextZ;
    }
  }

  checkPieceCollection() {
    for (const [id, loc] of this.pieceLocations) {
      const dx = this.playerX - loc.x;
      const dz = this.playerZ - loc.z;
      if (Math.sqrt(dx * dx + dz * dz) < 0.55) {
        this.pieceLocations.delete(id);
        this.gameState.collectPiece(id);
        this.onPieceCollected(id);
      }
    }
  }

  checkExitConditions() {
    if (this.timeLeft <= 0 || this.gameState.collectedPieces.size >= this.pieceCount) {
      this.stop();
      this.onExitToAssembly();
    }
  }

  getTimeLeft() {
    return Math.ceil(this.timeLeft);
  }

  draw() {
    const ctx = this.ctx;
    const cs = this.cellSize;

    if (this.staticCanvas) {
      ctx.drawImage(this.staticCanvas, 0, 0);
    } else {
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    for (const entrance of this.entrances) {
      if (entrance.id !== this.activeEntranceId) continue;
      const px = this.gridToPixel(entrance.x + 0.5, entrance.z + 0.5);
      ctx.fillStyle = entrance.color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(px.x, px.y, cs * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const pulse = Math.sin(performance.now() * 0.005) * 0.15 + 1;
    for (const [, loc] of this.pieceLocations) {
      const p = this.gridToPixel(loc.x, loc.z);
      const r = cs * 0.28 * pulse;

      ctx.fillStyle = COLORS.pieceGlow;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = COLORS.piece;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, cs * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', p.x, p.y);
    }

    const playerPx = this.gridToPixel(this.playerX, this.playerZ);
    ctx.fillStyle = COLORS.playerOutline;
    ctx.beginPath();
    ctx.arc(playerPx.x, playerPx.y, cs * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(playerPx.x, playerPx.y, cs * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }

  animate(now) {
    if (!this.running) return;
    this.animationId = requestAnimationFrame((t) => this.animate(t));

    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.timeLeft -= delta;

    let dx = 0;
    let dz = 0;

    if (this.touchDx !== 0 || this.touchDz !== 0) {
      dx = this.touchDx;
      dz = this.touchDz;
    } else {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) dz -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dz += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
    }

    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      this.tryMove(dx / len, dz / len, delta);
      this.checkPieceCollection();
    }

    this.draw();
    this.checkExitConditions();
  }
}
