import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { DEFAULT_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { MoneyHowItWorksPage } from './money-how-it-works-page';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyAccountBalance = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

jest.mock('../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: () => mockUseMoneyAccountBalance(),
}));

describe('MoneyHowItWorksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
      isLoading: false,
    });
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '4.2%',
    });
  });

  it('redirects home when Money Account is unavailable', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: false,
    });

    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      DEFAULT_ROUTE,
    );
  });

  it('shows a loading state while availability is resolving', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(
      screen.getByTestId('money-how-it-works-loading'),
    ).toBeInTheDocument();
  });

  it('renders the intro, FAQ questions, and disclosures', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(screen.getByTestId('money-how-it-works-title')).toHaveTextContent(
      messages.moneyHowItWorks.message,
    );
    expect(
      screen.getByTestId('money-how-it-works-description-1'),
    ).toHaveTextContent('earn up to 4.2% APY');
    expect(
      screen.getByTestId('money-how-it-works-faq-title'),
    ).toHaveTextContent(messages.moneyHowItWorksFaqTitle.message);
    [
      messages.moneyHowItWorksFaqMoneyAccountQuestion.message,
      messages.moneyHowItWorksFaqFeesQuestion.message,
      messages.moneyHowItWorksFaqApyQuestion.message,
      messages.moneyHowItWorksFaqYieldQuestion.message,
      messages.moneyHowItWorksFaqTokensQuestion.message,
      messages.moneyHowItWorksFaqLockedQuestion.message,
      messages.moneyHowItWorksFaqIdentityQuestion.message,
      messages.moneyHowItWorksFaqCountriesQuestion.message,
    ].forEach((question) => {
      expect(screen.getByText(question)).toBeInTheDocument();
    });
    expect(
      screen.getByTestId('money-how-it-works-disclosures-title'),
    ).toHaveTextContent(messages.moneyHowItWorksDisclosuresTitle.message);
    expect(
      screen.getByTestId('money-how-it-works-disclosures-body'),
    ).toHaveTextContent(messages.moneyHowItWorksDisclosuresBody.message);
  });

  it('expands and collapses a FAQ answer', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    const question = screen.getByTestId('money-how-it-works-faq-fees');
    const details = screen.getByTestId('money-how-it-works-faq-fees-details');
    expect(details).not.toHaveAttribute('open');
    expect(
      screen.getByTestId('money-how-it-works-faq-fees-answer'),
    ).toHaveTextContent(messages.moneyHowItWorksFaqFeesAnswer.message);

    fireEvent.click(question);

    expect(details).toHaveAttribute('open');

    fireEvent.click(question);

    expect(details).not.toHaveAttribute('open');
  });

  it('substitutes the max deposit into the tokens FAQ answer', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(
      screen.getByTestId('money-how-it-works-faq-tokens-answer'),
    ).toHaveTextContent(
      "Note: There's an initial max deposit of $100,000 per token to ensure liquidity.",
    );
  });

  it('substitutes the APY into the Money account FAQ answer', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(
      screen.getByTestId('money-how-it-works-faq-money-account-answer'),
    ).toHaveTextContent(
      'An account that earns up to 4.2% variable APY. You deposit funds, which are held in the account as mUSD, and earn up to 4.2% APY.',
    );
  });

  it('navigates back from the header button', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    fireEvent.click(screen.getByTestId('money-how-it-works-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('falls back to an em dash when APY is unavailable', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: undefined,
    });

    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(
      screen.getByTestId('money-how-it-works-description-1'),
    ).toHaveTextContent('earn up to — APY');
  });
});
