import { sha256 } from './hash.utils';

describe('sha256', () => {
  it('returns the expected hash', async () => {
    const input = 'dummy value';
    const expectedHash =
      '2675b5d5f3452d201d6820d44f93c5e170207a7e71e9d9e2b1a93b47d7dd7438';

    const actualHash = await sha256(input);

    expect(actualHash).toBe(expectedHash);
  });
});
