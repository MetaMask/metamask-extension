import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionUserEvent } from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../../test/jest/rendering';
import * as actions from '../../../store/actions';
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';
import ShieldEntryModal from './shield-entry-modal';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('Shield Entry Modal', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
      metaMetricsId: '0x00000000',
    },
    appState: {
      shieldEntryModal: {
        show: true,
        shouldSubmitEvents: false,
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
  });

  it('should render', () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const shieldEntryModal = getByTestId('shield-entry-modal');
    expect(shieldEntryModal).toBeInTheDocument();
  });

  it('should call onClose when the skip button is clicked', () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const skipButton = getByTestId('shield-entry-modal-skip-button');
    fireEvent.click(skipButton);
    expect(setShowShieldEntryModalOnceSpy).toHaveBeenCalledWith(false);
  });

  it('should call onGetStarted when the get started button is clicked', async () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const getStartedButton = getByTestId(
      'shield-entry-modal-get-started-button',
    );

    fireEvent.click(getStartedButton);
    expect(setShowShieldEntryModalOnceSpy).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(SHIELD_PLAN_ROUTE);
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

    const skipButton = getByTestId('shield-entry-modal-skip-button');
    fireEvent.click(skipButton);
    await waitFor(() => {
      expect(submitSubscriptionUserEventsSpy).toHaveBeenCalledWith({
        event: SubscriptionUserEvent.ShieldEntryModalViewed,
      });
      expect(setShowShieldEntryModalOnceSpy).toHaveBeenCalledWith(false);
    });
  });
});
