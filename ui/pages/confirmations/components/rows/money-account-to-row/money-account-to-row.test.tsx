import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { useMoneyVaultApy } from '../../../../../hooks/money/useMoneyVaultApy';
import { useMoneyAnalytics } from '../../../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../../../hooks/money/useMoneyAnalytics.mock';

/* eslint-disable import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog */
import {
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../money/constants/money-events';
/* eslint-enable import-x/no-restricted-paths */
import {
  MONEY_APY_DIALOG_TEST_ID,
  MONEY_INTRO_DIALOG_TEST_ID,
  MoneyAccountToRow,
} from './money-account-to-row';

jest.mock('../../../../../hooks/money/useMoneyVaultApy', () => ({
  useMoneyVaultApy: jest.fn(),
}));

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('../../../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));

const mockUseMoneyVaultApy = jest.mocked(useMoneyVaultApy);
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

function renderToRow() {
  const store = configureStore(mockState);
  renderWithProvider(<MoneyAccountToRow />, store);
  return { store };
}

describe('MoneyAccountToRow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
    mockUseMoneyVaultApy.mockReturnValue({
      apyPercentFormatted: '6.2%',
    } as ReturnType<typeof useMoneyVaultApy>);
  });

  it('renders the To label, Money icon, MetaMask Money trigger, bullet, and APY trigger', () => {
    renderToRow();

    expect(screen.getByTestId('money-account-to-row')).toHaveTextContent('To');
    expect(screen.getByTestId('money-account-to-icon')).toHaveAttribute(
      'src',
      './images/money.png',
    );
    expect(
      screen.getByTestId('money-account-to-splash-trigger'),
    ).toHaveTextContent('MetaMask Money');
    expect(screen.getByTestId('money-account-to-row')).toHaveTextContent('•');
    expect(screen.getByText('•')).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.getByTestId('money-account-to-apy-trigger'),
    ).toHaveTextContent('6.2% APY');
  });

  it('omits the bullet and APY trigger when vault APY is unavailable', () => {
    mockUseMoneyVaultApy.mockReturnValue({
      apyPercentFormatted: undefined,
    } as ReturnType<typeof useMoneyVaultApy>);

    renderToRow();

    expect(
      screen.getByTestId('money-account-to-splash-trigger'),
    ).toHaveTextContent('MetaMask Money');
    expect(
      screen.queryByTestId('money-account-to-apy-trigger'),
    ).not.toBeInTheDocument();
  });

  it('opens the read-only Money intro dialog when MetaMask Money is clicked without opening FTUE splash', () => {
    const { store } = renderToRow();

    fireEvent.click(screen.getByTestId('money-account-to-splash-trigger'));

    expect(store.getState().moneyFtue.isOpen).toBe(false);
    expect(screen.getByTestId(MONEY_INTRO_DIALOG_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId('money-intro-dialog-title')).toHaveTextContent(
      messages.moneyFtueTitle.message,
    );
    expect(
      screen.queryByText(messages.moneyFtueStartEarning.message),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId(`${MONEY_INTRO_DIALOG_TEST_ID}-close-button`),
    );
    expect(
      screen.queryByTestId(MONEY_INTRO_DIALOG_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('opens the APY dialog from the Money intro dialog APY trigger', () => {
    renderToRow();

    fireEvent.click(screen.getByTestId('money-account-to-splash-trigger'));
    fireEvent.click(screen.getByTestId('money-intro-dialog-apy-trigger'));

    expect(
      screen.queryByTestId(MONEY_INTRO_DIALOG_TEST_ID),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId(MONEY_APY_DIALOG_TEST_ID)).toBeInTheDocument();
  });

  it('opens the APY dialog and tracks analytics when the APY trigger is clicked', () => {
    renderToRow();

    fireEvent.click(screen.getByTestId('money-account-to-apy-trigger'));

    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      screenName: MoneyScreenName.MoneyDeposit,
    });
    expect(mockMoneyAnalytics.trackTooltipClicked).toHaveBeenCalledWith({
      tooltipName: MoneyTooltipName.Apy,
      tooltipType: MoneyTooltipType.Info,
    });
    expect(screen.getByTestId(MONEY_APY_DIALOG_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId('money-apy-dialog-title')).toHaveTextContent(
      '6.2% APY',
    );

    fireEvent.click(
      screen.getByTestId(`${MONEY_APY_DIALOG_TEST_ID}-close-button`),
    );
    expect(
      screen.queryByTestId(MONEY_APY_DIALOG_TEST_ID),
    ).not.toBeInTheDocument();
  });
});
