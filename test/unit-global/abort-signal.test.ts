import { describe, it, expect } from '@jest/globals';

describe('test environment cancellation', () => {
  it('preserves the abort reason when checking cancelled work', () => {
    const controller = new AbortController();
    const reason = new Error('Operation cancelled');

    expect(() => controller.signal.throwIfAborted()).not.toThrow();
    controller.abort(reason);

    expect(controller.signal.reason).toBe(reason);
    expect(() => controller.signal.throwIfAborted()).toThrow(reason);
  });
});
