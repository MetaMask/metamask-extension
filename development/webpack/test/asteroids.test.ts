import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { describe, it, mock } from 'node:test';
import type { Stats } from 'webpack';
import {
  createAsteroidsBuildGame,
  decodeInputTokens,
  getBuildStatusPrompt,
  renderGameFrameRows,
  TerminalAsteroidsController,
} from '../utils/asteroids';
import { AsteroidsGame, type Asteroid } from '../utils/asteroids/game';

const ARROWS = {
  up: '\u001b[A',
  down: '\u001b[B',
  right: '\u001b[C',
  left: '\u001b[D',
} as const;
const ENTER_ALT_SCREEN = '\u001b[?1049h';
const EXIT_ALT_SCREEN = '\u001b[?1049l';

class FakeInput extends EventEmitter {
  isTTY = true;

  rawModes: boolean[] = [];

  pauseCalls = 0;

  resumeCalls = 0;

  #paused = true;

  isPaused() {
    return this.#paused;
  }

  pause() {
    this.pauseCalls += 1;
    this.#paused = true;
    return this;
  }

  resume() {
    this.resumeCalls += 1;
    this.#paused = false;
    return this;
  }

  setRawMode(enabled: boolean) {
    this.rawModes.push(enabled);
    return this;
  }

  send(input: string) {
    this.emit('data', Buffer.from(input));
  }
}

class FakeOutput extends EventEmitter {
  isTTY = true;

  columns = 80;

  rows = 24;

  chunks: string[] = [];

  write(chunk: string | Buffer) {
    this.chunks.push(String(chunk));
    return true;
  }

  output() {
    return this.chunks.join('');
  }
}

