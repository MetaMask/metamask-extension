import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as browserRuntime from '../../../../shared/modules/browser-runtime.utils';
import {
  PLATFORM_FIREFOX,
  PLATFORM_CHROME,
} from '../../../../shared/constants/app';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import SkipSRPBackup from './skip-srp-backup-popover';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockNavigate,
  };
});

describe('SkipSRPBackup', () => {
  const mockStore = {
    metamask: {
      firstTimeFlowType: FirstTimeFlowType.create,
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              type: 'custom',
              url: 'https://mainnet.infura.io',
              networkClientId: 'mainnet',
            },
          ],
          blockExplorerUrls: [],
        },
      },
      selectedNetworkClientId: 'mainnet',
      networksMetadata: {
        mainnet: {
          EIPS: { 1559: true },
          status: 'available',
        },
      },
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: 'HD Key Tree',
            },
          },
        },
        selectedAccount: 'accountId',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
    },
    localeMessages: {
      currentLocale: 'en',
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <SkipSRPBackup onClose={jest.fn()} secureYourWallet={jest.fn()} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should navigate to onboarding metametrics when skip is confirmed on non-Firefox browser', async () => {
    jest
      .spyOn(browserRuntime, 'getBrowserName')
      .mockReturnValue(PLATFORM_CHROME);

    const { getByTestId } = renderWithProvider(
      <SkipSRPBackup onClose={jest.fn()} secureYourWallet={jest.fn()} />,
      store,
    );

    const checkbox = getByTestId('skip-srp-backup-checkbox');
    expect(checkbox).toBeInTheDocument();

    const confirmSkip = getByTestId('skip-srp-backup-button');
    expect(confirmSkip).toBeInTheDocument();
    expect(confirmSkip).toBeDisabled();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(confirmSkip).toBeEnabled();
    });

    fireEvent.click(confirmSkip);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS);
    });
  });

  it('should navigate to onboarding completion when skip is confirmed on Firefox', async () => {
    jest
      .spyOn(browserRuntime, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { getByTestId } = renderWithProvider(
      <SkipSRPBackup onClose={jest.fn()} secureYourWallet={jest.fn()} />,
      store,
    );

    const checkbox = getByTestId('skip-srp-backup-checkbox');
    expect(checkbox).toBeInTheDocument();

    const confirmSkip = getByTestId('skip-srp-backup-button');
    expect(confirmSkip).toBeInTheDocument();
    expect(confirmSkip).toBeDisabled();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(confirmSkip).toBeEnabled();
    });

    fireEvent.click(confirmSkip);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
    });
  });
});
