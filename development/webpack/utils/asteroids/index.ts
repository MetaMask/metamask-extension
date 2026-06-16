import type { Stats } from 'webpack';
import { AsteroidsGame, isLargeEnough, type Asteroid } from './game';

type InputToken =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'b'
  | 'a'
  | 'enter'
  | 'p'
  | 'r'
  | 'q'
  | 'space'
  | 'ctrl-c';

type TerminalInput = NodeJS.ReadStream & {
  setRawMode?: (mode: boolean) => TerminalInput;
};

type TerminalOutput = NodeJS.WriteStream & {
  columns?: number;
  rows?: number;
};

type TerminalAsteroidsControllerOptions = {
  stdin: TerminalInput;
  stderr: TerminalOutput;
  frameIntervalMs?: number | null;
  now?: () => number;
  process?: NodeJS.Process;
  rng?: () => number;
  signalInterrupt?: () => void;
};

export type BuildStatusPrompt = {
  kind: 'failure' | 'success' | 'warning';
  headline: string;
  detail: string;
};

export type AsteroidsBuildGameController = {
  dispose: () => void;
  isActive: () => boolean;
  showBuildStatus: (
    prompt: BuildStatusPrompt,
    options?: { waitForResume?: boolean },
  ) => Promise<void>;
  suspendForBuildLog: () => void;
};

const CLEAR_SCREEN = '\u001b[2J';
const CLEAR_TO_END = '\u001b[0J';
const CURSOR_HOME = '\u001b[H';
const ENTER_ALT_SCREEN = '\u001b[?1049h';
const EXIT_ALT_SCREEN = '\u001b[?1049l';
const HIDE_CURSOR = '\u001b[?25l';
const SHOW_CURSOR = '\u001b[?25h';

const DEFAULT_COLUMNS = 80;
const DEFAULT_FRAME_INTERVAL_MS = 50;
const DEFAULT_ROWS = 24;
const GAME_STATUS_ROWS = 3;
const HELD_CONTROL_DURATION_MS = 125;
const BRAILLE_BASE_CODE_POINT = 0x2800;
const BRAILLE_BITS = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
] as const;
const KONAMI_SEQUENCE: InputToken[] = [
  'up',
  'up',
  'down',
  'down',
  'left',
  'right',
  'left',
  'right',
  'b',
  'a',
  'enter',
];

class NoopAsteroidsBuildGameController
  implements AsteroidsBuildGameController
{
  dispose() {
    // noop
  }

  isActive() {
    return false;
  }

  async showBuildStatus() {
    // noop
  }

  suspendForBuildLog() {
    // noop
  }
}

