import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
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
      showShieldEntryModalOnce: {
        show: true,
        shouldSubmitEvents: false,
      },
    },
  };
  const mockStore = configureMockStore([thunk])(mockState);
  let setShowShieldEntryModalOnceStub: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    setShowShieldEntryModalOnceStub = jest
      .spyOn(actions, 'setShowShieldEntryModalOnce')
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
    expect(setShowShieldEntryModalOnceStub).toHaveBeenCalledWith(false);
  });

  it('should call onGetStarted when the get started button is clicked', async () => {
    const { getByTestId } = renderWithProvider(<ShieldEntryModal />, mockStore);

    const getStartedButton = getByTestId(
      'shield-entry-modal-get-started-button',
    );

    fireEvent.click(getStartedButton);
    expect(setShowShieldEntryModalOnceStub).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(SHIELD_PLAN_ROUTE);
    });
  });
});
