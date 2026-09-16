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
      screen.getByTestId('money-how-it-works-description-2'),
    ).toHaveTextContent(messages.moneyHowItWorksDescription2.message);
    expect(
      screen.getByTestId('money-how-it-works-description-3'),
    ).toHaveTextContent(messages.moneyHowItWorksDescription3.message);
    expect(
      screen.getByTestId('money-how-it-works-faq-title'),
    ).toHaveTextContent(messages.moneyHowItWorksFaqTitle.message);
    expect(
      screen.getByText(messages.moneyHowItWorksFaqMoneyAccountQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqMusdQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqYieldQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqLockedQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqFeesQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqApyQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqSpendingQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorksFaqControlQuestion.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-how-it-works-disclosures-title'),
    ).toHaveTextContent(messages.moneyHowItWorksDisclosuresTitle.message);
    expect(
      screen.getByTestId('money-how-it-works-disclosures-body'),
    ).toHaveTextContent(messages.moneyHowItWorksDisclosuresBody.message);
  });

  it('expands and collapses a FAQ answer', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    const question = screen.getByTestId('money-how-it-works-faq-musd');
    const details = screen.getByTestId('money-how-it-works-faq-musd-details');
    expect(details).not.toHaveAttribute('open');
    expect(
      screen.getByTestId('money-how-it-works-faq-musd-answer'),
    ).toHaveTextContent(messages.moneyHowItWorksFaqMusdAnswer.message);

    fireEvent.click(question);

    expect(details).toHaveAttribute('open');

    fireEvent.click(question);

    expect(details).not.toHaveAttribute('open');
  });

  it('opens the Card fees page from the fees FAQ link', () => {
    global.platform.openTab = jest.fn();

    renderWithLocalization(<MoneyHowItWorksPage />);

    fireEvent.click(screen.getByTestId('money-how-it-works-faq-fees'));
    const feesLink = screen.getByTestId('money-how-it-works-faq-fees-link');
    expect(feesLink).toHaveAttribute(
      'href',
      'https://support.metamask.io/manage-crypto/metamask-card/limits-and-fees/',
    );
    fireEvent.click(feesLink);

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://support.metamask.io/manage-crypto/metamask-card/limits-and-fees/',
    });
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
