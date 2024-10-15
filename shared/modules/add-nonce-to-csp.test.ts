import { addNonceToCsp } from './add-nonce-to-csp';

describe('addNonceToCsp', () => {
  it('empty string', () => {
    const input = '';
    const expected = '';
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('one empty directive', () => {
    const input = 'script-src';
    const expected = `script-src 'nonce-test'`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('one directive, one value', () => {
    const input = 'script-src default.example';
    const expected = `script-src default.example 'nonce-test'`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('one directive, two values', () => {
    const input = "script-src 'self' default.example";
    const expected = `script-src 'self' default.example 'nonce-test'`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('multiple directives', () => {
    const input =
      "default-src 'self'; script-src 'unsafe-eval' scripts.example; object-src; style-src styles.example";
    const expected = `default-src 'self'; script-src 'unsafe-eval' scripts.example 'nonce-test'; object-src; style-src styles.example`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('non-ASCII directives', () => {
    const input = 'script-src default.example;\u0080;style-src style.example';
    const expected = `script-src default.example 'nonce-test';\u0080;style-src style.example`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('uppercase directive names', () => {
    const input = 'SCRIPT-SRC DEFAULT.EXAMPLE';
    const expected = `SCRIPT-SRC DEFAULT.EXAMPLE 'nonce-test'`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('duplicate directive names', () => {
    const input =
      'default-src default.example; script-src script.example; script-src script.example';
    const expected = `default-src default.example; script-src script.example 'nonce-test'; script-src script.example`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('nonce value contains script-src', () => {
    const input =
      "default-src 'self' 'nonce-script-src'; script-src 'self' https://example.com";
    const expected = `default-src 'self' 'nonce-script-src'; script-src 'self' https://example.com 'nonce-test'`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });

  it('url value contains script-src', () => {
    const input =
      "default-src 'self' https://script-src.com; script-src 'self' https://example.com";
    const expected = `default-src 'self' https://script-src.com; script-src 'self' https://example.com 'nonce-test'`;
    const output = addNonceToCsp(input, 'test');
    expect(output).toBe(expected);
  });
});
