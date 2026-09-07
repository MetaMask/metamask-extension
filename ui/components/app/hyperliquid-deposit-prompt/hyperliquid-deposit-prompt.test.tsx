import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  CONFIRM_TRANSACTION_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { PERPS_HOME_TAB_ROUTE } from '../../../hooks/perps/usePerpsHomeRoute';
import { updateTransactionPaymentToken } from '../../../store/controller-actions/transaction-pay-controller';
import { useSendTokens } from '../../../pages/confirmations/hooks/send/useSendTokens';
import {
  AssetStandard,
  type Asset,
} from '../../../pages/confirmations/types/send';
import {
  selectBlockedPayTokens,
  type BlockedPayTokenEntry,
} from '../../../pages/confirmations/selectors/feature-flags';
import { HyperliquidDepositPrompt } from './hyperliquid-deposit-prompt';

jest.mock('../../../pages/confirmations/hooks/send/useSendTokens');

const mockStartPerpsDeposit = jest.fn();
jest.mock('../perps/hooks/usePerpsDepositConfirmation', () => ({
  usePerpsDepositConfirmation: () => ({
    isLoading: false,
    trigger: mockStartPerpsDeposit,
  }),
}));

jest.mock('../../../store/controller-actions/transaction-pay-controller');

const mockUsePerpsHomeRoute = jest.fn(() => PERPS_HOME_PAGE_ROUTE);
jest.mock('../../../hooks/perps/usePerpsHomeRoute', () => ({
  ...jest.requireActual('../../../hooks/perps/usePerpsHomeRoute'),
  usePerpsHomeRoute: () => mockUsePerpsHomeRoute(),
}));

jest.mock('../../../pages/confirmations/selectors/feature-flags', () => ({
  selectBlockedPayTokens: jest.fn(() => ({
    chainIds: [],
    tokens: [],
  })),
}));

