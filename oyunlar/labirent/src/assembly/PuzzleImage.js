export function createPuzzleImage(levelConfig) {
  return createPuzzleAssets(levelConfig).fullUrl;
}

export function createPuzzleAssets(levelConfig) {
  const aspect = levelConfig.cols / levelConfig.rows;
  const width = 1000;
  const height = Math.max(400, Math.round(width / aspect));
  const { cols, rows, pieces } = levelConfig;

  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const ctx = source.getContext('2d');

  const painters = {
    castle: paintCastle,
    forest: paintForest,
    ocean: paintOcean,
    sky: paintSky,
    cosmic: paintCosmic,
  };

  (painters[levelConfig.theme] ?? paintCastle)(ctx, width, height, levelConfig.title);

  const cellW = width / cols;
  const cellH = height / rows;
  const slice = document.createElement('canvas');
  const sliceCtx = slice.getContext('2d');
  const pieceUrls = [];

  for (let i = 0; i < pieces; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    slice.width = cellW;
    slice.height = cellH;
    sliceCtx.clearRect(0, 0, cellW, cellH);
    sliceCtx.drawImage(
      source,
      col * cellW,
      row * cellH,
      cellW,
      cellH,
      0,
      0,
      cellW,
      cellH,
    );
    pieceUrls.push(slice.toDataURL('image/png'));
  }

  return {
    fullUrl: source.toDataURL('image/png'),
    pieceUrls,
  };
}

function paintCastle(ctx, width, height, title) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#0a0618');
  sky.addColorStop(0.5, '#1a1035');
  sky.addColorStop(1, '#2d1a4a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawStars(ctx, width, height * 0.6, 80);
  drawMoon(ctx, width * 0.82, height * 0.18);

  const groundY = height * 0.72;
  ctx.fillStyle = '#1a1228';
  ctx.fillRect(0, groundY, width, height - groundY);
  drawHills(ctx, groundY, width, '#2a2040');
  drawCastle(ctx, width * 0.35, groundY, height);
  drawDragon(ctx, width * 0.68, groundY - 20, height);
  drawTitle(ctx, title, width, height);
}

function paintForest(ctx, width, height, title) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#1a3d2a');
  sky.addColorStop(1, '#2d5a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const groundY = height * 0.75;
  ctx.fillStyle = '#1a4a2a';
  ctx.fillRect(0, groundY, width, height - groundY);

  for (let i = 0; i < 12; i++) {
    const x = (width / 12) * i + 20;
    drawTree(ctx, x, groundY, 40 + (i % 3) * 15, '#2d6a3d', '#1a4028');
  }

  ctx.fillStyle = 'rgba(200, 255, 200, 0.6)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(width * 0.2 + i * 130, groundY - 60 - i * 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTitle(ctx, title, width, height);
}

function paintOcean(ctx, width, height, title) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#0a2040');
  sky.addColorStop(0.4, '#1a5080');
  sky.addColorStop(1, '#0a3050');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const waterY = height * 0.45;
  ctx.fillStyle = '#1a6090';
  ctx.fillRect(0, waterY, width, height - waterY);

  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 + (i % 3) * 0.1})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const y = waterY + 20 + i * 25;
    for (let x = 0; x <= width; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 8);
    }
    ctx.stroke();
  }

  drawCoral(ctx, width * 0.2, height * 0.7, '#c45a7a');
  drawCoral(ctx, width * 0.7, height * 0.75, '#e8a040');
  drawFish(ctx, width * 0.5, height * 0.6);

  drawTitle(ctx, title, width, height);
}

function paintSky(ctx, width, height, title) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#4a90c8');
  sky.addColorStop(0.5, '#87ceeb');
  sky.addColorStop(1, '#c8e0f0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 6; i++) {
    const x = width * (0.1 + i * 0.15);
    const y = height * (0.15 + (i % 3) * 0.1);
    drawCloud(ctx, x, y, 60 + i * 10);
  }

  const islandY = height * 0.55;
  ctx.fillStyle = '#8a9aaa';
  ctx.beginPath();
  ctx.ellipse(width / 2, islandY + 40, width * 0.35, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSkyCastle(ctx, width / 2, islandY, height);
  drawTitle(ctx, title, width, height);
}