export class TerminalAsteroidsController
  implements AsteroidsBuildGameController
{
  #buildPrompt: BuildStatusPrompt | null = null;

  #disposed = false;

  #frameInterval: NodeJS.Timeout | null = null;

  #game: AsteroidsGame | null = null;

  #heldControls = {
    left: 0,
    right: 0,
    thrust: 0,
  };

  #inputBuffer = '';

  #inputWasPaused: boolean;

  #konamiIndex = 0;

  #lastFrame: string[] | null = null;

  #process?: NodeJS.Process;

  #rawMode = false;

  #resumeAfterPrompt: (() => void) | null = null;

  #screenActive = false;

  #signalInterrupt: () => void;

  #stderr: TerminalOutput;

  #stdin: TerminalInput;

  #frameIntervalMs: number | null;

  #now: () => number;

  #rng: () => number;

  constructor({
    stdin,
    stderr,
    frameIntervalMs = DEFAULT_FRAME_INTERVAL_MS,
    now = Date.now,
    process: nodeProcess,
    rng = Math.random,
    signalInterrupt = () => {
      process.kill(process.pid, 'SIGINT');
    },
  }: TerminalAsteroidsControllerOptions) {
    this.#stdin = stdin;
    this.#stderr = stderr;
    this.#frameIntervalMs = frameIntervalMs;
    this.#inputWasPaused = stdin.isPaused();
    this.#process = nodeProcess;
    this.#rng = rng;
    this.#signalInterrupt = signalInterrupt;
    this.#now = now;

    this.#stdin.on('data', this.#handleData);
    this.#stdin.resume();
    this.#process?.once('exit', this.#handleProcessExit);
  }

  dispose() {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    this.#resolvePromptWaiter();
    this.#stopLoop();
    this.#restoreTerminal();
    this.#stdin.off('data', this.#handleData);
    if (this.#inputWasPaused) {
      this.#stdin.pause();
    }
    this.#process?.off('exit', this.#handleProcessExit);
  }

  isActive() {
    return this.#game !== null && !this.#disposed;
  }

  isPaused() {
    return this.#game?.state.paused ?? false;
  }

  async showBuildStatus(
    prompt: BuildStatusPrompt,
    { waitForResume = false }: { waitForResume?: boolean } = {},
  ) {
    if (!this.isActive()) {
      return;
    }

    this.#buildPrompt = prompt;
    this.#clearHeldControls();
    this.#game?.setPaused(true);
    this.#enterScreen();
    this.#startLoop();
    this.#render();

    if (!waitForResume) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.#resolvePromptWaiter();
      this.#resumeAfterPrompt = resolve;
    });
  }

  suspendForBuildLog() {
    if (!this.isActive()) {
      return;
    }

    this.#stopLoop();
    this.#clearHeldControls();
    this.#leaveScreen();
  }

  #activate() {
    if (this.#disposed || this.isActive()) {
      return;
    }

    const { width, height } = this.#getGameDimensions();
    this.#game = new AsteroidsGame({ width, height, rng: this.#rng });
    this.#game.setPaused(!isLargeEnough(width, height));
    this.#setRawMode(true);
    this.#enterScreen();
    this.#startLoop();
    this.#render();
  }

  #applyHeldControls() {
    const game = this.#game;
    if (!game) {
      return;
    }

    const now = this.#now();
    if (this.#heldControls.left > now) {
      game.rotateLeft();
    } else if (this.#heldControls.right > now) {
      game.rotateRight();
    }
    if (this.#heldControls.thrust > now) {
      game.thrust();
    }
    this.#expireHeldControls(now);
  }

  #clearHeldControls() {
    this.#heldControls.left = 0;
    this.#heldControls.right = 0;
    this.#heldControls.thrust = 0;
  }

  #enterScreen() {
    if (this.#screenActive || !this.isActive()) {
      return;
    }

    this.#screenActive = true;
    this.#lastFrame = null;
    this.#stderr.write(
      `${ENTER_ALT_SCREEN}${HIDE_CURSOR}${CLEAR_SCREEN}${CURSOR_HOME}`,
    );
  }

  #finishBuildPrompt() {
    this.#clearHeldControls();
    if (!this.#buildPrompt) {
      this.#game?.togglePaused();
      this.#render();
      return;
    }

    this.#buildPrompt = null;
    this.#game?.setPaused(false);
    this.#resolvePromptWaiter();
    this.#render();
  }

  #getGameDimensions() {
    const width = Math.max(1, this.#stderr.columns ?? DEFAULT_COLUMNS);
    const height = Math.max(
      1,
      (this.#stderr.rows ?? DEFAULT_ROWS) - GAME_STATUS_ROWS,
    );
    return { width, height };
  }

  #handleActiveToken(token: InputToken) {
    if (token === 'ctrl-c') {
      this.dispose();
      this.#signalInterrupt();
      return;
    }

    if (token === 'q') {
      this.#quitGame();
      return;
    }

    if (token === 'p') {
      this.#finishBuildPrompt();
      return;
    }

    if (token === 'r') {
      this.#restartGame();
      return;
    }

    if (!this.#game) {
      return;
    }

    if (token === 'left' || token === 'right' || token === 'up') {
      this.#trackHeldControl(token);
    } else if (token === 'space' || token === 'enter') {
      this.#game.fire();
    }
    this.#applyHeldControls();
    this.#render();
  }

  #handleData = (chunk: Buffer | string) => {
    if (this.#disposed) {
      return;
    }

    const tokens = decodeInputTokens(chunk, this.#inputBuffer);
    this.#inputBuffer = tokens.pendingInput;
    for (const token of tokens.values) {
      if (this.isActive()) {
        this.#handleActiveToken(token);
      } else {
        this.#handleKonamiToken(token);
      }
    }
  };

  #handleKonamiToken(token: InputToken) {
    if (token === KONAMI_SEQUENCE[this.#konamiIndex]) {
      this.#konamiIndex += 1;
      if (this.#konamiIndex === KONAMI_SEQUENCE.length) {
        this.#konamiIndex = 0;
        this.#activate();
      }
      return;
    }

    this.#konamiIndex = token === KONAMI_SEQUENCE[0] ? 1 : 0;
  }

  #handleProcessExit = () => {
    this.#stopLoop();
    this.#restoreTerminal();
  };

  #leaveScreen() {
    if (!this.#screenActive) {
      return;
    }

    this.#screenActive = false;
    this.#lastFrame = null;
    this.#stderr.write(`${SHOW_CURSOR}${EXIT_ALT_SCREEN}`);
  }

  #expireHeldControls(now: number) {
    if (this.#heldControls.left <= now) {
      this.#heldControls.left = 0;
    }
    if (this.#heldControls.right <= now) {
      this.#heldControls.right = 0;
    }
    if (this.#heldControls.thrust <= now) {
      this.#heldControls.thrust = 0;
    }
  }

  #quitGame() {
    this.#buildPrompt = null;
    this.#clearHeldControls();
    this.#game = null;
    this.#konamiIndex = 0;
    this.#resolvePromptWaiter();
    this.#stopLoop();
    this.#restoreTerminal();
  }

  #render() {
    if (!this.#screenActive || !this.#game) {
      return;
    }

    this.#syncGameDimensions();
    this.#writeFrame(renderGameFrameRows(this.#game, this.#buildPrompt));
  }

  #resolvePromptWaiter() {
    const resolve = this.#resumeAfterPrompt;
    this.#resumeAfterPrompt = null;
    resolve?.();
  }

  #restartGame() {
    if (this.#buildPrompt) {
      return;
    }

    this.#clearHeldControls();
    const { width, height } = this.#getGameDimensions();
    this.#game = new AsteroidsGame({ width, height, rng: this.#rng });
    this.#game.setPaused(!isLargeEnough(width, height));
    this.#render();
  }

  #restoreTerminal() {
    this.#leaveScreen();
    this.#setRawMode(false);
  }

  #setRawMode(enabled: boolean) {
    if (this.#rawMode === enabled || !this.#stdin.setRawMode) {
      return;
    }

    this.#stdin.setRawMode(enabled);
    this.#rawMode = enabled;
  }

  #syncGameDimensions() {
    const game = this.#game;
    if (!game) {
      return;
    }

    const { width, height } = this.#getGameDimensions();
    if (game.state.width !== width || game.state.height !== height) {
      game.resize(width, height);
      this.#lastFrame = null;
    }
  }

  #writeFrame(rows: string[]) {
    const previousFrame = this.#lastFrame;
    if (!canDiffFrame(previousFrame, rows)) {
      this.#stderr.write(`${CURSOR_HOME}${rows.join('\n')}${CLEAR_TO_END}`);
      this.#lastFrame = rows;
      return;
    }

    let output = '';
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      if (rows[rowIndex] !== previousFrame[rowIndex]) {
        output += `\u001b[${rowIndex + 1};1H${rows[rowIndex]}`;
      }
    }

    if (output) {
      this.#stderr.write(output);
    }
    this.#lastFrame = rows;
  }

  #startLoop() {
    if (this.#frameInterval || this.#frameIntervalMs === null) {
      return;
    }

    this.#frameInterval = setInterval(() => {
      this.#applyHeldControls();
      this.#game?.tick();
      this.#render();
    }, this.#frameIntervalMs);
    this.#frameInterval.unref();
  }

  #stopLoop() {
    if (!this.#frameInterval) {
      return;
    }

    clearInterval(this.#frameInterval);
    this.#frameInterval = null;
  }

  #trackHeldControl(token: 'left' | 'right' | 'up') {
    const expiresAt = this.#now() + HELD_CONTROL_DURATION_MS;
    if (token === 'left') {
      this.#heldControls.left = expiresAt;
      this.#heldControls.right = 0;
    } else if (token === 'right') {
      this.#heldControls.right = expiresAt;
      this.#heldControls.left = 0;
    } else {
      this.#heldControls.thrust = expiresAt;
    }
  }
}

