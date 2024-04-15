import { assertInAnyOrder } from './helpers';

describe('assertInAnyOrder()', () => {
  it('returns true when all requests pass unique assertions', () => {
    const requests = ['req1', 'req2', 'req3'];
    const assertions = [
      [(req) => req === 'req1'],
      [(req) => req === 'req2'],
      [(req) => req === 'req3'],
    ];
    expect(assertInAnyOrder(requests, assertions)).toBe(true);
  });

  it('returns true when all requests pass unique assertions independently of the order', () => {
    const requests = ['req1', 'req2', 'req3'];
    const assertions = [
      [(req) => req === 'req3'],
      [(req) => req === 'req2'],
      [(req) => req === 'req1'],
    ];
    expect(assertInAnyOrder(requests, assertions)).toBe(true);
  });

  it('returns false when a request cannot pass any assertions', () => {
    const requests = ['req1', 'req2', 'unknown'];
    const assertions = [
      [(req) => req === 'req1'],
      [(req) => req === 'req2'],
      [(req) => req === 'req3'],
    ];
    expect(assertInAnyOrder(requests, assertions)).toBe(false);
  });

  it('returns false when there are unused assertions', () => {
    const requests = ['req1', 'req2'];
    const assertions = [
      [(req) => req === 'req1'],
      [(req) => req === 'req2'],
      [(req) => req === 'req3'],
    ];
    expect(assertInAnyOrder(requests, assertions)).toBe(false);
  });

  it('returns false when there are unused requests', () => {
    const requests = ['req1', 'req2', 'req3', 'req4'];
    const assertions = [
      [(req) => req === 'req1'],
      [(req) => req === 'req2'],
      [(req) => req === 'req3'],
    ];
    expect(assertInAnyOrder(requests, assertions)).toBe(false);
  });
});