function paintCosmic(ctx, width, height, title) {
  ctx.fillStyle = '#0a0520';
  ctx.fillRect(0, 0, width, height);

  drawStars(ctx, width, height, 200);

  const nebula = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
  nebula.addColorStop(0, 'rgba(120, 60, 200, 0.4)');
  nebula.addColorStop(0.5, 'rgba(60, 20, 120, 0.2)');
  nebula.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, width, height);

  drawCosmicThrone(ctx, width / 2, height * 0.55, height);
  drawTitle(ctx, title, width, height);
}

function drawTitle(ctx, title, width, height) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, height - 16);
}

function drawStars(ctx, width, maxY, count) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * maxY;
    ctx.fillStyle = `rgba(255, 240, 200, ${Math.random() * 0.8 + 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMoon(ctx, x, y) {
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(x, y, 45, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, groundY, width, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width; x += 40) {
    const h = Math.sin(x * 0.02) * 15 + Math.cos(x * 0.05) * 10;
    ctx.lineTo(x, groundY - 30 - h);
  }
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawCastle(ctx, baseX, groundY, height) {
  const s = height / 400;
  ctx.fillStyle = '#3d3555';
  ctx.fillRect(baseX - 80 * s, groundY - 120 * s, 160 * s, 120 * s);
  ctx.fillStyle = '#4a4068';
  for (let i = 0; i < 5; i++) {
    const tx = baseX - 70 * s + i * 35 * s;
    ctx.fillRect(tx, groundY - 160 * s, 25 * s, 40 * s);
  }
  ctx.fillStyle = '#f0d060';
  ctx.fillRect(baseX - 15 * s, groundY - 50 * s, 30 * s, 50 * s);
}

function drawDragon(ctx, baseX, baseY, height) {
  const s = height / 400;
  ctx.fillStyle = '#5a2040';
  ctx.beginPath();
  ctx.ellipse(baseX, baseY - 40 * s, 70 * s, 35 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd060';
  ctx.beginPath();
  ctx.arc(baseX + 65 * s, baseY - 58 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx, x, groundY, h, foliage, trunk) {
  ctx.fillStyle = trunk;
  ctx.fillRect(x - 6, groundY - h * 0.4, 12, h * 0.4);
  ctx.fillStyle = foliage;
  ctx.beginPath();
  ctx.moveTo(x, groundY - h);
  ctx.lineTo(x - h * 0.35, groundY - h * 0.3);
  ctx.lineTo(x + h * 0.35, groundY - h * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawCoral(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (i - 2) * 15, y - 40 - i * 5, x + (i - 2) * 20, y - 20);
    ctx.stroke();
  }
}

function drawFish(ctx, x, y) {
  ctx.fillStyle = '#f0a030';
  ctx.beginPath();
  ctx.ellipse(x, y, 25, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e88020';
  ctx.beginPath();
  ctx.moveTo(x - 25, y);
  ctx.lineTo(x - 40, y - 10);
  ctx.lineTo(x - 40, y + 10);
  ctx.fill();
}

function drawCloud(ctx, x, y, size) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.7, y, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyCastle(ctx, cx, groundY, height) {
  const s = height / 400;
  ctx.fillStyle = '#d0d8e8';
  ctx.fillRect(cx - 60 * s, groundY - 80 * s, 120 * s, 80 * s);
  ctx.fillStyle = '#a0b0c8';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - 50 * s + i * 40 * s, groundY - 110 * s, 20 * s, 30 * s);
  }
}

function drawCosmicThrone(ctx, cx, cy, height) {
  const s = height / 400;
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(cx - 80 * s, cy, 160 * s, 30 * s);
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(cx - 60 * s, cy - 60 * s, 120 * s, 60 * s);
  ctx.fillStyle = 'rgba(200, 160, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(cx, cy - 80 * s, 30 * s, 0, Math.PI * 2);
  ctx.fill();
}

export function getPieceBackgroundPosition(index, cols, rows) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const xPct = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const yPct = rows > 1 ? (row / (rows - 1)) * 100 : 0;
  return { xPct, yPct, col, row };
}

export function getPieceLayout(boardWidth, boardHeight, cols, rows, total) {
  const pieceW = boardWidth / cols;
  const pieceH = boardHeight / rows;
  const layout = [];

  for (let i = 0; i < total; i++) {
    const { col, row } = getPieceBackgroundPosition(i, cols, rows);
    layout.push({
      id: i,
      slotX: col * pieceW,
      slotY: row * pieceH,
      width: pieceW,
      height: pieceH,
    });
  }
  return layout;
}

export function getBackgroundSize(cols, rows) {
  return `${cols * 100}% ${rows * 100}%`;
}
