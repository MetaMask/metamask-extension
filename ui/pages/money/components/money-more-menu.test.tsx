import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MONEY_HOW_IT_WORKS_ROUTE } from '../../../helpers/constants/routes';
import { MONEY_LANDING_URL } from '../constants/urls';
import {
  MONEY_URLS,
  MoneyBottomSheetName,
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../constants/money-events';
import { useMoneyAnalytics } from '../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../hooks/money/useMoneyAnalytics.mock';
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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

const openMenu = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId('money-more-menu-button'));
  });
};

describe('MoneyMoreMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
    global.platform.openTab = jest.fn();
  });

  it('tracks the menu button click and sheet view when opened', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();

    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      screenName: MoneyScreenName.MoneyHome,
    });
    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      bottomSheetName: MoneyBottomSheetName.MoreSheet,
    });
    expect(mockMoneyAnalytics.trackButtonClicked).toHaveBeenCalledWith({
      buttonType: MoneyButtonType.Icon,
      buttonIntent: MoneyButtonIntent.OpenMoreMenu,
      componentName: MoneyComponentName.More,
      redirectTarget: MoneyBottomSheetName.MoreSheet,
    });
    expect(mockMoneyAnalytics.trackBottomSheetViewed).toHaveBeenCalledTimes(1);

    await openMenu();

    expect(mockMoneyAnalytics.trackButtonClicked).toHaveBeenCalledTimes(1);
    expect(mockMoneyAnalytics.trackBottomSheetViewed).toHaveBeenCalledTimes(1);
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
    expect(screen.getByTestId('money-more-menu-how-it-works')).toBeEnabled();
    expect(
      screen.getByTestId('money-more-menu-how-it-works'),
    ).toHaveTextContent(messages.moneyHowItWorks.message);
    expect(screen.getByTestId('money-more-menu-benefits')).toHaveTextContent(
      messages.moneyBenefits.message,
    );
    expect(
      screen.getByTestId('money-more-menu-benefits-icon'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-more-menu-contact-support'),
    ).toHaveTextContent(messages.moneyContactSupport.message);
  });

  it('navigates to the how it works page and closes when how it works is clicked', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();
    fireEvent.click(screen.getByTestId('money-more-menu-how-it-works'));

    expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOW_IT_WORKS_ROUTE);
    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
    expect(mockMoneyAnalytics.trackSurfaceClicked).toHaveBeenCalledWith({
      componentName: MoneyComponentName.MoreSheetHowItWorks,
      redirectTarget: MoneyScreenName.MoneyHowItWorks,
    });
  });

  it('opens the money landing page and closes when benefits is clicked', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();
    fireEvent.click(screen.getByTestId('money-more-menu-benefits'));

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: MONEY_LANDING_URL,
    });
    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
    expect(mockMoneyAnalytics.trackSurfaceClicked).toHaveBeenCalledWith({
      componentName: MoneyComponentName.MoreSheetWhatYouGet,
      redirectTarget: MONEY_URLS.MONEY_LANDING,
    });
  });

  it('opens the support consent modal when contact support is clicked', async () => {
    renderWithLocalization(<MoneyMoreMenu />);

    await openMenu();
    fireEvent.click(screen.getByTestId('money-more-menu-contact-support'));

    expect(screen.queryByTestId('money-more-menu')).not.toBeInTheDocument();
    expect(screen.getByTestId('support-consent-modal')).toBeInTheDocument();
    expect(mockMoneyAnalytics.trackSurfaceClicked).toHaveBeenCalledWith({
      componentName: MoneyComponentName.MoreSheetContactSupport,
      redirectTarget: MONEY_URLS.METAMASK_SUPPORT,
    });

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
