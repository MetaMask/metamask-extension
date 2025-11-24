import { SolScope } from '@metamask/keyring-api';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers';
import { getAllEnabledNetworksForAllNamespaces } from '../../../../selectors';
import { useNetworkManagerInitialTab } from './useNetworkManagerState';

jest.mock('../../../../selectors', () => ({
  ...jest.requireActual('../../../../selectors'),
  getAllEnabledNetworksForAllNamespaces: jest.fn(),
}));

describe('useNetworkManagerInitialTab() tests', () => {
  const arrangeMocks = () => {
    const mockGetAllEnabledNetworksForAllNamespaces = jest
      .mocked(getAllEnabledNetworksForAllNamespaces)
      .mockReturnValue([]);

    return {
      mockGetAllEnabledNetworksForAllNamespaces,
    };
  };

  const testScenarios = [
    {
      scenario: 'all enabled networks are featured networks',
      enabledNetworks: ['eip155:1', 'eip155:137', SolScope.Mainnet],
      expectedTab: 'networks',
    },
    {
      scenario:
        'all enabled networks are featured networks (with hex conversion)',
      enabledNetworks: ['0x1', '0x89', SolScope.Mainnet],
      expectedTab: 'networks',
    },
    {
      scenario: 'some enabled networks are not featured',
      enabledNetworks: ['eip155:1', 'eip155:137', 'eip155:1776'],
      expectedTab: 'custom-networks',
    },
    {
      scenario: 'all enabled networks are non-featured',
      enabledNetworks: ['eip155:1776', 'eip155:1000'],
      expectedTab: 'custom-networks',
    },
    {
      scenario: 'no networks are enabled (empty subset)',
      enabledNetworks: [],
      expectedTab: 'networks',
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(testScenarios)(
    'should return "$expectedTab" when $scenario',
    ({ enabledNetworks, expectedTab }: (typeof testScenarios)[number]) => {
      const mocks = arrangeMocks();
      mocks.mockGetAllEnabledNetworksForAllNamespaces.mockReturnValue(
        enabledNetworks,
      );

      const hook = renderHookWithProviderTyped(
        () => useNetworkManagerInitialTab(),
        {},
      );

      expect(hook.result.current.initialTab).toBe(expectedTab);
    },
  );
});