export function createAsteroidsBuildGame(
  nodeProcess: NodeJS.Process = process,
): AsteroidsBuildGameController {
  if (!nodeProcess.stdin.isTTY || !nodeProcess.stderr.isTTY) {
    return new NoopAsteroidsBuildGameController();
  }

  return new TerminalAsteroidsController({
    stdin: nodeProcess.stdin,
    stderr: nodeProcess.stderr,
    process: nodeProcess,
    signalInterrupt: () => nodeProcess.kill(nodeProcess.pid, 'SIGINT'),
  });
}

export function getBuildStatusPrompt(
  error?: Error | null,
  stats?: Stats,
): BuildStatusPrompt {
  const compilerName = stats?.compilation.compiler.name ?? 'webpack';
  const elapsed =
    stats && Number.isFinite(stats.endTime) && Number.isFinite(stats.startTime)
      ? ` in ${stats.endTime - stats.startTime} ms`
      : '';

  if (error || stats?.hasErrors()) {
    return {
      kind: 'failure',
      headline: 'Build failed',
      detail: `${compilerName} failed${elapsed}. Press P to continue.`,
    };
  }

  if (stats?.hasWarnings()) {
    return {
      kind: 'warning',
      headline: 'Build completed with warnings',
      detail: `${compilerName} completed with warnings${elapsed}. Press P to resume.`,
    };
  }

  return {
    kind: 'success',
    headline: 'Build succeeded',
    detail: `${compilerName} completed successfully${elapsed}. Press P to resume.`,
  };
}