describe('./utils/asteroids', () => {
  it('decodes terminal input tokens manually', () => {
    const tokens = decodeInputTokens(
      Buffer.from(
        `${ARROWS.up}${ARROWS.down}${ARROWS.left}${ARROWS.right}bA\r p rq\u0003`,
      ),
    );

    assert.deepStrictEqual(tokens, {
      values: [
        'up',
        'down',
        'left',
        'right',
        'b',
        'a',
        'enter',
        'space',
        'p',
        'space',
        'r',
        'q',
        'ctrl-c',
      ],
      pendingInput: '',
    });
  });

  it('keeps partial escape sequences pending between chunks', () => {
    const first = decodeInputTokens('\u001b');
    const second = decodeInputTokens('[A', first.pendingInput);

    assert.deepStrictEqual(first, { values: [], pendingInput: '\u001b' });
    assert.deepStrictEqual(second, { values: ['up'], pendingInput: '' });
  });

  it('activates on Konami sequence, resets after wrong tokens, and ignores repeated activation', () => {
    const { controller, input } = createTerminalController();

    input.send(`${ARROWS.up}${ARROWS.up}${ARROWS.left}${ARROWS.down}${ARROWS.down}${ARROWS.left}${ARROWS.right}${ARROWS.left}${ARROWS.right}ba\r`);
    assert.strictEqual(controller.isActive(), false);

    input.send(konamiSequence());
    assert.strictEqual(controller.isActive(), true);
    assert.deepStrictEqual(input.rawModes, [true]);

    input.send(konamiSequence());
    assert.strictEqual(controller.isActive(), true);
    assert.deepStrictEqual(input.rawModes, [true]);

    controller.dispose();
  });

  it('creates a no-op controller for non-TTY streams', async () => {
    const nodeProcess = {
      stdin: { isTTY: false },
      stderr: { isTTY: true },
    } as unknown as NodeJS.Process;

    const controller = createAsteroidsBuildGame(nodeProcess);

    assert.strictEqual(controller.isActive(), false);
    await controller.showBuildStatus({
      kind: 'success',
      headline: 'Build succeeded',
      detail: 'done',
    });
    controller.suspendForBuildLog();
    controller.dispose();
  });

  it('restores raw mode and alternate screen on quit and dispose', () => {
    const { controller, input, output } = createTerminalController();

    input.send(konamiSequence());
    assert(output.output().includes(ENTER_ALT_SCREEN));

    input.send('q');
    assert.strictEqual(controller.isActive(), false);
    assert.deepStrictEqual(input.rawModes, [true, false]);
    assert(output.output().includes(EXIT_ALT_SCREEN));

    input.send(konamiSequence());
    controller.dispose();
    assert.deepStrictEqual(input.rawModes, [true, false, true, false]);
    assert.strictEqual(input.pauseCalls, 1);
  });

  it('restores terminal state and preserves interrupt behavior on Ctrl+C', () => {
    const signalInterrupt = mock.fn();
    const { controller, input } = createTerminalController({ signalInterrupt });

    input.send(konamiSequence());
    input.send('\u0003');

    assert.strictEqual(controller.isActive(), false);
    assert.deepStrictEqual(input.rawModes, [true, false]);
    assert.strictEqual(signalInterrupt.mock.callCount(), 1);
  });

  it('toggles pause with P after activation', () => {
    const { controller, input, output } = createTerminalController();

    input.send(konamiSequence());
    assert.strictEqual(controller.isPaused(), false);

    input.send('p');
    assert.strictEqual(controller.isPaused(), true);
    assert(output.chunks.at(-1)?.includes(';1H'));

    input.send('p');
    assert.strictEqual(controller.isPaused(), false);

    controller.dispose();
  });

  it('keeps arrow controls active briefly between terminal repeat events', () => {
    let now = 1_000;
    const { controller, input, output } = createTerminalController({
      now: () => now,
    });

    input.send(konamiSequence());
    output.chunks = [];

    input.send(ARROWS.left);
    const afterFirstPress = output.output();

    now += 50;
    input.send(ARROWS.down);
    const afterHeldControl = output.output();

    assert.notStrictEqual(afterHeldControl, afterFirstPress);

    now += 200;
    input.send(ARROWS.down);

    assert.strictEqual(output.output(), afterHeldControl);

    controller.dispose();
  });

  it('restarts with R after activation', () => {
    const { controller, input, output } = createTerminalController();

    input.send(konamiSequence());
    input.send('p');
    assert.strictEqual(controller.isPaused(), true);

    input.send('r');

    assert.strictEqual(controller.isPaused(), false);
    assert.match(output.output(), /R restarts/u);

    controller.dispose();
  });

  it('pauses for build status and resolves one-shot completion after P', async () => {
    const { controller, input, output } = createTerminalController();
    input.send(konamiSequence());

    let resolved = false;
    const wait = controller
      .showBuildStatus(
        {
          kind: 'success',
          headline: 'Build succeeded',
          detail: 'webpack completed successfully. Press P to resume.',
        },
        { waitForResume: true },
      )
      .then(() => {
        resolved = true;
      });

    await Promise.resolve();
    assert.strictEqual(controller.isPaused(), true);
    assert.strictEqual(resolved, false);
    assert.match(output.output(), /Build succeeded/u);

    input.send('r');
    await Promise.resolve();
    assert.strictEqual(resolved, false);
    assert.strictEqual(controller.isPaused(), true);
    assert.match(output.output(), /Build succeeded/u);

    input.send('p');
    await wait;
    assert.strictEqual(resolved, true);
    assert.strictEqual(controller.isPaused(), false);

    controller.dispose();
  });

  it('maps build status prompts from webpack stats', () => {
    assert.deepStrictEqual(getBuildStatusPrompt(undefined, getStats()), {
      kind: 'success',
      headline: 'Build succeeded',
      detail: 'test-compiler completed successfully in 15 ms. Press P to resume.',
    });

    assert.deepStrictEqual(
      getBuildStatusPrompt(undefined, getStats({ warnings: true })),
      {
        kind: 'warning',
        headline: 'Build completed with warnings',
        detail: 'test-compiler completed with warnings in 15 ms. Press P to resume.',
      },
    );

    assert.deepStrictEqual(
      getBuildStatusPrompt(undefined, getStats({ errors: true })),
      {
        kind: 'failure',
        headline: 'Build failed',
        detail: 'test-compiler failed in 15 ms. Press P to continue.',
      },
    );

    assert.deepStrictEqual(getBuildStatusPrompt(new Error('fatal')), {
      kind: 'failure',
      headline: 'Build failed',
      detail: 'webpack failed. Press P to continue.',
    });
  });

  it('renders ship and asteroids as multi-cell Unicode Braille art', () => {
    const game = createGame();
    game.state.ship.angle = Math.PI / 6;
    game.state.asteroids = [makeAsteroid({ id: 10, x: 25, y: 9, size: 3 })];

    const output = renderGameFrameRows(game, null).join('\n');
    const brailleCharacters = [...output].filter(
      (character) => character >= '\u2801' && character <= '\u28ff',
    );

    assert(
      brailleCharacters.length > 20,
      'expected high-resolution Braille output for rendered objects',
    );
  });
});

