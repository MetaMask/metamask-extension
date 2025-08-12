const json = require('./test-extension-mv3/test-state.json');

const size = JSON.stringify(json).length * 2;
/* ───────────────────────────────────────────────────────────────────────────*\
  Fast upper‑bound‑aware JSON length calculator for browsers / Node
  – spec‑accurate to `JSON.stringify`
  – bails out immediately once `maxLength` is met / exceeded
  – allocation‑free on typical inputs, GC‑light elsewhere
\*───────────────────────────────────────────────────────────────────────────*/

// ── 1.  ASCII escape‑length LUT (fits in L1) ───────────────────────────────
const ESC_LEN = new Uint8Array(0x80); // 0x00–0x7F
ESC_LEN.fill(1); // printable default

// control chars default to \u00XX  (6 chars) …
for (let i = 0; i < 0x20; ++i) {
  ESC_LEN[i] = 6;
}

// … except the five that have short escapes
ESC_LEN[8] = 2;
/* \b */ ESC_LEN[9] = 2; /* \t */
ESC_LEN[10] = 2;
/* \n */ ESC_LEN[12] = 2; /* \f */
ESC_LEN[13] = 2; /* \r */

// quotes & back‑slash
ESC_LEN[34] = ESC_LEN[92] = 2; // " and \

// ── 2.  String‑length helpers ─────────────────────────────────────────────
/**
 * Exact JSON‑escaped length of `s` (incl. surrounding quotes).
 *
 * @param s
 */
function strLen(s: string): number {
  let n = 2; // the quotes
  for (let i = 0; i < s.length; ) {
    const c = s.charCodeAt(i++);
    if (c < 0x80) {
      n += ESC_LEN[c];
    } else {
      // \u2028 / \u2029 have to be escaped
      n += c === 0x2028 || c === 0x2029 ? 6 : 1;
    }
  }
  return n;
}

/**
 * Same as `strLen` but stops once `cap` is reached.
 *
 * @param s
 * @param cap
 */
function strLenCapped(s: string, cap: number): number {
  let n = 2;
  for (let i = 0; i < s.length && n < cap; ) {
    const c = s.charCodeAt(i++);
    if (c < 0x80) {
      n += ESC_LEN[c];
    } else {
      n += c === 0x2028 || c === 0x2029 ? 6 : 1;
    }
  }
  return n >= cap ? cap : n;
}

// ── 3.  Numeric length helper ─────────────────────────────────────────────
const NULL_LEN = 4; // "null"

/**
 * Character count of `n` as JSON (NaN / ±∞ → 4).
 *
 * @param n
 */
function numLen(n: number): number {
  if (!Number.isFinite(n)) {
    return NULL_LEN;
  }

  // hot path for single‑digit integers (0–9 / −1…−9)
  if ((n | 0) === n && n > -10 && n < 10) {
    return n < 0 ? 2 : 1;
  }
  // most engines cache the result of String(n) for numbers
  return String(n).length;
}

// ── 4.  Fast key‑length memoisation (bounded) ─────────────────────────────
const MAX_CACHE_KEYS = 2048;
const keyCache = new Map<string, number>();

function cachedKeyLen(k: string): number {
  let len = keyCache.get(k);
  if (len === undefined) {
    len = strLen(k);
    if (keyCache.size >= MAX_CACHE_KEYS) {
      keyCache.clear();
    }
    keyCache.set(k, len);
  }
  return len;
}

// ── 5.  Public API ────────────────────────────────────────────────────────
const EARLY_EXIT: unique symbol = Symbol('EARLY_EXIT');

/**
 * Exact `JSON.stringify(obj).length`, but never greater than `maxLength`.
 * Once the running total meets / exceeds `maxLength`, the function returns
 * immediately with that cap.
 *
 * @param obj
 * @param maxLength
 */
export function jsonLength(obj: unknown, maxLength: number): number {
  let total = 0;

  // tight adder that throws once the cap is met
  const add = (n: number): void => {
    if ((total += n) >= maxLength) {
      throw EARLY_EXIT;
    }
  };

  let seen: WeakSet<object> | undefined; // created lazily

  const walk = (value: any): void => {
    switch (typeof value) {
      case 'string':
        add(strLenCapped(value, maxLength - total));
        return;

      case 'number':
        add(numLen(value));
        return;

      case 'boolean':
        add(value ? 4 : 5); // "true" / "false"
        return;

      case 'bigint':
        // Mirrors native behaviour (throws)
        throw new TypeError('Do not know how to serialize a BigInt');

      case 'object':
        if (value === null) {
          add(NULL_LEN);
          return;
        }

        // honour toJSON transforms
        if (typeof value.toJSON === 'function') {
          walk(value.toJSON());
          return;
        }

        // cycle detection
        if (seen?.has(value)) {
          throw new TypeError('Circular reference');
        }
        (seen ??= new WeakSet()).add(value);

        if (Array.isArray(value)) {
          add(1); // '['
          for (let i = 0; i < value.length; ++i) {
            // undefined / function / symbol in arrays → null (per spec)
            const elem = value[i];
            walk(
              elem === undefined ||
                typeof elem === 'function' ||
                typeof elem === 'symbol'
                ? null
                : elem,
            );
            if (i + 1 !== value.length) {
              add(1);
            } // ','
          }
          add(1); // ']'
        } else {
          add(1); // '{'
          let emitted = 0;
          for (const k in value) {
            if (!Object.prototype.hasOwnProperty.call(value, k)) {
              continue;
            }
            const v = value[k];
            if (
              v === undefined ||
              typeof v === 'function' ||
              typeof v === 'symbol'
            ) {
              continue; // omitted by JSON.stringify
            }
            if (emitted++) {
              add(1);
            } // ','
            add(cachedKeyLen(k)); // "key"
            add(1); // ':'
            walk(v);
          }
          add(1); // '}'
        }

      // undefined / function / symbol at top level → ignored
      default:
    }
  };

  try {
    walk(obj);
    return total;
  } catch (e) {
    if (e === EARLY_EXIT) {
      return maxLength;
    }
    throw e; // real error (BigInt, circular, etc.)
  }
}

console.time('JSON.stringify');
const m = jsonLength(json, size);
console.timeEnd('JSON.stringify');

console.log(m, JSON.stringify(json).length);
