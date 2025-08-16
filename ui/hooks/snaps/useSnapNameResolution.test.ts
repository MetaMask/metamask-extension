import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import baseMockState from '../../../test/data/mock-state.json';
import { useSnapNameResolution } from './useSnapNameResolution';

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  handleSnapRequest: jest
    .fn()
    .mockImplementation(async ({ snapId, request }) => {
      if (
        snapId === 'npm:@metamask/solana-snap' &&
        request.params.domain.includes('metamask')
      ) {
        return {
          resolvedAddresses: [
            {
              resolvedAddress: '7XGrbd3dmdesSR5vAu7siidiZ1YHyizzuPCQAnh2g2Lo',
              protocol: 'SNS',
              domainName: 'metamask.sol',
            },
          ],
        };
      }

      if (
        snapId === 'npm:@metamask/ens-resolver-snap' &&
        request.params.domain.includes('metamask')
      ) {
        return {
          resolvedAddresses: [
            {
              resolvedAddress: '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb',
              protocol: 'ENS',
              domainName: 'metamask.eth',
            },
          ],
        };
      }

      if (
        snapId === 'npm:social-names-snap' &&
        request.params.domain.endsWith('.lens')
      ) {
        return {
          resolvedAddresses: [
            {
              resolvedAddress: '0x0000000000000000000000000000000000000000',
              protocol: 'Lens',
              domainName: 'foo.lens',
            },
          ],
        };
      }

      if (
        snapId === 'npm:social-names-snap' &&
        request.params.domain.startsWith('farcaster:')
      ) {
        return {
          resolvedAddresses: [
            {
              resolvedAddress: '0x0000000000000000000000000000000000000000',
              protocol: 'Farcaster',
              domainName: 'farcaster:v',
            },
          ],
        };
      }

      return null;
    }),
}));

const mockState = {
  ...baseMockState,
  metamask: {
    ...baseMockState.metamask,
    snaps: {
      'npm:@metamask/ens-resolver-snap': {
        id: 'npm:@metamask/ens-resolver-snap',
        enabled: true,
        version: '1.0.0',
      },
      'npm:@metamask/solana-snap': {
        id: 'npm:@metamask/solana-snap',
        enabled: true,
        version: '1.0.0',
      },
      'npm:social-names-snap': {
        id: 'npm:social-names-snap',
        enabled: true,
        version: '1.0.0',
      },
    },
    subjects: {
      'npm:@metamask/ens-resolver-snap': {
        origin: 'npm:@metamask/ens-resolver-snap',
        permissions: {
          'endowment:name-lookup': {
            caveats: null,
            date: 1718117256761,
            id: 'MhjpHKQFfGpMzI6YzkPGU',
            invoker: 'npm:@metamask/ens-resolver-snap',
            parentCapability: 'endowment:name-lookup',
          },
        },
      },
      'npm:@metamask/solana-snap': {
        origin: 'npm:@metamask/solana-snap',
        permissions: {
          'endowment:name-lookup': {
            caveats: [
              {
                type: 'chainIds',
                value: [
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
                ],
              },
            ],
            date: 1718117256761,
            id: 'MhjpHKQFfGpMzI6YzkPGA',
            invoker: 'npm:@metamask/solana-snap',
            parentCapability: 'endowment:name-lookup',
          },
        },
      },
      'npm:social-names-snap': {
        origin: 'npm:social-names-snap',
        permissions: {
          'endowment:name-lookup': {
            caveats: [
              {
                type: 'lookupMatchers',
                value: { tlds: ['lens'], schemes: ['farcaster', 'fc'] },
              },
            ],
            date: 1718117256761,
            id: 'MhjpHKQFfGpMzI6YzkPGA',
            invoker: 'npm:social-names-snap',
            parentCapability: 'endowment:name-lookup',
          },
        },
      },
    },
  },
};

describe('useSnapNameResolution', () => {
  it('calls name resolution Snaps with the provided input', async () => {
    const { result, waitForValueToChange } = renderHookWithProvider(
      () =>
        useSnapNameResolution({ chainId: 'eip155:1', domain: 'metamask.eth' }),
      mockState,
    );

    await waitForValueToChange(() => result.current.results);

    expect(result.current.results).toStrictEqual([
      {
        domainName: 'metamask.eth',
        protocol: 'ENS',
        resolvedAddress: '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb',
      },
    ]);
  });

  it('supports chain ID filtering', async () => {
    const { result, waitForValueToChange } = renderHookWithProvider(
      () =>
        useSnapNameResolution({
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          domain: 'metamask',
        }),
      mockState,
    );

    await waitForValueToChange(() => result.current.results);

    expect(result.current.results).toStrictEqual([
      {
        domainName: 'metamask.eth',
        protocol: 'ENS',
        resolvedAddress: '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb',
      },
      {
        domainName: 'metamask.sol',
        protocol: 'SNS',
        resolvedAddress: '7XGrbd3dmdesSR5vAu7siidiZ1YHyizzuPCQAnh2g2Lo',
      },
    ]);
  });

  it('supports scheme filtering', async () => {
    const { result, waitForValueToChange } = renderHookWithProvider(
      () =>
        useSnapNameResolution({ chainId: 'eip155:1', domain: 'farcaster:v' }),
      mockState,
    );

    await waitForValueToChange(() => result.current.results);

    expect(result.current.results).toStrictEqual([
      {
        domainName: 'farcaster:v',
        protocol: 'Farcaster',
        resolvedAddress: '0x0000000000000000000000000000000000000000',
      },
    ]);
  });

  it('supports TLD filtering', async () => {
    const { result, waitForValueToChange } = renderHookWithProvider(
      () => useSnapNameResolution({ chainId: 'eip155:1', domain: 'foo.lens' }),
      mockState,
    );

    await waitForValueToChange(() => result.current.results);

    expect(result.current.results).toStrictEqual([
      {
        domainName: 'foo.lens',
        protocol: 'Lens',
        resolvedAddress: '0x0000000000000000000000000000000000000000',
      },
    ]);
  });
});
