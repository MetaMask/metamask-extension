import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MONEY_LANDING_URL } from '../constants/urls';
import { MoneyMoreMenu } from './money-more-menu';

jest.mock(
  '../../../components/app/modals/visit-support-data-consent-modal',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <button
          type="button"
          data-testid="support-consent-modal"
          onClick={onClose}
        />
      ) : null,
  }),
);

const openMenu = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId('money-more-menu-button'));
  });
};

describe('MoneyMoreMenu', () => {
  beforeEach(() => {
    global.platform.openTab = jest.fn();
  });

  it('renders a closed menu button', () => {
    renderWithLocalization(<MoneyMoreMenu />);

    expect(
      screen.getByRole('button', { name: messages.moneyMoreOptions.message }),
    ).toBeEnabled();
    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
  });

  it('shows the options when the button is clicked', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();

    expect(screen.getByTestId('money-more-menu')).toBeInTheDocument();
    expect(screen.getByTestId('money-more-menu-how-it-works')).toBeDisabled();
    expect(
      screen.getByTestId('money-more-menu-how-it-works'),
    ).toHaveTextContent(messages.moneyHowItWorks.message);
    expect(screen.getByTestId('money-more-menu-benefits')).toHaveTextContent(
      messages.moneyBenefits.message,
    );
    expect(
      screen.getByTestId('money-more-menu-contact-support'),
    ).toHaveTextContent(messages.moneyContactSupport.message);
  });

  it('opens the money landing page and closes when benefits is clicked', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();
    fireEvent.click(screen.getByTestId('money-more-menu-benefits'));

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: MONEY_LANDING_URL,
    });
    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
  });

  it('opens the support consent modal when contact support is clicked', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();
    fireEvent.click(screen.getByTestId('money-more-menu-contact-support'));

    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
    expect(screen.getByTestId('support-consent-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('support-consent-modal'));

    expect(
      screen.queryByTestId('support-consent-modal'),
    ).not.toBeInTheDocument();
  });

  it('closes the menu on escape', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
  });
});
