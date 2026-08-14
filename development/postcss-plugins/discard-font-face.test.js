/**
 * @jest-environment node
 */
const postcss = require('postcss');
const { discardFontFace } = require('./discard-font-face');

/**
 * Run the plugin on `input` CSS and return the output CSS string.
 *
 * @param {string} input
 * @param {string[]} keepExtensions
 * @returns {Promise<string>}
 */
async function run(input, keepExtensions = ['woff2']) {
  const result = await postcss([discardFontFace(keepExtensions)]).process(
    input,
    { from: undefined },
  );
  return result.css;
}

describe('discard-font-face', () => {
  it('keeps woff2 sources and removes others', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: url("font.eot"), url("font.woff2") format("woff2"), url("font.woff") format("woff");
    }`;
    const output = await run(input);
    expect(output).toContain('url("font.woff2")');
    expect(output).not.toContain('font.eot');
    expect(output).not.toContain('font.woff") format("woff")');
  });

  it('removes entire @font-face rule when no sources match', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: url("font.eot"), url("font.ttf");
    }`;
    const output = await run(input);
    expect(output.trim()).toBe('');
  });

  it('preserves local() entries', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: local("Test"), url("font.woff2") format("woff2");
    }`;
    const output = await run(input);
    expect(output).toContain('local("Test")');
    expect(output).toContain('url("font.woff2")');
  });

  it('handles URLs with query strings and fragments', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: url("font.woff2?v=1#hash") format("woff2");
    }`;
    const output = await run(input);
    expect(output).toContain('font.woff2?v=1#hash');
  });

  it('handles URLs with spaces when quoted', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: url("my font.woff2") format("woff2");
    }`;
    const output = await run(input);
    expect(output).toContain('my font.woff2');
  });

  it('is case-insensitive for extensions', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: url("font.WOFF2") format("woff2");
    }`;
    const output = await run(input);
    expect(output).toContain('font.WOFF2');
  });

  it('leaves non-font-face rules untouched', async () => {
    const input = `body { color: red; }`;
    const output = await run(input);
    expect(output).toBe(input);
  });

  it('supports multiple keepExtensions', async () => {
    const input = `@font-face {
      font-family: "Test";
      src: url("font.eot"), url("font.woff2"), url("font.woff");
    }`;
    const output = await run(input, ['woff2', 'woff']);
    expect(output).toContain('font.woff2');
    expect(output).toContain('font.woff');
    expect(output).not.toContain('font.eot');
  });
});
