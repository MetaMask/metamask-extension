import { sanitizeErrorMessage } from './sanitize-error-message';

describe('sanitizeErrorMessage', () => {
  it('normalizes whitespace and trims the message', () => {
    expect(sanitizeErrorMessage('  failed\nwith   whitespace\taround ')).toBe(
      'failed with whitespace around',
    );
  });

  it('returns short messages unchanged apart from whitespace', () => {
    expect(sanitizeErrorMessage('boom')).toBe('boom');
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(sanitizeErrorMessage('   \n\t ')).toBe('');
  });

  it('truncates messages above the cap with an ellipsis', () => {
    const long = 'x'.repeat(600);
    const result = sanitizeErrorMessage(long);
    expect(result).toHaveLength(501);
    expect(result.startsWith('x'.repeat(500))).toBe(true);
    expect(result.endsWith('…')).toBe(true);
  });

  it('keeps messages at exactly the cap intact', () => {
    const exact = 'y'.repeat(500);
    expect(sanitizeErrorMessage(exact)).toBe(exact);
  });

  it('caps the message after whitespace normalization shrinks it', () => {
    const message = `${'a '.repeat(300)}${'x'.repeat(400)}`;
    const result = sanitizeErrorMessage(message);
    expect(result).toHaveLength(501);
    expect(result.endsWith('…')).toBe(true);
  });
});