export function decodeInputTokens(
  chunk: Buffer | string,
  pendingInput = '',
): { values: InputToken[]; pendingInput: string } {
  let input = pendingInput + chunk.toString();
  const values: InputToken[] = [];

  while (input.length > 0) {
    const first = input[0];
    if (first === '\u0003') {
      values.push('ctrl-c');
      input = input.slice(1);
    } else if (first === '\u001b') {
      if (input.length < 3) {
        break;
      }
      const escapeSequence = input.slice(0, 3);
      const arrow = {
        '\u001b[A': 'up',
        '\u001b[B': 'down',
        '\u001b[C': 'right',
        '\u001b[D': 'left',
      }[escapeSequence] as InputToken | undefined;
      if (arrow) {
        values.push(arrow);
        input = input.slice(3);
      } else {
        input = input.slice(1);
      }
    } else if (first === '\r' || first === '\n') {
      values.push('enter');
      input = input.slice(1);
    } else if (first === ' ') {
      values.push('space');
      input = input.slice(1);
    } else {
      const lower = first.toLowerCase();
      if (
        lower === 'a' ||
        lower === 'b' ||
        lower === 'p' ||
        lower === 'q' ||
        lower === 'r'
      ) {
        values.push(lower as InputToken);
      }
      input = input.slice(1);
    }
  }

  return { values, pendingInput: input };
}

type Point = {
  x: number;
  y: number;
};

const asteroidShapeCache = new Map<string, number[]>();

class BrailleCanvas {
  readonly #cells: Uint8Array;

  readonly #height: number;

  readonly #width: number;

  constructor(width: number, height: number) {
    this.#width = width;
    this.#height = height;
    this.#cells = new Uint8Array(width * height);
  }

  clearCircle(center: Point, radius: number) {
    const minPixelX = Math.floor((center.x - radius) * 2);
    const maxPixelX = Math.ceil((center.x + radius) * 2);
    const minPixelY = Math.floor((center.y - radius) * 4);
    const maxPixelY = Math.ceil((center.y + radius) * 4);

    for (let pixelY = minPixelY; pixelY <= maxPixelY; pixelY++) {
      for (let pixelX = minPixelX; pixelX <= maxPixelX; pixelX++) {
        const worldX = pixelX / 2;
        const worldY = pixelY / 4;
        if (distance(center, { x: worldX, y: worldY }) <= radius) {
          this.clearPixel(pixelX, pixelY);
        }
      }
    }
  }

  drawFilledPolygon(vertices: Point[]) {
    const bounds = getBounds(vertices);
    const minPixelX = Math.floor(bounds.minX * 2);
    const maxPixelX = Math.ceil(bounds.maxX * 2);
    const minPixelY = Math.floor(bounds.minY * 4);
    const maxPixelY = Math.ceil(bounds.maxY * 4);

    for (let pixelY = minPixelY; pixelY <= maxPixelY; pixelY++) {
      for (let pixelX = minPixelX; pixelX <= maxPixelX; pixelX++) {
        if (isInsidePolygon({ x: pixelX / 2, y: pixelY / 4 }, vertices)) {
          this.setPixel(pixelX, pixelY);
        }
      }
    }
  }

