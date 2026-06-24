import { GameState, STATES } from './game/GameState.js';
import { MazeScene } from './maze/MazeScene.js';
import { EntrancePicker } from './maze/EntrancePicker.js';
import { AssemblyUI } from './assembly/AssemblyUI.js';
import { RiddleGate } from './riddle/RiddleGate.js';
import { StoryReader } from './story/StoryReader.js';

const $ = (id) => document.getElementById(id);

const gameState = new GameState();

const screens = {
  start: $('start-screen'),
  hud: $('hud'),
  assembly: $('assembly-screen'),
  entrance: $('entrance-screen'),
  riddle: $('riddle-screen'),
  story: $('story-screen'),
  win: $('win-screen'),
  gameover: $('gameover-screen'),
};

const hud = {
  level: $('hud-level'),
  timer: $('timer'),
  pieceCount: $('piece-count'),
};

let mazeScene = null;
let hudInterval = null;

const assemblyUI = new AssemblyUI(
  {
    screen: screens.assembly,
    title: $('assembly-title'),
    boardWrap: $('puzzle-board-wrap'),
    board: $('puzzle-board'),
    inventory: $('puzzle-inventory'),
    status: $('assembly-status'),
    backBtn: $('btn-back-maze'),
  },
  gameState,
  {
    onBackToMaze: () => enterRiddle(),
    onWin: () => enterStory(),
  },
);

const riddleGate = new RiddleGate(
  {
    screen: screens.riddle,
    text: $('riddle-text'),
    options: $('riddle-options'),
    attempts: $('riddle-attempts'),
    feedback: $('riddle-feedback'),
  },
  gameState,
  {
    onSuccess: () => enterEntranceSelect(),
    onFailure: () => enterGameOver(),
  },
);

const entrancePicker = new EntrancePicker(
  {
    screen: screens.entrance,
    list: $('entrance-options'),
  },
  {
    onSelect: (entranceId) => enterMaze({ entranceId, newMaze: false }),
  },
);

const storyReader = new StoryReader(
  {
    screen: screens.story,
    title: $('story-title'),
    body: $('story-body'),
    pageIndicator: $('story-page'),
    prevBtn: $('btn-story-prev'),
    nextBtn: $('btn-story-next'),
    continueBtn: $('btn-story-continue'),
  },
  {
    onContinue: () => {
      const nextLevel = gameState.level + 1;
      gameState.advanceLevel();
      if (mazeScene) mazeScene.dispose();
      mazeScene = null;
      if (gameState.level === nextLevel) {
        enterMaze({ entranceId: 0, newMaze: true });
      }
    },
    onFinish: () => enterWin(),
  },
);

function hideAllOverlays() {
  for (const screen of Object.values(screens)) {
    if (screen === screens.hud) continue;
    screen.classList.remove('visible');
    screen.classList.add('hidden');
  }
}

function updateHud() {
  if (!mazeScene) return;
  const cfg = gameState.getLevelConfig();
  hud.level.textContent = `Sv.${cfg.level}`;
  const time = mazeScene.getTimeLeft();
  hud.timer.textContent = String(Math.max(0, time));
  hud.timer.classList.toggle('warning', time <= 10);
  hud.pieceCount.textContent = `${gameState.collectedPieces.size}/${cfg.pieces}`;
}

function startHudLoop() {
  stopHudLoop();
  hudInterval = setInterval(updateHud, 200);
  updateHud();
}

function stopHudLoop() {
  if (hudInterval) {
    clearInterval(hudInterval);
    hudInterval = null;
  }
}

function enterMaze({ entranceId = 0, newMaze = true } = {}) {
  try {
    hideAllOverlays();
    screens.hud.classList.remove('hidden');
    gameState.setState(STATES.MAZE);

    if (!mazeScene) {
      mazeScene = new MazeScene($('maze-container'), gameState, {
        onExitToAssembly: () => enterAssembly(),
        onPieceCollected: () => updateHud(),
      });
    }

    mazeScene.start({ entranceId, newMaze });
    startHudLoop();
  } catch (err) {
    console.error('Labirent başlatılamadı:', err);
    showStartScreen();
    alert('Labirent yüklenirken hata oluştu. Sayfayı yenileyip tekrar deneyin.');
  }
}

function showStartScreen() {
  hideAllOverlays();
  screens.hud.classList.add('hidden');
  screens.start.classList.remove('hidden');
  screens.start.classList.add('visible');
}

function enterEntranceSelect() {
  hideAllOverlays();
  if (mazeScene) mazeScene.stop();
  stopHudLoop();
  screens.hud.classList.add('hidden');

  const entrances = mazeScene?.getEntrances() ?? [];
  entrancePicker.show(entrances);
}

function enterAssembly() {
  if (mazeScene) mazeScene.stop();
  stopHudLoop();
  screens.hud.classList.add('hidden');
  hideAllOverlays();
  gameState.sanitizePieces();
  gameState.setState(STATES.ASSEMBLY);
  screens.assembly.classList.remove('hidden');
  screens.assembly.classList.add('visible');
  assemblyUI.show();
}

function enterRiddle() {
  assemblyUI.hide();
  gameState.setState(STATES.RIDDLE);
  riddleGate.show();
}

function enterStory() {
  assemblyUI.hide();
  gameState.onPuzzleComplete();
  storyReader.show(gameState.level);
}

function enterWin() {
  gameState.setState(STATES.WIN);
  screens.win.classList.remove('hidden');
  screens.win.classList.add('visible');
}

function enterGameOver() {
  gameState.setState(STATES.GAME_OVER);
  screens.gameover.classList.remove('hidden');
  screens.gameover.classList.add('visible');
}

function restartGame() {
  if (mazeScene) mazeScene.dispose();
  mazeScene = null;
  stopHudLoop();
  assemblyUI.hide();
  entrancePicker.hide();
  riddleGate.hide();
  storyReader.hide();
  gameState.reset();
  hideAllOverlays();
  screens.hud.classList.add('hidden');
  screens.start.classList.remove('hidden');
  screens.start.classList.add('visible');
}

function startNewGame() {
  if (mazeScene) mazeScene.dispose();
  mazeScene = null;
  gameState.reset();
  stopHudLoop();
  assemblyUI.hide();
  hideAllOverlays();
  screens.start.classList.remove('visible');
  screens.start.classList.add('hidden');
  enterMaze({ entranceId: 0, newMaze: true });
}

function initFromSession() {
  restartGame();
}

$('btn-start').addEventListener('click', startNewGame);
$('btn-reset-start').addEventListener('click', restartGame);
$('btn-reset-hud').addEventListener('click', restartGame);
$('btn-reset-assembly').addEventListener('click', restartGame);
$('btn-play-again').addEventListener('click', startNewGame);
$('btn-restart').addEventListener('click', restartGame);

initFromSession();
