const DIRECTIONS = [
  [0, -2],
  [2, 0],
  [0, 2],
  [-2, 0],
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMaze(cols, rows) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1));

  function carve(x, y) {
    grid[y][x] = 0;
    const dirs = shuffle([...DIRECTIONS]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  return grid;
}

export function gridToWorld(gridX, gridZ, cellSize) {
  return {
    x: gridX * cellSize + cellSize / 2,
    z: gridZ * cellSize + cellSize / 2,
  };
}

export function worldToGrid(x, z, cellSize) {
  return {
    gridX: Math.floor(x / cellSize),
    gridZ: Math.floor(z / cellSize),
  };
}

export function isWalkable(grid, gridX, gridZ) {
  if (gridZ < 0 || gridZ >= grid.length || gridX < 0 || gridX >= grid[0].length) {
    return false;
  }
  return grid[gridZ][gridX] === 0;
}

export function findDeadEnds(grid) {
  const deadEnds = [];
  const rows = grid.length;
  const cols = grid[0].length;

  for (let z = 1; z < rows - 1; z++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[z][x] !== 0) continue;
      let neighbors = 0;
      if (grid[z - 1]?.[x] === 0) neighbors++;
      if (grid[z + 1]?.[x] === 0) neighbors++;
      if (grid[z][x - 1] === 0) neighbors++;
      if (grid[z][x + 1] === 0) neighbors++;
      if (neighbors === 1) deadEnds.push({ x, z });
    }
  }
  return deadEnds;
}

export function bfsDistances(grid, startX, startZ) {
  const rows = grid.length;
  const cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const queue = [[startX, startZ]];
  dist[startZ][startX] = 0;

  while (queue.length) {
    const [x, z] = queue.shift();
    const neighbors = [
      [x, z - 1],
      [x, z + 1],
      [x - 1, z],
      [x + 1, z],
    ];
    for (const [nx, nz] of neighbors) {
      if (isWalkable(grid, nx, nz) && dist[nz][nx] === -1) {
        dist[nz][nx] = dist[z][x] + 1;
        queue.push([nx, nz]);
      }
    }
  }
  return dist;
}

export function pickPieceLocations(grid, startX, startZ, count) {
  const deadEnds = findDeadEnds(grid);
  const dist = bfsDistances(grid, startX, startZ);

  const candidates = [];
  for (let z = 1; z < grid.length - 1; z++) {
    for (let x = 1; x < grid[0].length - 1; x++) {
      if (grid[z][x] !== 0) continue;
      if (x === startX && z === startZ) continue;
      candidates.push({ x, z, dist: dist[z][x] });
    }
  }

  candidates.sort((a, b) => b.dist - a.dist);
  deadEnds.sort((a, b) => (dist[b.z][b.x] ?? 0) - (dist[a.z][a.x] ?? 0));

  const picked = [];
  const used = new Set();

  const tryAdd = (x, z) => {
    const key = `${x},${z}`;
    if (used.has(key)) return false;
    used.add(key);
    picked.push({ x, z });
    return true;
  };

  for (const end of deadEnds) {
    if (picked.length >= count) break;
    tryAdd(end.x, end.z);
  }

  for (const c of candidates) {
    if (picked.length >= count) break;
    tryAdd(c.x, c.z);
  }

  if (picked.length < count) {
    for (let z = 1; z < grid.length - 1; z++) {
      for (let x = 1; x < grid[0].length - 1; x++) {
        if (grid[z][x] !== 0) continue;
        if (x === startX && z === startZ) continue;
        tryAdd(x, z);
        if (picked.length >= count) break;
      }
      if (picked.length >= count) break;
    }
  }

  return picked.slice(0, count);
}

const ENTRANCE_DEFS = [
  { id: 0, label: 'Kuzey Kapısı', color: '#5b9bd5' },
  { id: 1, label: 'Doğu Kapısı', color: '#e8a317' },
  { id: 2, label: 'Güney Kapısı', color: '#6bcb77' },
  { id: 3, label: 'Batı Kapısı', color: '#c96b9a' },
];

function perimeterDistance(x, z, cols, rows) {
  return Math.min(x, z, cols - 1 - x, rows - 1 - z);
}

function quadrantIndex(x, z, cols, rows) {
  const midX = Math.floor(cols / 2);
  const midZ = Math.floor(rows / 2);
  if (z < midZ && x < midX) return 0;
  if (z < midZ && x >= midX) return 1;
  if (z >= midZ && x >= midX) return 2;
  return 3;
}

export function findEntrances(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const best = Array.from({ length: 4 }, () => null);

  for (let z = 1; z < rows - 1; z++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[z][x] !== 0) continue;
      const q = quadrantIndex(x, z, cols, rows);
      const edgeDist = perimeterDistance(x, z, cols, rows);
      const current = best[q];
      if (!current || edgeDist < current.edgeDist) {
        best[q] = { x, z, edgeDist };
      }
    }
  }

  return ENTRANCE_DEFS.map((def, index) => {
    const cell = best[index] ?? { x: 1 + index * 2, z: 1 + index * 2 };
    return { ...def, x: cell.x, z: cell.z };
  });
}