jest.mock('../../../pages/confirmations/components/send/asset/asset', () => ({
  Asset: ({ onAssetSelect }: { onAssetSelect: (asset: Asset) => void }) => (
    <button
      data-testid="mock-asset-picker"
      onClick={() =>
        onAssetSelect({
          address: '0x2222222222222222222222222222222222222222',
          chainId: '0x1',
          name: 'USD Coin',
          symbol: 'USDC',
        })
      }
    >
      Mock asset picker
    </button>
  ),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseSendTokens = jest.mocked(useSendTokens);
const mockSelectBlockedPayTokens = jest.mocked(selectBlockedPayTokens);
const mockUpdateTransactionPaymentToken = jest.mocked(
  updateTransactionPaymentToken,
);

const ETH_TOKEN: Asset = {
  accountType: 'eip155:eoa',
  address: '0x0000000000000000000000000000000000000000',
  balance: '0.5',
  chainId: '0x1',
  fiat: { balance: 1124.45, currency: 'USD' },
  image: './images/eth_logo.svg',
  isNative: true,
  name: 'Ethereum',
  standard: AssetStandard.Native,
  symbol: 'ETH',
};

const USDC_TOKEN: Asset = {
  accountType: 'eip155:eoa',
  address: '0x2222222222222222222222222222222222222222',
  balance: '50',
  chainId: '0x1',
  fiat: { balance: 50, currency: 'USD' },
  image: './images/usdc_logo.svg',
  isNative: false,
  name: 'USD Coin',
  standard: AssetStandard.ERC20,
  symbol: 'USDC',
};

const toBlockedPayTokenEntry = (token: Asset): BlockedPayTokenEntry => ({
  address: token.address as string,
  chainId: String(token.chainId),
});

const mockStore = configureMockStore([]);

const SELECTED_ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const renderComponent = (
  onActionComplete = jest.fn(),
  selectedAddress = SELECTED_ACCOUNT_ADDRESS,
) => {
  const store = mockStore(mockState);

  renderWithProvider(
    <HyperliquidDepositPrompt
      onActionComplete={onActionComplete}
      selectedAddress={selectedAddress}
    />,
    store,
  );

  return { onActionComplete };
};

describe('HyperliquidDepositPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectBlockedPayTokens.mockReturnValue({
      chainIds: [],
      tokens: [],
    });
    mockUsePerpsHomeRoute.mockReturnValue(PERPS_HOME_PAGE_ROUTE);
    mockUseSendTokens.mockReturnValue([ETH_TOKEN, USDC_TOKEN]);
    mockStartPerpsDeposit.mockResolvedValue({
      transactionId: 'transaction-id-mock',
    });
    mockUpdateTransactionPaymentToken.mockResolvedValue(undefined);
  });

  it('renders the title, logos, default token and continue button', () => {
    renderComponent();

    expect(
      screen.getByText(messages.hyperliquidDepositPromptTitle.message),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.payWith.message)).toBeInTheDocument();
    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-metamask-logo'),
    ).toHaveAttribute('src', './images/logo/metamask-fox.svg');
    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-hyperliquid-logo'),
    ).toHaveAttribute('src', './images/hyperevm.svg');
    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-token-name'),
    ).toHaveTextContent('Ethereum');
    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-continue'),
    ).toBeEnabled();
  });

  it('resolves the approval without starting a deposit when closed', () => {
    const { onActionComplete } = renderComponent();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-prompt-close'));

    expect(onActionComplete).toHaveBeenCalledWith({ action: 'dismiss' });
    expect(mockStartPerpsDeposit).not.toHaveBeenCalled();
  });

  it('updates the selected token when one is picked from the modal', () => {
    renderComponent();

    fireEvent.click(
      screen.getByTestId('hyperliquid-deposit-prompt-token-select'),
    );
    fireEvent.click(screen.getByTestId('mock-asset-picker'));

    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-token-name'),
    ).toHaveTextContent('USD Coin');
  });

  it('creates the deposit, pre-selects the payment token, navigates and resolves the approval on continue', async () => {
    const { onActionComplete } = renderComponent();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-prompt-continue'));

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith({
        action: 'continue',
        transactionId: 'transaction-id-mock',
      });
    });

    expect(mockStartPerpsDeposit).toHaveBeenCalledTimes(1);
    expect(mockUpdateTransactionPaymentToken).toHaveBeenCalledWith({
      transactionId: 'transaction-id-mock',
      tokenAddress: ETH_TOKEN.address,
      chainId: ETH_TOKEN.chainId,
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      {
        pathname: `${CONFIRM_TRANSACTION_ROUTE}/transaction-id-mock`,
        search: `loader=customAmount&goBackTo=${encodeURIComponent(PERPS_HOME_PAGE_ROUTE)}`,
      },
      { replace: true },
    );
  });

  it('defaults to the first selectable token when the largest balance is blocked', () => {
    mockSelectBlockedPayTokens.mockReturnValue({
      chainIds: [],
      tokens: [toBlockedPayTokenEntry(ETH_TOKEN)],
    });

    renderComponent();

    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-token-name'),
    ).toHaveTextContent('USD Coin');
    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-continue'),
    ).toBeEnabled();
  });

  it('disables continue when every available token is blocked', () => {
    mockSelectBlockedPayTokens.mockReturnValue({
      chainIds: [],
      tokens: [
        toBlockedPayTokenEntry(ETH_TOKEN),
        toBlockedPayTokenEntry(USDC_TOKEN),
      ],
    });

    renderComponent();

    expect(
      screen.getByText(messages.swapSelectToken.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('hyperliquid-deposit-prompt-continue'),
    ).toBeDisabled();
  });

  it('uses the wallet home perps tab as goBackTo when bottom nav is disabled', async () => {
    mockUsePerpsHomeRoute.mockReturnValue(PERPS_HOME_TAB_ROUTE);

    renderComponent();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-prompt-continue'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        {
          pathname: `${CONFIRM_TRANSACTION_ROUTE}/transaction-id-mock`,
          search: `loader=customAmount&goBackTo=${encodeURIComponent(PERPS_HOME_TAB_ROUTE)}`,
        },
        { replace: true },
      );
    });
  });

  it('shows an error and keeps the prompt open when the deposit fails to start', async () => {
    mockStartPerpsDeposit.mockResolvedValue(null);
    const { onActionComplete } = renderComponent();

    fireEvent.click(screen.getByTestId('hyperliquid-deposit-prompt-continue'));

    await waitFor(() => {
      expect(
        screen.getByTestId('hyperliquid-deposit-prompt-error'),
      ).toBeInTheDocument();
    });

    expect(onActionComplete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('dismisses immediately when the signer address does not match the selected account', async () => {
    const onActionComplete = jest.fn();
    renderComponent(onActionComplete, '0xDifferentAddress');

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith({ action: 'dismiss' });
    });

    expect(mockStartPerpsDeposit).not.toHaveBeenCalled();
  });
});