  drawLine(start: Point, end: Point, thickness = 0) {
    const startX = Math.round(start.x * 2);
    const startY = Math.round(start.y * 4);
    const endX = Math.round(end.x * 2);
    const endY = Math.round(end.y * 4);
    const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY), 1);

    for (let step = 0; step <= steps; step++) {
      const progress = step / steps;
      this.setPixel(
        Math.round(startX + (endX - startX) * progress),
        Math.round(startY + (endY - startY) * progress),
        thickness,
      );
    }
  }

  setPoint(point: Point, thickness = 0) {
    this.setPixel(Math.round(point.x * 2), Math.round(point.y * 4), thickness);
  }

  toRows() {
    const rows: string[] = [];
    for (let row = 0; row < this.#height; row++) {
      let line = '';
      for (let column = 0; column < this.#width; column++) {
        const mask = this.#cells[row * this.#width + column];
        line += mask
          ? String.fromCharCode(BRAILLE_BASE_CODE_POINT + mask)
          : ' ';
      }
      rows.push(line);
    }
    return rows;
  }

  clearPixel(pixelX: number, pixelY: number) {
    const location = this.#getLocation(pixelX, pixelY);
    if (!location) {
      return;
    }

    this.#cells[location.cellIndex] &= ~location.bit;
  }

  setPixel(pixelX: number, pixelY: number, thickness = 0) {
    for (let y = pixelY - thickness; y <= pixelY + thickness; y++) {
      for (let x = pixelX - thickness; x <= pixelX + thickness; x++) {
        const location = this.#getLocation(x, y);
        if (location) {
          this.#cells[location.cellIndex] |= location.bit;
        }
      }
    }
  }

  #getLocation(pixelX: number, pixelY: number) {
    if (pixelX < 0 || pixelY < 0) {
      return null;
    }

    const cellX = Math.floor(pixelX / 2);
    const cellY = Math.floor(pixelY / 4);
    if (
      cellX < 0 ||
      cellY < 0 ||
      cellX >= this.#width ||
      cellY >= this.#height
    ) {
      return null;
    }

    const dotX = pixelX - cellX * 2;
    const dotY = pixelY - cellY * 4;
    return {
      bit: BRAILLE_BITS[dotX][dotY],
      cellIndex: cellY * this.#width + cellX,
    };
  }
}

export function renderGameFrameRows(
  game: AsteroidsGame,
  buildPrompt: BuildStatusPrompt | null,
): string[] {
  const { state } = game;
  const rows = [
    fitText(
      `ASTEROIDS  Score ${state.score}  Lives ${state.ship.lives}  Level ${state.level}`,
      state.width,
    ),
  ];

  const canvas = new BrailleCanvas(state.width, state.height);
  if (!state.tooSmall) {
    for (const asteroid of state.asteroids) {
      drawAsteroid(canvas, asteroid);
    }
    for (const bullet of state.bullets) {
      drawBullet(canvas, bullet);
    }
    drawShip(canvas, state.ship);
  }
  rows.push(...canvas.toRows());

  let footer = '';
  let prompt = '';
  if (state.tooSmall) {
    footer = 'Terminal too small for Asteroids.';
    prompt = 'Resize to at least 40x19, or press Q to quit.';
  } else if (buildPrompt) {
    footer = buildPrompt.headline;
    prompt = buildPrompt.detail;
  } else if (state.gameOver) {
    footer = 'Game over.';
    prompt = 'Press R to restart, Q to quit.';
  } else if (state.paused) {
    footer = 'Paused.';
    prompt = 'Press P to unpause, R to restart, Q to quit.';
  } else {
    footer = 'Arrows move. Space or Enter fires.';
    prompt = 'P pauses. R restarts. Q quits.';
  }

  rows.push(fitText(footer, state.width), fitText(prompt, state.width));
  return rows;
}

function canDiffFrame(
  previousFrame: string[] | null,
  nextFrame: string[],
): previousFrame is string[] {
  if (!previousFrame || previousFrame.length !== nextFrame.length) {
    return false;
  }

  return previousFrame.every(
    (previousRow, rowIndex) => previousRow.length === nextFrame[rowIndex].length,
  );
}

