/* eslint-disable jsdoc/check-tag-names */
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
        `Tried to access a declared, but not defined environmental variable "${key}"
\tWhy am I seeing this: "${key}" is declared in builds.yml, but had no actual value when we tried loading it.
\tHow do I fix this: You could provide a default value for the variable in builds.yml under "env" property and commit to git. For example:
\t\tenv:
\t\t - ${key}: ''`,
      ),
    );
    return value;
  }

  /**
   * Returns a declared, but maybe not defined variable.
   *
   * @param {string} key - The name of the variable
   * @throws {TypeError} If there was no declaration of the variable.
   * @returns The value, or undefined if the variables wasn't defined.
   */
  getMaybe(key) {
    assert(
      this.isDeclared(key),
      new TypeError(
        `Tried to access an environmental variable "${key}" that wasn't declared in builds.yml
\tWhy am I seeing this: We've made use of new variables be explicit to keep track of all of them in one place
\tHow do I fix this: Adding your variable in builds.yml under "env" property and committing to git will fix this`,
      ),
    );
    return this.#definitions.get(key);
  }

  /**
   * Sets one key
   *
   * @overload
   * @param {string} key
   * @param {unknown} value
   * @returns {void}
   */
  /**
   * @overload
   * @param {Record<string, unknown>} records - Key-Value object
   * @returns {void}
   */
  /**
   * @param {string | Record<string, unknown>} keyOrRecord
   * @param {unknown} value
   * @returns {void}
   */
  set(keyOrRecord, value) {
    if (typeof keyOrRecord === 'object') {
      for (const [key, recordValue] of Object.entries(keyOrRecord)) {
        this.set(key, recordValue);
      }
      return;
    }
    const key = keyOrRecord;
    assert(
      this.isDeclared(key),
      `Tried to modify a variable "${key}" that wasn't declared in builds.yml`,
    );
    assert(value !== DeclaredOnly, `Tried to un-define "${key}" variable`);
    this.#definitions.set(key, value);
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

module.exports = { Variables };
