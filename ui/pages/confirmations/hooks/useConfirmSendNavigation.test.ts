import { TransactionType } from '@metamask/transaction-controller';

import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import * as ConfirmContext from '../context/confirm';
import { SEND_TRANSACTION_TYPES } from '../constants/send';
import { useConfirmSendNavigation } from './useConfirmSendNavigation';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => async (fn: () => Promise<unknown>) => {
    if (fn) {
      await fn();
    }
  },
}));

describe('useConfirmSendNavigation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderHook = () => {
    const { result } = renderHookWithProvider(
      useConfirmSendNavigation,
      mockState,
    );
    return result.current;
  };

  const DRAFT_ROUTE = '/send/amount-recipient?amount=1';

  const mockContext = ({
    origin,
    type,
    backTo,
    setExitTarget,
  }: {
    origin: string;
    type: string;
    backTo: string | undefined;
    setExitTarget: jest.Mock;
  }) => {
    jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
      currentConfirmation: { id: 'tx-1', origin, type },
      backTo,
      setExitTarget,
    } as unknown as ConfirmContext.ConfirmContextType);
  };

  it('returns returnToSendDraftIfSend method', () => {
    jest
      .spyOn(ConfirmContext, 'useConfirmContext')
      .mockReturnValue({} as unknown as ConfirmContext.ConfirmContextType);

    const result = renderHook();

    expect(result.returnToSendDraftIfSend).toBeDefined();
  });

  for (const type of SEND_TRANSACTION_TYPES) {
    it(`sets the draft exit target for metamask ${type}`, () => {
      const setExitTarget = jest.fn();
      mockContext({
        origin: ORIGIN_METAMASK,
        type,
        backTo: DRAFT_ROUTE,
        setExitTarget,
      });

      const result = renderHook();

      expect(result.returnToSendDraftIfSend()).toBe(true);
      expect(setExitTarget).toHaveBeenCalledWith({
        confirmationId: 'tx-1',
        route: DRAFT_ROUTE,
      });
    });
  }

  // The auto-exit effect is the only navigator on the exit path; a second
  // navigate() here is what landed send Back on Home (CONF-1865).
  it('does not navigate itself when setting the draft exit target', () => {
    const setExitTarget = jest.fn();
    mockContext({
      origin: ORIGIN_METAMASK,
      type: TransactionType.simpleSend,
      backTo: DRAFT_ROUTE,
      setExitTarget,
    });

    renderHook().returnToSendDraftIfSend();

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  const nonSendCases: {
    condition: string;
    origin: string;
    type: TransactionType;
  }[] = [
    {
      condition: 'origin is not metamask',
      origin: 'dapp',
      type: TransactionType.simpleSend,
    },
    {
      condition: 'type is not a send',
      origin: ORIGIN_METAMASK,
      type: TransactionType.contractInteraction,
    },
    {
      condition: 'both origin and type do not match',
      origin: 'dapp',
      type: TransactionType.contractInteraction,
    },
  ];

  for (const { condition, origin, type } of nonSendCases) {
    it(`sets no exit target when ${condition}`, () => {
      const setExitTarget = jest.fn();
      mockContext({ origin, type, backTo: DRAFT_ROUTE, setExitTarget });

      const result = renderHook();

      expect(result.returnToSendDraftIfSend()).toBe(false);
      expect(setExitTarget).not.toHaveBeenCalled();
    });
  }

  it('sets no exit target when backTo is absent, so the default exit applies', () => {
    const setExitTarget = jest.fn();
    mockContext({
      origin: ORIGIN_METAMASK,
      type: TransactionType.simpleSend,
      backTo: undefined,
      setExitTarget,
    });

    const result = renderHook();

    expect(result.returnToSendDraftIfSend()).toBe(false);
    expect(setExitTarget).not.toHaveBeenCalled();
  });
});
