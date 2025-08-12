/* digit_bench.js  ──────────────────────────────────────────
   Benchmarks incremental digit → int32 conversion variants.
   Node ≥14 recommended (needs perf_hooks.performance).
   --------------------------------------------------------- */

"use strict";
const { performance } = require("perf_hooks");

const TEST       = (Math.random() * 1_000_000).toString().slice(0, 6);             // 6-digit sample
const EXPECTED   = parseInt(TEST, 10);               // parseInt(TEST, 10)
const ITERATIONS = 1_000_000_00;            // × TEST.length digit pushes

const digits = [...TEST];                // array of characters

function bench(name, fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  console.log(
    `${name.padEnd(10)} ${(t1 - t0).toFixed(1).padStart(8)} ms`
  );
  if (result !== EXPECTED) {
    console.error(`   ✘ wrong result: ${result}`);
  }
}

/* ───── variant 1: multiply-by-10 (double accumulator) ─── */
function mul10() {
  let last = 0;
  for (let n = 0; n < ITERATIONS; ++n) {
    let v = 0;
    for (let i = 0; i < digits.length; ++i) {
      const digit = digits[i].charCodeAt(0) ^ 48;
      v = v * 10 + digit;
    }
    last = v | 0;              // cast once per number
  }
  return last;
}

/* ───── variant 2: multiply-by-10 with “|0” every step ─── */
function mul10_or0() {
  let last = 0;
  for (let n = 0; n < ITERATIONS; ++n) {
    let v = 0;
    for (let i = 0; i < digits.length; ++i) {
      const digit = digits[i].charCodeAt(0) ^ 48;
      v = (v * 10 + digit) | 0;   // keep as int32 each round
    }
    last = v;
  }
  return last;
}

/* ───── variant 3: shift-add multiply-by-10 ────────────── */
function shift_mul10() {
  let last = 0;
  for (let n = 0; n < ITERATIONS; ++n) {
    let v = 0;
    for (let i = 0; i < digits.length; ++i) {
      const digit = digits[i].charCodeAt(0) ^ 48;
      v = ((v << 3) + (v << 1) + digit) | 0;  // (v*8 + v*2) | 0
    }
    last = v;
  }
  return last;
}

/* ───── variant 4: naive string + parseInt ─────────────── */
function naive_parseInt() {
  let last = 0;
  for (let n = 0; n < ITERATIONS; ++n) {
    // let s = "";
    // for (let i = 0; i < digits.length; ++i) {
    //   s += digits[i];           // build string as chars arrive
    // }
    last = parseInt(TEST, 10) | 0;
  }
  return last;
}

/* ───── run the benchmarks ─────────────────────────────── */
console.log(
  `Processing “${TEST}” (${digits.length} digits) × ${ITERATIONS} …`
);
bench("mult10|0",     mul10_or0);
bench("mult10",       mul10);
bench("shift",        shift_mul10);
bench("parseInt",     naive_parseInt);
