import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionUserEvent } from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/jest/rendering';
import * as actions from '../../../store/actions';
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';
import MockState from '../../../../test/data/mock-state.json';
import ShieldEntryModal from './shield-entry-modal';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

jest.mock('./shield-illustration-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="shield-illustration-animation" />,
}));

describe('Shield Entry Modal', () => {
  const mockState = {
    ...MockState,
    appState: {
      ...MockState.appState,
      shieldEntryModal: {
        show: true,
        shouldSubmitEvents: false,
        triggeringCohort: 'cohort-1',
      },
    },
  };
  const mockStore = configureMockStore([thunk])(mockState);
  let setShowShieldEntryModalOnceSpy: jest.SpyInstance;
  let submitSubscriptionUserEventsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    setShowShieldEntryModalOnceSpy = jest
      .spyOn(actions, 'setShowShieldEntryModalOnce')
      .mockReturnValueOnce(jest.fn().mockResolvedValueOnce(true));
    submitSubscriptionUserEventsSpy = jest
      .spyOn(actions, 'submitSubscriptionUserEvents')
      .mockReturnValueOnce(jest.fn().mockResolvedValueOnce(true));
    mockUseLocation.mockReturnValue({
      pathname: '/any-other-path',
      search: '',
    });
  });

  it('should render', () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const shieldEntryModal = getByTestId('shield-entry-modal');
    expect(shieldEntryModal).toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const closeButton = getByTestId('shield-entry-modal-close-button');
    fireEvent.click(closeButton);
    expect(setShowShieldEntryModalOnceSpy).toHaveBeenCalledWith({
      show: false,
      hasUserInteractedWithModal: true,
    });
  });

  it('should call onGetStarted when the get started button is clicked', async () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const getStartedButton = getByTestId(
      'shield-entry-modal-get-started-button',
    );

    fireEvent.click(getStartedButton);
    expect(setShowShieldEntryModalOnceSpy).toHaveBeenCalledWith({
      show: false,
      hasUserInteractedWithModal: true,
    });
    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith({
        pathname: SHIELD_PLAN_ROUTE,
        search: '?source=homepage',
      });
    });
  });

  it('should submit user event when `shieldEntryModal.shouldSubmitEvents` is true', async () => {
    const customStore = configureMockStore([thunk])({
      ...mockState,
      appState: {
        ...mockState.appState,
        shieldEntryModal: {
          ...mockState.appState.shieldEntryModal,
          shouldSubmitEvents: true,
        },
      },
    });
    const { getByTestId } = renderWithProvider(
      <ShieldEntryModal />,
      customStore,
    );

    const skipButton = getByTestId('shield-entry-modal-close-button');
    fireEvent.click(skipButton);
    await waitFor(() => {
      expect(submitSubscriptionUserEventsSpy).toHaveBeenCalledWith({
        event: SubscriptionUserEvent.ShieldEntryModalViewed,
        cohort: mockState.appState.shieldEntryModal.triggeringCohort,
      });
      expect(setShowShieldEntryModalOnceSpy).toHaveBeenCalledWith({
        show: false,
        hasUserInteractedWithModal: true,
      });
    });
  });
});
