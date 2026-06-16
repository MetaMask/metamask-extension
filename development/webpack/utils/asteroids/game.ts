export type AsteroidSize = 1 | 2 | 3;

export type Asteroid = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  size: AsteroidSize;
  spin: number;
};

export type Bullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
};

export type Ship = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  lives: number;
  invulnerableTicks: number;
};

export type AsteroidsGameState = {
  width: number;
  height: number;
  level: number;
  score: number;
  paused: boolean;
  gameOver: boolean;
  tooSmall: boolean;
  nextId: number;
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
};

type AsteroidsGameOptions = {
  width: number;
  height: number;
  rng?: () => number;
};

const ASTEROID_RADII = {
  1: 1.4,
  2: 2.5,
  3: 4,
} as const satisfies Record<AsteroidSize, number>;

const BULLET_TTL = 44;
const BULLET_SPEED = 1.25;
const DRAG = 0.985;
const INVULNERABLE_TICKS = 40;
const MAX_SHIP_SPEED = 0.65;
const MIN_HEIGHT = 16;
const MIN_WIDTH = 40;
const ROTATION_STEP = Math.PI / 24;
const SHIP_RADIUS = 1.4;
const THRUST = 0.065;

/**
 * Pure terminal Asteroids game state. Rendering and input live elsewhere so
 * build tests can exercise the rules without real terminal IO.
 */
export class AsteroidsGame {
  readonly state: AsteroidsGameState;

  #rng: () => number;

  constructor({ width, height, rng = Math.random }: AsteroidsGameOptions) {
    this.#rng = rng;
    this.state = {
      width,
      height,
      level: 1,
      score: 0,
      paused: true,
      gameOver: false,
      tooSmall: !isLargeEnough(width, height),
      nextId: 1,
      ship: createShip(width, height),
      bullets: [],
      asteroids: [],
    };
    this.#spawnLevel();
  }

  resize(width: number, height: number) {
    this.state.width = Math.max(1, width);
    this.state.height = Math.max(1, height);
    this.state.tooSmall = !isLargeEnough(this.state.width, this.state.height);
    this.#wrapShip();
    for (const bullet of this.state.bullets) {
      wrapPosition(bullet, this.state.width, this.state.height);
    }
    for (const asteroid of this.state.asteroids) {
      wrapPosition(asteroid, this.state.width, this.state.height);
    }
    if (this.state.tooSmall) {
      this.state.paused = true;
    }
  }

  setPaused(paused: boolean) {
    this.state.paused = paused || this.state.tooSmall || this.state.gameOver;
  }

  togglePaused() {
    this.setPaused(!this.state.paused);
  }

  rotateLeft() {
    if (this.#canAct()) {
      this.state.ship.angle -= ROTATION_STEP;
    }
  }

  rotateRight() {
    if (this.#canAct()) {
      this.state.ship.angle += ROTATION_STEP;
    }
  }

  thrust() {
    if (!this.#canAct()) {
      return;
    }

    this.state.ship.vx += Math.cos(this.state.ship.angle) * THRUST;
    this.state.ship.vy += Math.sin(this.state.ship.angle) * THRUST;
    this.#capShipSpeed();
  }

  fire() {
    if (!this.#canAct()) {
      return;
    }

    const {ship} = this.state;
    this.state.bullets.push({
      id: this.#nextId(),
      x: ship.x + Math.cos(ship.angle) * 2,
      y: ship.y + Math.sin(ship.angle) * 2,
      vx: ship.vx + Math.cos(ship.angle) * BULLET_SPEED,
      vy: ship.vy + Math.sin(ship.angle) * BULLET_SPEED,
      ttl: BULLET_TTL,
    });
  }

  tick() {
    if (this.state.paused || this.state.tooSmall || this.state.gameOver) {
      return;
    }

    this.#moveShip();
    this.#moveBullets();
    this.#moveAsteroids();
    this.#handleBulletHits();
    this.#handleShipHits();
    this.#advanceIfCleared();
  }

  #advanceIfCleared() {
    if (this.state.asteroids.length > 0 || this.state.gameOver) {
      return;
    }

