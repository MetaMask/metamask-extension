import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Hex } from '@metamask/utils';
import { fireEvent } from '../../../../test/jest';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';

import { DisconnectPermissionsModal } from '.';

// Mock the gator permissions utils
jest.mock('../../../../shared/lib/gator-permissions', () => ({
  formatGatorAmountLabel: jest.fn().mockReturnValue('1 ETH per second'),
  getGatorPermissionDisplayMetadata: jest.fn().mockReturnValue({
    displayNameKey: 'tokenStream',
    amount: '0xde0b6b3a7640000',
    frequencyKey: 'perSecond',
  }),
}));

// Mock the useGatorPermissionTokenInfo hook
jest.mock(
  '../../../hooks/gator-permissions/useGatorPermissionTokenInfo',
  () => ({
    useGatorPermissionTokenInfo: jest.fn().mockReturnValue({
      tokenInfo: {
        symbol: 'ETH',
        decimals: 18,
        chainId: '0x1',
      },
      loading: false,
      error: null,
      source: 'native',
    }),
  }),
);

describe('DisconnectPermissionsModal', () => {
  const onSkip = jest.fn();
  const onRemoveAll = jest.fn();
  const onClose = jest.fn();

  const args = {
    isOpen: true,
    onClose,
    onSkip,
    onRemoveAll,
    permissions: [
      {
        permission: {
          permissionResponse: {
            permission: {
              type: 'custom' as const,
              data: {
                amountPerSecond: '0xde0b6b3a7640000', // 1 ETH in hex
              },
              isAdjustmentAllowed: false,
            },
            chainId: '0x1' as Hex,
            address: '0x1234567890123456789012345678901234567890' as Hex,
            context: '0x1234567890123456789012345678901234567890' as Hex,
            signerMeta: {
              delegationManager:
                '0x1234567890123456789012345678901234567890' as Hex,
            },
          },
          siteOrigin: 'portfolio.metamask.io',
        },
        chainId: '0x1' as Hex,
        permissionType: 'native-token-stream',
      },
    ],
  };

  const mockStore = configureMockStore([])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: true,
    },
    locale: {
      currentLocale: 'en',
    },
    networkConfigurations: {
      '0x1': { name: 'Ethereum Mainnet', nativeCurrency: 'ETH' },
      '0x89': { name: 'Polygon', nativeCurrency: 'MATIC' },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fire onSkip when Skip button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <DisconnectPermissionsModal {...args} />,
      mockStore,
    );
    const skipButton = getByTestId('skip-disconnect-permissions');
    fireEvent.click(skipButton);
    expect(onSkip).toHaveBeenCalled();
  });

  it('should fire onRemoveAll when Remove all button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <DisconnectPermissionsModal {...args} />,
      mockStore,
    );
    const removeAllButton = getByTestId('remove-all-disconnect-permissions');
    fireEvent.click(removeAllButton);
    expect(onRemoveAll).toHaveBeenCalled();
  });

  it('should fire onClose when close button is clicked', () => {
    const { getByRole } = renderWithProvider(
      <DisconnectPermissionsModal {...args} />,
      mockStore,
    );
    const closeButton = getByRole('button', { name: /close/iu });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should display correct title and description', () => {
    const { getByText } = renderWithProvider(
      <DisconnectPermissionsModal {...args} />,
      mockStore,
    );
    // The test helpers provide actual translations
    expect(getByText('Other permissions on this site')).toBeInTheDocument();
    expect(
      getByText(
        'The following permissions were also found on this site. Do you want to remove them?',
      ),
    ).toBeInTheDocument();
  });

  it('should display permissions list', () => {
    const { getByText } = renderWithProvider(
      <DisconnectPermissionsModal {...args} />,
      mockStore,
    );
    expect(getByText('Token stream')).toBeInTheDocument();
    expect(getByText('1 ETH per second • 0x12345...67890')).toBeInTheDocument();
  });
});
