import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MONEY_HOW_IT_WORKS_ROUTE } from '../../../helpers/constants/routes';
import { MONEY_LANDING_URL } from '../constants/urls';
import { MoneyMoreMenu } from './money-more-menu';

const mockNavigate = jest.fn();
const mockOnClose = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => 'popup',
}));

jest.mock(
  '../../../components/app/modals/visit-support-data-consent-modal',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="visit-support-data-consent-modal" /> : null,
  }),
);

describe('MoneyMoreMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.platform.openTab = jest.fn();
  });

  it('renders the three More options', () => {
    renderWithLocalization(<MoneyMoreMenu isOpen onClose={mockOnClose} />);

    expect(screen.getByTestId('money-more-menu')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.moneyHowItWorks.message }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.moneyBenefits.message }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: messages.moneyContactSupport.message,
      }),
    ).toBeInTheDocument();
  });

  it('navigates to How it works and closes the sheet', () => {
    renderWithLocalization(<MoneyMoreMenu isOpen onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId('money-more-menu-how-it-works'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOW_IT_WORKS_ROUTE);
  });

  it('opens the Money landing page from Benefits', () => {
    renderWithLocalization(<MoneyMoreMenu isOpen onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId('money-more-menu-benefits'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: MONEY_LANDING_URL,
    });
  });

  it('opens the support consent modal from Contact support', () => {
    renderWithLocalization(<MoneyMoreMenu isOpen onClose={mockOnClose} />);

    expect(
      screen.queryByTestId('visit-support-data-consent-modal'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('money-more-menu-contact-support'));

    expect(
      screen.getByTestId('visit-support-data-consent-modal'),
    ).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
