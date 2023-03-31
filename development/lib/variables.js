const assert = require('assert');

const DeclaredOnly = Symbol(
  'This variable was declared only without being defined',
);

class Variables {
  /**
   * @type {Map<string, unknown | typeof DeclaredOnly>}
   */
  #definitions = new Map();

  /**
   * @param {Iterable<string>} declarations
   */
  constructor(declarations) {
    for (const declaration of declarations) {
      this.#definitions.set(declaration, DeclaredOnly);
    }
  }

  /**
   * @param {string} key - The name of the variable
   * @throws {TypeError} If there is no definition of a variable.
   */
  get(key) {
    const value = this.getMaybe(key);
    assert(
      value !== DeclaredOnly,
      new TypeError(
        `Tried to access a declared, but not defined environmental variable "${key}"`,
      ),
    );
    return value;
  }

  getMaybe(key) {
    assert(
      this.isDeclared(key),
      new TypeError(
        `Tried to access an environmental variable "${key}" that wasn't declared in builds.yml`,
      ),
    );
    return this.#definitions.get(key);
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  set(key, value) {
    assert(
      this.isDeclared(key),
      `Tried to modify a variable "${key}" that wasn't declared in builds.yml`,
    );
    assert(value !== DeclaredOnly, `Tried to un-define "${key}" variable`);
    this.#definitions.set(key, value);
  }

  /**
   *
   * @param {Record<string, unknown>} definitions
   */
  setMany(definitions) {
    Object.entries(definitions).forEach(([key, value]) => this.set(key, value));
  }

  isDeclared(key) {
    return this.#definitions.has(key);
  }

  isDefined(key) {
    return (
      this.#definitions.has(key) && this.#definitions.get(key) !== DeclaredOnly
    );
  }

  [Symbol.iterator] = this.declarations;

  *declarations() {
    yield* this.#definitions.keys();
  }

  *definitions() {
    for (const [key, value] of this.#definitions.entries()) {
      if (value !== DeclaredOnly) {
        yield [key, value];
      }
    }
  }
}

module.exports = { Variables, DeclaredOnly };
