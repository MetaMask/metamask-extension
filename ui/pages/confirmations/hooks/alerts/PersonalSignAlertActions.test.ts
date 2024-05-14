import { ApprovalType } from '@metamask/controller-utils';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { SWAPS_ROUTE } from '../../../../helpers/constants/routes';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  usePersonalSignAlertActions,
  PersonalSignAlertAction,
} from './PersonalSignAlertActions';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

describe('usePersonalSignAlertActions', () => {
  beforeAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';
  });

  afterAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
  });

  const mockHistoryPush = jest.fn();
  const mockDispatch = jest.fn();

  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue({ push: mockHistoryPush });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mockExpectedState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      unapprovedPersonalMsgs: {
        '1': {
          id: '1',
          msgParams: {},
          type: ApprovalType.PersonalSign,
        },
      },
      pendingApprovals: {
        '1': {
          id: '1',
          origin: 'origin',
          time: Date.now(),
          type: ApprovalType.PersonalSign,
          requestData: {},
          requestState: null,
          expectsResult: false,
        },
      },
      preferences: {
        redesignedConfirmationsEnabled: true,
      },
    },
    confirm: {
      currentConfirmation: {
        id: '1',
        status: 'unapproved',
        time: new Date().getTime(),
        type: ApprovalType.PersonalSign,
      },
    },
  };

  it('navigates to SWAPS_ROUTE when actionKey is GoToSwapPage', () => {
    const { result } = renderHookWithProvider(
      () => usePersonalSignAlertActions(),
      mockExpectedState,
    );

    const processAction = result.current;
    processAction(PersonalSignAlertAction.GoToSwapPage);

    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(SWAPS_ROUTE);
  });

  it('dispatches showLoadingIndication when actionKey is DispatchAction', () => {
    const { result } = renderHookWithProvider(
      () => usePersonalSignAlertActions(),
      mockExpectedState,
    );

    const processAction = result.current;
    processAction(PersonalSignAlertAction.DispatchAction);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SHOW_LOADING_INDICATION',
      payload: undefined,
    });
  });

  it('does not navigate to swaps when current confirmation type is not Personal Sign', () => {
    const { result } = renderHookWithProvider(
      () => usePersonalSignAlertActions(),
      mockState,
    );
    const processAction = result.current;

    processAction(PersonalSignAlertAction.GoToSwapPage);

    expect(mockHistoryPush).toHaveBeenCalledTimes(0);
  });
});