    this.state.level += 1;
    this.#resetShip();
    this.#spawnLevel();
  }

  #canAct() {
    return !this.state.paused && !this.state.tooSmall && !this.state.gameOver;
  }

  #capShipSpeed() {
    const { ship } = this.state;
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed <= MAX_SHIP_SPEED) {
      return;
    }

    const scale = MAX_SHIP_SPEED / speed;
    ship.vx *= scale;
    ship.vy *= scale;
  }

  #handleBulletHits() {
    const survivingBullets: Bullet[] = [];
    const destroyedAsteroids = new Set<number>();

    for (const bullet of this.state.bullets) {
      let hitAsteroid: Asteroid | undefined;
      for (const asteroid of this.state.asteroids) {
        if (destroyedAsteroids.has(asteroid.id)) {
          continue;
        }
        if (distance(bullet, asteroid) <= asteroid.radius) {
          hitAsteroid = asteroid;
          break;
        }
      }

      if (!hitAsteroid) {
        survivingBullets.push(bullet);
        continue;
      }

      destroyedAsteroids.add(hitAsteroid.id);
      this.state.score += hitAsteroid.size * 100;
      this.#splitAsteroid(hitAsteroid);
    }

    this.state.bullets = survivingBullets;
    if (destroyedAsteroids.size > 0) {
      this.state.asteroids = this.state.asteroids.filter(
        (asteroid) => !destroyedAsteroids.has(asteroid.id),
      );
    }
  }

  #handleShipHits() {
    const {ship} = this.state;
    if (ship.invulnerableTicks > 0) {
      return;
    }

    const hit = this.state.asteroids.some(
      (asteroid) => distance(ship, asteroid) <= asteroid.radius + SHIP_RADIUS,
    );
    if (!hit) {
      return;
    }

    ship.lives -= 1;
    if (ship.lives <= 0) {
      this.state.gameOver = true;
      this.state.paused = true;
      return;
    }

    this.#resetShip();
  }

  #moveAsteroids() {
    for (const asteroid of this.state.asteroids) {
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;
      asteroid.angle += asteroid.spin;
      wrapPosition(asteroid, this.state.width, this.state.height);
    }
  }

  #moveBullets() {
    const bullets: Bullet[] = [];
    for (const bullet of this.state.bullets) {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.ttl -= 1;
      wrapPosition(bullet, this.state.width, this.state.height);
      if (bullet.ttl > 0) {
        bullets.push(bullet);
      }
    }
    this.state.bullets = bullets;
  }

  #moveShip() {
    const {ship} = this.state;
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= DRAG;
    ship.vy *= DRAG;
    if (ship.invulnerableTicks > 0) {
      ship.invulnerableTicks -= 1;
    }
    this.#wrapShip();
  }

  #nextId() {
    const id = this.state.nextId;
    this.state.nextId += 1;
    return id;
  }

  #resetShip() {
    const {lives} = this.state.ship;
    this.state.ship = createShip(this.state.width, this.state.height);
    this.state.ship.lives = lives;
    this.state.ship.invulnerableTicks = INVULNERABLE_TICKS;
  }

  #spawnLevel() {
    const count = Math.min(8, this.state.level + 3);
    for (let index = 0; index < count; index++) {
      this.state.asteroids.push(this.#createAsteroid(3));
    }
  }

  #splitAsteroid(asteroid: Asteroid) {
    if (asteroid.size === 1) {
      return;
    }

    const nextSize = (asteroid.size - 1) as AsteroidSize;
    const speed = Math.max(0.18, Math.hypot(asteroid.vx, asteroid.vy));
    for (const direction of [-1, 1]) {
      const angle = Math.atan2(asteroid.vy, asteroid.vx) + direction * 0.9;
      this.state.asteroids.push({
        id: this.#nextId(),
        x: asteroid.x,
        y: asteroid.y,
        angle: asteroid.angle + direction * 0.45,
        vx: Math.cos(angle) * (speed + 0.12),
        vy: Math.sin(angle) * (speed + 0.12),
        radius: ASTEROID_RADII[nextSize],
        size: nextSize,
        spin: -asteroid.spin + direction * 0.015,
      });
    }
  }

  #createAsteroid(size: AsteroidSize): Asteroid {
    const side = Math.floor(this.#rng() * 4);
    const x = this.#getAsteroidX(side);
    const y = this.#getAsteroidY(side);
    const angle = this.#rng() * Math.PI * 2;
    const speed = 0.12 + this.#rng() * 0.28 + this.state.level * 0.015;

    return {
      id: this.#nextId(),
      x,
      y,
      angle: this.#rng() * Math.PI * 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: ASTEROID_RADII[size],
      size,
      spin: (this.#rng() - 0.5) * 0.04,
    };
  }

  #getAsteroidX(side: number) {
    if (side === 0) {
      return 1;
    }
    if (side === 1) {
      return this.state.width - 2;
    }
    return this.#rng() * this.state.width;
  }

  #getAsteroidY(side: number) {
    if (side === 2) {
      return 1;
    }
    if (side === 3) {
      return this.state.height - 2;
    }
    return this.#rng() * this.state.height;
  }

  #wrapShip() {
    wrapPosition(this.state.ship, this.state.width, this.state.height);
  }
}

export function isLargeEnough(width: number, height: number) {
  return width >= MIN_WIDTH && height >= MIN_HEIGHT;
}

export function wrapPosition(
  entity: { x: number; y: number },
  width: number,
  height: number,
) {
  entity.x = wrap(entity.x, width);
  entity.y = wrap(entity.y, height);
}

function createShip(width: number, height: number): Ship {
  return {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    lives: 3,
    invulnerableTicks: INVULNERABLE_TICKS,
  };
}

function distance(
  first: { x: number; y: number },
  second: { x: number; y: number },
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function wrap(value: number, size: number) {
  return ((value % size) + size) % size;
}
