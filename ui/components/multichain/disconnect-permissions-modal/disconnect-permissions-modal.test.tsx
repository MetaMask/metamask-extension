import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '../../../../test/jest';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import { DisconnectPermissionsModal } from '.';

// Mock the gator permissions utils
jest.mock('../../../../shared/lib/gator-permissions-utils', () => ({
  getGatorPermissionTokenInfo: jest.fn().mockResolvedValue({
    symbol: 'ETH',
    decimals: 18,
  }),
  formatGatorAmountLabel: jest.fn().mockReturnValue('1 ETH per second'),
  getGatorPermissionDisplayMetadata: jest.fn().mockReturnValue({
    displayName: 'Token Stream',
    amount: '0xde0b6b3a7640000',
    frequency: 'per second',
  }),
}));

describe('DisconnectPermissionsModal', () => {
  const onSkip = jest.fn();
  const onRemoveAll = jest.fn();
  const onClose = jest.fn();

  const args: any = {
    isOpen: true,
    onClose,
    onSkip,
    onRemoveAll,
    permissions: [
      {
        permission: {
          permissionResponse: {
            permission: {
              data: {
                amountPerSecond: '0xde0b6b3a7640000', // 1 ETH in hex
              },
            },
            chainId: '0x1',
            expiry: 1234567890,
            context: 'test-context',
            signerMeta: {},
          },
          siteOrigin: 'portfolio.metamask.io',
        },
        chainId: '0x1',
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

  it('should render correctly', () => {
    const { container } = renderWithProvider(
      <DisconnectPermissionsModal {...args} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
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
    expect(getByText('Token Stream')).toBeInTheDocument();
    expect(getByText('1 ETH per second')).toBeInTheDocument();
  });
});
