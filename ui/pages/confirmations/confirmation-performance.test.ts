import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { it as jestIt } from '@jest/globals';
import { createMemoryRouter } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { genUnapprovedContractInteractionConfirmation } from '../../../test/data/confirmations/contract-interaction';
import { unapprovedPersonalSignMsg } from '../../../test/data/confirmations/personal_sign';
import { CONFIRM_TRANSACTION_ROUTE } from '../../helpers/constants/routes';
import { registerDocumentLoadMeasurement } from '../../helpers/utils/useful-screen-ready';
import type { Confirmation } from './types/confirm';
import {
  registerConfirmationMeasurement,
  useConfirmationReady,
} from './confirmation-performance';

jest.mock('../../helpers/utils/useful-screen-ready');
jest.mock('../../../shared/lib/environment-type');

describe('Transaction confirmation readiness', () => {
  const measurement = { reportReady: jest.fn(), discard: jest.fn() };
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation(),
    id: 'a',
    gasFeeEstimatesLoaded: false,
    simulationData: undefined,
  };
  let router: ReturnType<typeof createMemoryRouter>;
  const register = (
    overrides: Partial<
      Parameters<typeof registerConfirmationMeasurement>[0]
    > = {},
  ) =>
    registerConfirmationMeasurement(
      {
        isUnlocked: true,
        completedOnboarding: true,
        pendingApprovals: {
          b: { id: 'b', type: ApprovalType.Transaction, time: 2 },
          a: { id: 'a', type: ApprovalType.Transaction, time: 1 },
        },
        ...overrides,
      },
      router,
    );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    jest.mocked(registerDocumentLoadMeasurement).mockReturnValue(measurement);
    router = createMemoryRouter([{ path: '*', element: null }]);
  });

  afterEach(() => {
    router.dispose();
    jest.useRealTimers();
  });

  jestIt.each([
    '/',
    CONFIRM_TRANSACTION_ROUTE,
    `${CONFIRM_TRANSACTION_ROUTE}/a`,
  ])(
    'reports the initial transaction from %s, including StrictMode and pending enrichment',
    async (path) => {
      await router.navigate(path);
      register();
      expect(registerDocumentLoadMeasurement).toHaveBeenCalledWith({
        screen: 'confirmation',
        tags: {
          'wallet.unlocked': true,
          'wallet.ui_type': ENVIRONMENT_TYPE_NOTIFICATION,
        },
      });
      if (path !== `${CONFIRM_TRANSACTION_ROUTE}/a`) {
        await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/a`, {
          replace: true,
        });
        await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/a`, {
          replace: true,
        });
      }
      renderHook(() => useConfirmationReady(transaction), {
        wrapper: StrictMode,
      });
      expect(measurement.reportReady).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(48));
      await router.navigate('/');
      expect(measurement.reportReady).toHaveBeenCalledTimes(1);
      expect(measurement.discard).not.toHaveBeenCalled();
    },
  );

  jestIt.each<Partial<Parameters<typeof registerConfirmationMeasurement>[0]>>([
    { isUnlocked: false },
    { completedOnboarding: false },
    { pendingApprovals: {} },
    {
      pendingApprovals: {
        signature: { id: 'signature', type: 'personal_sign', time: 0 },
        a: { id: 'a', type: ApprovalType.Transaction, time: 1 },
      },
    },
  ])('excludes initial wallet state %j', (state) => {
    register(state);
    renderHook(() => useConfirmationReady(transaction));
    act(() => jest.advanceTimersByTime(48));
    expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
    expect(measurement.reportReady).not.toHaveBeenCalled();
  });

  jestIt.each([
    '/settings',
    `${CONFIRM_TRANSACTION_ROUTE}/a/signature`,
    `${CONFIRM_TRANSACTION_ROUTE}/missing`,
  ])('excludes an initial route %s', async (path) => {
    await router.navigate(path);
    register();
    await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/a`);
    renderHook(() => useConfirmationReady(transaction));
    act(() => jest.advanceTimersByTime(48));
    expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
  });

  it('uses the explicitly requested transaction instead of the oldest approval', async () => {
    await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/b`);
    register();
    renderHook(() => useConfirmationReady({ ...transaction, id: 'b' }));
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
  });

  it('waits through loading, signatures, and other transactions for the original info', () => {
    register();
    const { rerender } = renderHook(
      ({ confirmation }: { confirmation?: Confirmation }) =>
        useConfirmationReady(confirmation),
      { initialProps: {} },
    );
    act(() => jest.advanceTimersByTime(48));
    rerender({ confirmation: unapprovedPersonalSignMsg });
    act(() => jest.advanceTimersByTime(48));
    rerender({ confirmation: { ...transaction, id: 'b' } });
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.reportReady).not.toHaveBeenCalled();
    rerender({ confirmation: transaction });
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
  });

  jestIt.each([false, true])(
    'excludes request switching after mounting: %s',
    async (mountBeforeNavigation) => {
      await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/a`);
      register();
      if (mountBeforeNavigation) {
        renderHook(() => useConfirmationReady(transaction));
      }
      await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/b`, {
        replace: true,
      });
      await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/a`, {
        replace: true,
      });
      renderHook(() => useConfirmationReady(transaction));
      act(() => jest.advanceTimersByTime(48));
      expect(measurement.discard).toHaveBeenCalledTimes(1);
      expect(measurement.reportReady).not.toHaveBeenCalled();
    },
  );

  it('excludes user navigation in place of the startup redirect', async () => {
    register();
    await router.navigate(`${CONFIRM_TRANSACTION_ROUTE}/a`);
    renderHook(() => useConfirmationReady(transaction));
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.discard).toHaveBeenCalledTimes(1);
    expect(measurement.reportReady).not.toHaveBeenCalled();
  });
});
