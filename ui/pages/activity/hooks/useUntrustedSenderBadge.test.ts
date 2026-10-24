import { isUntrustedSender } from './useUntrustedSenderBadge';
import { normalizeKnownAddress } from '#ui/selectors/known-addresses';

const ethFrom = '0x6431726EEE67570BF6f0Cf892aE0a3988F03903F';
const solFrom = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV';

const buildReceive = (from: string) =>
  ({
    type: 'receive',
    status: 'success',
    chainId: 'solana:mainnet',
    timestamp: 1,
    hash: 'sig',
    data: { from, to: solFrom },
  }) as Parameters<typeof isUntrustedSender>[0];

describe('isUntrustedSender', () => {
  it('does not flag a known Solana sender', () => {
    const known = new Set([normalizeKnownAddress(solFrom)!]);

    expect(isUntrustedSender(buildReceive(solFrom), known)).toBe(false);
  });

  it('flags an unknown Solana sender', () => {
    const known = new Set<string>();

    expect(
      isUntrustedSender(
        buildReceive('DpNXPNWvWoHaZ9P3WtfGCb2ZdLihW8VW1w1Ph4KDH9iG'),
        known,
      ),
    ).toBe(true);
  });

  it('matches EVM senders case-insensitively', () => {
    const known = new Set([normalizeKnownAddress(ethFrom)!]);
    const activity = {
      type: 'receive',
      status: 'success',
      chainId: 'eip155:1',
      timestamp: 1,
      hash: '0xabc',
      data: {
        from: ethFrom.toLowerCase(),
        to: '0x2222222222222222222222222222222222222222',
      },
    } as Parameters<typeof isUntrustedSender>[0];

    expect(isUntrustedSender(activity, known)).toBe(false);
  });
});
