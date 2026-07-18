import React from 'react';
import { act } from '@testing-library/react';

import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../../../store/store';
import { useGasSponsorshipPreference } from '../../../../../hooks/gas/useGasSponsorshipPreference';
import { useNativeCurrencySymbol } from '../../hooks/useNativeCurrencySymbol';
import { useFeeCalculations } from '../../hooks/useFeeCalculations';
import { GasSponsorshipModal } from './gas-sponsorship-modal';

jest.mock('../../../../../hooks/gas/useGasSponsorshipPreference');
jest.mock('../../hooks/useNativeCurrencySymbol');
jest.mock('../../hooks/useFeeCalculations');

function getState() {
  return getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation(),
    {
      metamask: {
        preferences: {
          showFiatInTestnets: true,
        },
        internalAccounts: {
          accounts: {
            'mock-account-id': {
              address: '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b',
              id: 'mock-account-id',
              metadata: {
                importTime: 0,
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [],
              type: 'eip155:eoa',
            },
          },
          selectedAccount: 'mock-account-id',
        },
        accountsByChainId: {
          '0x5': {
            '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b': {
              balance: '0xde0b6b3a7640000',
            },
          },
        },
      },
    },
  );
}

const store = configureStore(getState());

describe('GasSponsorshipModal', () => {
  const useGasSponsorshipPreferenceMock = jest.mocked(
    useGasSponsorshipPreference,
  );
  const useNativeCurrencySymbolMock = jest.mocked(useNativeCurrencySymbol);
  const useFeeCalculationsMock = jest.mocked(useFeeCalculations);

  beforeEach(() => {
    jest.resetAllMocks();

    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: false,
      setSponsorshipOptedOut: jest.fn(),
    });

    useNativeCurrencySymbolMock.mockReturnValue({
      nativeCurrencySymbol: 'ETH',
    });

    useFeeCalculationsMock.mockReturnValue({
      calculateGasEstimate: jest.fn(),
      estimatedFeeFiat: '$1.50',
      estimatedFeeFiatWith18SignificantDigits: null,
      estimatedFeeNative: '0.001 ETH',
      estimatedFeeNativeHex: '0x0',
      maxFeeFiat: '$2.00',
      maxFeeFiatWith18SignificantDigits: null,
      maxFeeHex: '0x0',
      maxFeeNative: '0.002 ETH',
    });
  });

  it('renders with "Network fee" title', () => {
    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    expect(
      result.getByText(messages.gasSponsorshipModalTitle.message),
    ).toBeInTheDocument();
  });

  it('renders "Paid by MetaMask" option with "Includes smart account activation" subtitle', () => {
    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    expect(
      result.getByText(messages.paidByMetaMask.message),
    ).toBeInTheDocument();
    expect(
      result.getByText(messages.includesSmartAccountActivation.message),
    ).toBeInTheDocument();
  });

  it('renders native token option with fee estimate', () => {
    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    expect(result.getByText('ETH')).toBeInTheDocument();
    expect(result.getByText('~$1.50')).toBeInTheDocument();
  });

  it('shows checkmark on sponsored option when not opted out', () => {
    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: false,
      setSponsorshipOptedOut: jest.fn(),
    });

    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    const checkmarks = result.getAllByTestId('gas-sponsorship-selected-check');
    expect(checkmarks).toHaveLength(1);
    expect(
      result.getByText(messages.paidByMetaMask.message),
    ).toBeInTheDocument();
  });

  it('shows checkmark on native option when opted out', () => {
    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: true,
      setSponsorshipOptedOut: jest.fn(),
    });

    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    const checkmarks = result.getAllByTestId('gas-sponsorship-selected-check');
    expect(checkmarks).toHaveLength(1);
    expect(result.getByText('ETH')).toBeInTheDocument();
  });

  it('calls setSponsorshipOptedOut(false) and onClose when selecting sponsored option', async () => {
    const setSponsorshipOptedOutMock = jest.fn();
    const onCloseMock = jest.fn();

    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: true,
      setSponsorshipOptedOut: setSponsorshipOptedOutMock,
    });

    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={onCloseMock} />,
      store,
    );

    const sponsoredOptions = result.queryAllByTestId(
      /gas-sponsorship-option-/u,
    );
    await act(async () => {
      sponsoredOptions[0]?.click();
    });

    expect(setSponsorshipOptedOutMock).toHaveBeenCalledWith(false);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls setSponsorshipOptedOut(true) and onClose when selecting native option', async () => {
    const setSponsorshipOptedOutMock = jest.fn();
    const onCloseMock = jest.fn();

    useGasSponsorshipPreferenceMock.mockReturnValue({
      isSponsorshipOptedOut: false,
      setSponsorshipOptedOut: setSponsorshipOptedOutMock,
    });

    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={onCloseMock} />,
      store,
    );

    const nativeOptions = result.queryAllByTestId(/gas-sponsorship-option-/u);
    await act(async () => {
      nativeOptions[1]?.click();
    });

    expect(setSponsorshipOptedOutMock).toHaveBeenCalledWith(true);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('displays native fee in fiat when available', () => {
    useFeeCalculationsMock.mockReturnValue({
      calculateGasEstimate: jest.fn(),
      estimatedFeeFiat: '$2.75',
      estimatedFeeFiatWith18SignificantDigits: null,
      estimatedFeeNative: '0.002 ETH',
      estimatedFeeNativeHex: '0x0',
      maxFeeFiat: '$3.00',
      maxFeeFiatWith18SignificantDigits: null,
      maxFeeHex: '0x0',
      maxFeeNative: '0.003 ETH',
    });

    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    expect(result.getByText('~$2.75')).toBeInTheDocument();
  });

  it('displays native fee in token amount when fiat is not available', () => {
    useFeeCalculationsMock.mockReturnValue({
      calculateGasEstimate: jest.fn(),
      estimatedFeeFiat: '',
      estimatedFeeFiatWith18SignificantDigits: null,
      estimatedFeeNative: '0.005 ETH',
      estimatedFeeNativeHex: '0x0',
      maxFeeFiat: '',
      maxFeeFiatWith18SignificantDigits: null,
      maxFeeHex: '0x0',
      maxFeeNative: '0.006 ETH',
    });

    const result = renderWithConfirmContextProvider(
      <GasSponsorshipModal onClose={jest.fn()} />,
      store,
    );

    expect(result.getByText('~0.005 ETH')).toBeInTheDocument();
  });
});