function drawAsteroid(canvas: BrailleCanvas, asteroid: Asteroid) {
  const vertices = getAsteroidVertices(asteroid);
  canvas.drawFilledPolygon(vertices);

  for (let index = 0; index < asteroid.size; index++) {
    const angle =
      asteroid.angle + pseudoRandom(asteroid.id * 19 + index * 7) * Math.PI * 2;
    const distanceFromCenter =
      asteroid.radius * (0.16 + pseudoRandom(asteroid.id * 23 + index) * 0.44);
    canvas.clearCircle(
      {
        x: asteroid.x + Math.cos(angle) * distanceFromCenter,
        y: asteroid.y + Math.sin(angle) * distanceFromCenter,
      },
      asteroid.radius * 0.11,
    );
  }

  for (let index = 0; index < vertices.length; index++) {
    canvas.drawLine(vertices[index], vertices[(index + 1) % vertices.length]);
  }
}

function drawBullet(canvas: BrailleCanvas, bullet: Point) {
  canvas.setPoint(bullet, 1);
}

function drawShip(
  canvas: BrailleCanvas,
  ship: { x: number; y: number; vx: number; vy: number; angle: number },
) {
  const noseLength = 2.15;
  const tailLength = 1.45;
  const wingAngle = 2.48;
  const nose = {
    x: ship.x + Math.cos(ship.angle) * noseLength,
    y: ship.y + Math.sin(ship.angle) * noseLength,
  };
  const leftWing = {
    x: ship.x + Math.cos(ship.angle + wingAngle) * tailLength,
    y: ship.y + Math.sin(ship.angle + wingAngle) * tailLength,
  };
  const rightWing = {
    x: ship.x + Math.cos(ship.angle - wingAngle) * tailLength,
    y: ship.y + Math.sin(ship.angle - wingAngle) * tailLength,
  };

  canvas.drawFilledPolygon([nose, leftWing, rightWing]);
  canvas.drawLine(nose, leftWing);
  canvas.drawLine(nose, rightWing);
  canvas.drawLine(leftWing, rightWing);

  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > 0.05) {
    const flameStart = {
      x: ship.x - Math.cos(ship.angle) * 1.1,
      y: ship.y - Math.sin(ship.angle) * 1.1,
    };
    const flameEnd = {
      x: ship.x - Math.cos(ship.angle) * (1.55 + Math.min(speed, 0.9)),
      y: ship.y - Math.sin(ship.angle) * (1.55 + Math.min(speed, 0.9)),
    };
    canvas.drawLine(flameStart, flameEnd);
  }
}

function fitText(text: string, width: number) {
  if (text.length >= width) {
    return text.slice(0, width);
  }
  return text.padEnd(width, ' ');
}

function getAsteroidVertices(asteroid: Asteroid) {
  const shape = getAsteroidShape(asteroid.id, asteroid.size);
  return shape.map((radiusScale, index) => {
    const angle = asteroid.angle + (index / shape.length) * Math.PI * 2;
    return {
      x: asteroid.x + Math.cos(angle) * asteroid.radius * radiusScale,
      y: asteroid.y + Math.sin(angle) * asteroid.radius * radiusScale,
    };
  });
}

function getAsteroidShape(id: number, size: number) {
  const cacheKey = `${id}:${size}`;
  const cachedShape = asteroidShapeCache.get(cacheKey);
  if (cachedShape) {
    return cachedShape;
  }

  const vertices = getAsteroidVertexCount(size);
  const shape = Array.from({ length: vertices }, (_, index) => {
    const roughness = pseudoRandom(id * 97 + index * 31);
    return 0.72 + roughness * 0.48;
  });
  asteroidShapeCache.set(cacheKey, shape);
  return shape;
}

function getAsteroidVertexCount(size: number) {
  if (size === 3) {
    return 14;
  }
  if (size === 2) {
    return 10;
  }
  return 7;
}

function getBounds(vertices: Point[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
  }

  return { maxX, maxY, minX, minY };
}

function isInsidePolygon(point: Point, vertices: Point[]) {
  let inside = false;
  for (
    let index = 0, previousIndex = vertices.length - 1;
    index < vertices.length;
    previousIndex = index++
  ) {
    const current = vertices[index];
    const previous = vertices[previousIndex];
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function distance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}
