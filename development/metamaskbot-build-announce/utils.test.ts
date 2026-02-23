import { buildSectionWithFallback } from './utils';

describe('buildSectionWithFallback', () => {
  it('returns the builder result when it resolves with a string', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve('<p>ok</p>'),
      'Test section',
    );

    expect(result).toBe('<p>ok</p>');
  });

  it('returns fallback when builder resolves null', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(null),
      'Test section',
    );

    expect(result).toBe(
      '<p><i>Test section: data not available.</i></p>\n\n',
    );
  });

  it('returns fallback when builder resolves with undefined', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.resolve(undefined),
      'Test section',
    );

    expect(result).toBe(
      '<p><i>Test section: data not available.</i></p>\n\n',
    );
  });

  it('returns fallback when builder throws', async () => {
    const result = await buildSectionWithFallback(
      () => Promise.reject(new Error('error')),
      'Broken section',
    );

    expect(result).toBe(
      '<p><i>Broken section: data not available.</i></p>\n\n',
    );
  });
});