describe('./utils/asteroids/game.ts', () => {
  it('wraps the ship around screen edges', () => {
    const game = createGame();
    game.state.ship.x = 79;
    game.state.ship.y = 10;
    game.state.ship.vx = 3;
    game.state.ship.vy = 0;
    game.tick();

    assert(game.state.ship.x < 80);
    assert(game.state.ship.x < 5);
  });

  it('expires bullets after their lifetime', () => {
    const game = createGame();
    game.state.bullets = [
      { id: 20, x: 5, y: 5, vx: 0, vy: 0, ttl: 1 },
    ];
    game.tick();

    assert.strictEqual(game.state.bullets.length, 0);
  });

  it('keeps a single thrust tap modest', () => {
    const game = createGame();
    game.state.ship.angle = 0;

    game.thrust();

    assert(shipSpeed(game) <= 0.07);
  });

  it('caps repeated thrust speed', () => {
    const game = createGame();
    game.state.ship.angle = 0;

    for (let index = 0; index < 100; index++) {
      game.thrust();
    }

    assert(shipSpeed(game) <= 0.65);
  });

  it('splits larger asteroids when bullets hit', () => {
    const game = createGame();
    game.state.asteroids = [makeAsteroid({ id: 10, x: 20, y: 8, size: 3 })];
    game.state.bullets = [
      { id: 30, x: 20, y: 8, vx: 0, vy: 0, ttl: 10 },
    ];
    game.tick();

    assert.strictEqual(game.state.score, 300);
    assert.strictEqual(game.state.bullets.length, 0);
    assert.strictEqual(game.state.asteroids.length, 2);
    assert.deepStrictEqual(
      game.state.asteroids.map((asteroid) => asteroid.size),
      [2, 2],
    );
  });

  it('reduces lives and resets the ship on collision', () => {
    const game = createGame();
    const { ship } = game.state;
    ship.invulnerableTicks = 0;
    game.state.asteroids = [
      makeAsteroid({ id: 10, x: ship.x, y: ship.y, size: 3 }),
    ];
    game.tick();

    assert.strictEqual(game.state.ship.lives, 2);
    assert(game.state.ship.invulnerableTicks > 0);
  });

  it('advances levels after all asteroids are cleared', () => {
    const game = createGame();
    game.state.asteroids = [];
    game.tick();

    assert.strictEqual(game.state.level, 2);
    assert(game.state.asteroids.length > 0);
  });

  it('pauses when the terminal is too small', () => {
    const game = createGame();
    game.resize(30, 10);

    assert.strictEqual(game.state.tooSmall, true);
    assert.strictEqual(game.state.paused, true);
  });
});

function createTerminalController({
  frameIntervalMs = null,
  now = Date.now,
  signalInterrupt = mock.fn(),
}: {
  frameIntervalMs?: number | null;
  now?: () => number;
  signalInterrupt?: () => void;
} = {}) {
  const input = new FakeInput();
  const output = new FakeOutput();
  const controller = new TerminalAsteroidsController({
    stdin: input as unknown as ConstructorParameters<
      typeof TerminalAsteroidsController
    >[0]['stdin'],
    stderr: output as unknown as ConstructorParameters<
      typeof TerminalAsteroidsController
    >[0]['stderr'],
    frameIntervalMs,
    now,
    rng: () => 0.25,
    signalInterrupt,
  });

  return { controller, input, output };
}

function createGame() {
  const game = new AsteroidsGame({ width: 80, height: 20, rng: () => 0.25 });
  game.state.paused = false;
  game.state.ship.invulnerableTicks = 0;
  game.state.asteroids = [makeAsteroid({ id: 1, x: 5, y: 5, size: 3 })];
  return game;
}

function getStats({
  errors = false,
  warnings = false,
}: {
  errors?: boolean;
  warnings?: boolean;
} = {}) {
  return {
    startTime: 5,
    endTime: 20,
    hasErrors: () => errors,
    hasWarnings: () => warnings,
    compilation: {
      compiler: {
        name: 'test-compiler',
      },
    },
  } as unknown as Stats;
}

function konamiSequence() {
  return `${ARROWS.up}${ARROWS.up}${ARROWS.down}${ARROWS.down}${ARROWS.left}${ARROWS.right}${ARROWS.left}${ARROWS.right}ba\r`;
}

function makeAsteroid({
  id,
  x,
  y,
  size,
}: {
  id: number;
  x: number;
  y: number;
  size: 1 | 2 | 3;
}): Asteroid {
  return {
    id,
    x,
    y,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: getAsteroidRadius(size),
    size,
    spin: 0,
  };
}

function getAsteroidRadius(size: 1 | 2 | 3) {
  if (size === 3) {
    return 4;
  }
  if (size === 2) {
    return 2.5;
  }
  return 1.4;
}

function shipSpeed(game: AsteroidsGame) {
  return Math.hypot(game.state.ship.vx, game.state.ship.vy);
}
