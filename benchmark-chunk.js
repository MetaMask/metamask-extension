(async function () {
/**
 * Benchmark three JSON‑chunking strategies.
 *
 *   1) stringify‑then‑split
 *   2) fully streaming stringify that emits chunks as it walks     (no circular‑ref handling)
 *   3) walk only to reach the first size limit, then bail out to
 *      normal JSON.stringify and split (hybrid)
 *
 * Usage:
 *   node benchmark-chunk.js [chunkSize] [iterations]
 *   defaults: chunkSize = 16 384 bytes (16 KiB), iterations = 10
 *
 * Requirements:
 *   • Node ≥ 18 (for perf_hooks / fs promises is fine on older too)
 *   • test-state.json in the same folder
 */

// ────────────────────────────────────────────────────────────
// CLI args
// ────────────────────────────────────────────────────────────
const CHUNK_SIZE = 64000000;
const ITER       = 10;

// test data
// `fetch` our JSON
const res  = await fetch('./test-extension-mv3/test-state.json');
const _raw = await res.text();
const raw = `[${_raw},${_raw},${_raw}]`;
const data = JSON.parse(raw);
console.log(raw.length);

// ────────────────────────────────────────────────────────────
// variant #1 – JSON.stringify ‑> naive split
// ────────────────────────────────────────────────────────────
function v1_stringifySplit(obj, size) {
  const str = JSON.stringify(obj);
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

// ────────────────────────────────────────────────────────────
// variant #2 – fully streaming stringify & chunk in user land
//                »walk, count, emit«
// (fairly minimal: no circular refs, same key order as normal
//  stringify; uses JSON.stringify only for primitives/keys)
// ────────────────────────────────────────────────────────────
function v2_streaming(obj, size) {
  const chunks = [];
  let current  = '';

  const flush = () => { if (current) { chunks.push(current); current=''; } };

  const append = (s) => {
    while (s) {
      const room = size - current.length;
      if (s.length <= room) { current += s; s = ''; }
      else {
        current += s.slice(0, room);
        chunks.push(current);           // filled chunk
        current = '';
        s = s.slice(room);
      }
    }
  };

  // iterative DFS to avoid recursion depth limits
  const stack = [{ type: 'value', value: obj }];

  while (stack.length) {
    const frame = stack.pop();

    if (frame.type === 'symbol' || frame.type === 'raw') {
      append(frame.value);
      continue;
    }

    const v = frame.value;
    if (v === null || typeof v !== 'object') {          // primitive
      append(JSON.stringify(v));
    } else if (Array.isArray(v)) {                      // array
      append('[');
      if (v.length === 0) { append(']'); continue; }
      stack.push({ type:'symbol', value:']' });
      for (let i = v.length - 1; i >= 0; --i) {
        if (i < v.length - 1) stack.push({ type:'symbol', value:',' });
        stack.push({ type:'value', value:v[i] });
      }
    } else {                                            // object
      append('{');
      const keys = Object.keys(v);
      if (keys.length === 0) { append('}'); continue; }
      stack.push({ type:'symbol', value:'}' });
      for (let i = keys.length - 1; i >= 0; --i) {
        if (i < keys.length - 1) stack.push({ type:'symbol', value:',' });
        const k = keys[i];
        stack.push({ type:'value', value:v[k] });
        stack.push({ type:'symbol', value:':' });
        stack.push({ type:'raw',   value:JSON.stringify(k) });
      }
    }
  }

  flush();
  return chunks;
}

// ────────────────────────────────────────────────────────────
// variant #3 – walk until the first chunk‑size threshold is
//              reached, then bail out to v1 for the remainder
// ────────────────────────────────────────────────────────────
function v3_bailThenStringify(obj, size) {
  let counted = 0;
  const stk   = [obj];

  while (stk.length && counted < size) {
    const v = stk.pop();
    if (v === null || typeof v !== 'object') {
      counted += JSON.stringify(v).length;
    } else if (Array.isArray(v)) {
      counted += 2;                       // '[' + ']'
      for (let i = v.length - 1; i >= 0; --i) {
        if (i < v.length - 1) counted += 1;   // ','
        stk.push(v[i]);
      }
    } else {
      const keys = Object.keys(v);
      counted += 2;                       // '{' + '}'
      for (let i = keys.length - 1; i >= 0; --i) {
        if (i < keys.length - 1) counted += 1;   // ','
        counted += JSON.stringify(keys[i]).length + 1; // "key":
        stk.push(v[keys[i]]);
      }
    }
  }

  // fall back to plain stringify‑split
  return v1_stringifySplit(obj, size);
}

// ────────────────────────────────────────────────────────────
// micro‑bench helper
// ────────────────────────────────────────────────────────────
function bench(fn, label) {
  let totalMs = 0, chunks = 0;
  for (let i = 0; i < ITER; ++i) {
    const t0 = performance.now();
    const out = fn(data, CHUNK_SIZE);
    totalMs  += performance.now() - t0;
    chunks    = out.length;               // identical every pass
  }
  return { label, avgMs: (totalMs / ITER).toFixed(3), chunks };
}

// run
console.log(`\nChunk size: ${CHUNK_SIZE} bytes, iterations: ${ITER}`);
console.table([
  bench(v1_stringifySplit,     'Stringify → split'),
  bench(v2_streaming,          'Streaming stringify'),
  bench(v3_bailThenStringify,  'Walk‑then‑bail → split')
]);

})();