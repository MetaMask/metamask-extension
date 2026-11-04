import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../../hooks/money/useMoneyAnalytics.mock';
import { useMoneyAccountDeposit } from '../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyVaultApy } from '../../../../hooks/money/useMoneyVaultApy';
import { setMoneyFtueSeen } from '../../../../store/actions';
import {
  MONEY_FTUE_SPLASH_CLOSE_BUTTON_TEST_ID,
  MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID,
  MONEY_FTUE_SPLASH_TEST_ID,
  MoneyFtueSplash,
} from '.';

const PREFERRED_PAYMENT_TOKEN = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
  chainId: '0x1' as const,
};

const mockInitiateDeposit = jest.fn();
const mockMoneyAnalytics = createMoneyAnalyticsMock();

jest.mock('../../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  setMoneyFtueSeen: jest.fn((value: boolean) => ({
    type: 'MOCK_SET_MONEY_FTUE_SEEN',
    value,
  })),
}));

jest.mock('../../../../hooks/money/useMoneyVaultApy', () => ({
  useMoneyVaultApy: jest.fn(),
}));

jest.mock('../../../../hooks/money/useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: jest.fn(),
}));

jest.mock('../../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockSetMoneyFtueSeen = jest.mocked(setMoneyFtueSeen);
const mockUseMoneyVaultApy = jest.mocked(useMoneyVaultApy);
const mockUseMoneyAccountDeposit = jest.mocked(useMoneyAccountDeposit);
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

const createState = (
  pendingDeposit: {
    preferredPaymentToken?: typeof PREFERRED_PAYMENT_TOKEN;
    intent?: 'addMusd' | 'convert' | 'card';
  } | null = {
    preferredPaymentToken: PREFERRED_PAYMENT_TOKEN,
    intent: 'addMusd',
  },
) => ({
  metamask: { moneyFtueSeen: false },
  moneyFtue: {
    isOpen: true,
    source: pendingDeposit ? 'deposit' : 'moneyHome',
    pendingDeposit,
  },
});

const renderSplash = (
  pendingDeposit: {
    preferredPaymentToken?: typeof PREFERRED_PAYMENT_TOKEN;
    intent?: 'addMusd' | 'convert' | 'card';
  } | null = {
    preferredPaymentToken: PREFERRED_PAYMENT_TOKEN,
    intent: 'addMusd',
  },
) => {
  const store = configureStore(createState(pendingDeposit));

  renderWithProvider(<MoneyFtueSplash />, store);

  return { store };
};

describe('MoneyFtueSplash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    mockUseMoneyVaultApy.mockReturnValue({
      apyPercentFormatted: '6.2%',
    } as unknown as ReturnType<typeof useMoneyVaultApy>);
    mockUseMoneyAccountDeposit.mockReturnValue({
      initiateDeposit: mockInitiateDeposit,
      isLoading: false,
    });
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
  });

  it('renders nothing while closed', () => {
    renderWithProvider(
      <MoneyFtueSplash />,
      configureStore({
        metamask: { moneyFtueSeen: false },
        moneyFtue: { isOpen: false, source: null, pendingDeposit: null },
      }),
    );

    expect(
      screen.queryByTestId(MONEY_FTUE_SPLASH_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders the headline, APY, benefits, FAQs and CTA', () => {
    renderSplash();

    expect(screen.getByTestId('money-ftue-splash-headline')).toHaveTextContent(
      messages.moneyFtueHeadline.message,
    );
    expect(
      screen.getByTestId('money-ftue-splash-description'),
    ).toHaveTextContent(
      messages.moneyFtueDescription.message.replace('$1', '6.2%'),
    );
    ['convert', 'earn', 'trade', 'withdraw', 'spend'].forEach((benefit) => {
      expect(
        screen.getByTestId(`money-ftue-splash-benefit-${benefit}`),
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByTestId(/^money-ftue-splash-faq-.+-details$/u),
    ).toHaveLength(10);
    expect(
      screen.getByTestId(MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID),
    ).toHaveTextContent(messages.moneyFtueStartEarning.message);
  });

  it('renders a full-width page in the popup', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

    renderSplash();

    expect(screen.getByTestId(MONEY_FTUE_SPLASH_TEST_ID).className).toContain(
      'max-w-none',
    );
  });

  it('renders a centered card in the side panel', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    renderSplash();

    expect(screen.getByTestId(MONEY_FTUE_SPLASH_TEST_ID).className).toContain(
      'max-w-[400px]',
    );
  });

  it('renders a centered card in full screen', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

    renderSplash();

    expect(screen.getByTestId(MONEY_FTUE_SPLASH_TEST_ID).className).toContain(
      'max-w-[400px]',
    );
  });

  it('marks the splash seen and continues the pending deposit from the CTA', () => {
    const { store } = renderSplash();

    fireEvent.click(
      screen.getByTestId(MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID),
    );

    expect(mockSetMoneyFtueSeen).toHaveBeenCalledWith(true);
    expect(store.getState().moneyFtue.isOpen).toBe(false);
    expect(mockInitiateDeposit).toHaveBeenCalledWith({
      preferredPaymentToken: PREFERRED_PAYMENT_TOKEN,
      intent: 'addMusd',
      skipFtue: true,
    });
  });

  it('marks the splash seen and continues the pending deposit from the close button', () => {
    const { store } = renderSplash();

    fireEvent.click(screen.getByTestId(MONEY_FTUE_SPLASH_CLOSE_BUTTON_TEST_ID));

    expect(mockSetMoneyFtueSeen).toHaveBeenCalledWith(true);
    expect(store.getState().moneyFtue.isOpen).toBe(false);
    expect(mockInitiateDeposit).toHaveBeenCalledWith({
      preferredPaymentToken: PREFERRED_PAYMENT_TOKEN,
      intent: 'addMusd',
      skipFtue: true,
    });
  });

  it('continues an option-less deposit after acknowledgement', () => {
    const { store } = renderSplash({});

    fireEvent.click(
      screen.getByTestId(MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID),
    );

    expect(mockSetMoneyFtueSeen).toHaveBeenCalledWith(true);
    expect(store.getState().moneyFtue.isOpen).toBe(false);
    expect(mockInitiateDeposit).toHaveBeenCalledWith({ skipFtue: true });
  });

  it('closes without starting a deposit when there is no pending deposit', () => {
    const { store } = renderSplash(null);

    fireEvent.click(
      screen.getByTestId(MONEY_FTUE_SPLASH_START_EARNING_BUTTON_TEST_ID),
    );

    expect(mockSetMoneyFtueSeen).toHaveBeenCalledWith(true);
    expect(store.getState().moneyFtue.isOpen).toBe(false);
    expect(mockInitiateDeposit).not.toHaveBeenCalled();
  });

  it('expands a FAQ answer', () => {
    renderSplash();

    const question = screen.getByTestId('money-ftue-splash-faq-fees');
    const details = screen.getByTestId('money-ftue-splash-faq-fees-details');

    expect(details).not.toHaveAttribute('open');
    fireEvent.click(question);
    expect(details).toHaveAttribute('open');
  });
});
