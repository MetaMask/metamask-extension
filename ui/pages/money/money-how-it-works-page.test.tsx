import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { DEFAULT_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { MONEY_CARD_FEES_URL } from './constants/urls';
import { MONEY_NO_FEE_DEPOSIT_TOKEN_BULLETS } from './constants/no-fee-deposit-tokens';
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
    global.platform.openTab = jest.fn();
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

  it('renders a loading composition while availability is resolving', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(
      screen.getByTestId('money-how-it-works-loading'),
    ).toBeInTheDocument();
  });

  it('redirects unavailable users to Home', () => {
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

  it('renders intro copy, FAQs, and disclosures', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(screen.getByTestId('money-how-it-works-page')).toBeInTheDocument();
    expect(screen.getByTestId('money-how-it-works-title')).toHaveTextContent(
      messages.money.message,
    );
    expect(
      screen.getByTestId('money-how-it-works-section-title'),
    ).toHaveTextContent(messages.moneyHowItWorks.message);
    expect(
      screen.getByTestId('money-how-it-works-description-1'),
    ).toHaveTextContent(
      messages.moneyHowItWorksPageDescription1WithApy.message.replace(
        '$1',
        '4.2%',
      ),
    );
    expect(
      screen.getByTestId('money-how-it-works-faq-title'),
    ).toHaveTextContent(messages.moneyHowItWorksFaqTitle.message);
    expect(
      screen.getByTestId('money-how-it-works-faq-item-1'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-how-it-works-faq-item-10'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-how-it-works-disclosures-title'),
    ).toHaveTextContent(messages.moneyDisclosuresTitle.message);
    expect(
      screen.getByTestId('money-how-it-works-disclosures-body'),
    ).toHaveTextContent(messages.moneyDisclosuresBody.message);
  });

  it('omits the APY rate when none is available', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: undefined,
    });

    renderWithLocalization(<MoneyHowItWorksPage />);

    expect(
      screen.getByTestId('money-how-it-works-description-1'),
    ).toHaveTextContent(messages.moneyHowItWorksPageDescription1.message);
  });

  it('navigates back from the header button', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    fireEvent.click(screen.getByTestId('money-how-it-works-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('opens the Card fees article from FAQ 4', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    fireEvent.click(screen.getByText(messages.moneyFaqQuestion4.message));
    fireEvent.click(screen.getByTestId('money-how-it-works-faq-link'));

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: MONEY_CARD_FEES_URL,
    });
  });

  it('interpolates the no-fee token list into FAQ 7 without replacing $100,000', () => {
    renderWithLocalization(<MoneyHowItWorksPage />);

    fireEvent.click(screen.getByText(messages.moneyFaqQuestion7.message));

    const faq7 = screen.getByTestId('money-how-it-works-faq-item-7');
    expect(faq7).toHaveTextContent(
      MONEY_NO_FEE_DEPOSIT_TOKEN_BULLETS.replaceAll('\n', ' '),
    );
    expect(faq7).toHaveTextContent('$100,000');
    expect(faq7).toHaveTextContent(messages.moneyFaqAnswer7.message);
  });
});
