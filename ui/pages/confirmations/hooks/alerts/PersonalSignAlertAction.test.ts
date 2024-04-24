import { ApprovalType } from '@metamask/controller-utils';
import { useHistory } from 'react-router-dom';
import { SWAPS_ROUTE } from '../../../../helpers/constants/routes';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  usePersonalSignAlertActions,
  PersonalSignAlertAction,
} from './PersonalSignAlertAction';

// Mock useHistory
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

// Mock currentConfirmation
const mockCurrentConfirmation = {
  id: '1',
  type: ApprovalType.PersonalSign,
};

describe('usePersonalSignAlertActions', () => {
  beforeAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';
  });

  afterAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
  });

  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue({ push: mockHistoryPush });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('navigates to SWAPS_ROUTE when actionKey is GoToSwapPage', () => {
    const { result } = renderHookWithProvider(
      () => usePersonalSignAlertActions(),
      {
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
            redesignedConfirmations: true,
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
      },
    );

    const processAction = result.current;
    processAction(PersonalSignAlertAction.GoToSwapPage);

    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith(SWAPS_ROUTE);
  });

  it('does not navigate to swaps when current confirmation type is not Personal Sign', () => {
    mockCurrentConfirmation.type = ApprovalType.EthSign;

    const { result } = renderHookWithProvider(
      () => usePersonalSignAlertActions(),
      mockState,
    );
    const processAction = result.current;

    processAction(PersonalSignAlertAction.GoToSwapPage);

    expect(mockHistoryPush).toHaveBeenCalledTimes(0);
  });
});
