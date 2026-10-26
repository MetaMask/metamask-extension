import { AccountOverviewTabKey } from '../../../../shared/constants/app-state';
import { getAttentionRequiredApprovalCount } from '../approval/utils';
import { NOTIFICATION_MANAGER_EVENTS } from '../notification-manager';
import {
  createBadgeManager,
  getBadgeLabel,
  type BadgeManagerController,
  type BadgeManagerNotificationManager,
} from './badge-manager';

jest.mock('../../../../shared/lib/mv3.utils', () => ({
  isManifestV3: true,
}));

jest.mock('../approval/utils', () => ({
  getAttentionRequiredApprovalCount: jest.fn(() => 0),
}));

const mockGetAttentionRequiredApprovalCount =
  getAttentionRequiredApprovalCount as jest.MockedFunction<
    typeof getAttentionRequiredApprovalCount
  >;

function createMockBrowser() {
  return {
    action: {
      setBadgeText: jest.fn(),
      setBadgeBackgroundColor: jest.fn(),
    },
    browserAction: {
      setBadgeText: jest.fn(),
      setBadgeBackgroundColor: jest.fn(),
    },
  };
}

function createMockController(): BadgeManagerController & {
  subscribe: jest.Mock;
  hubOn: jest.Mock;
  setDefaultHomeActiveTabName: jest.Mock;
  rejectUnapproved: jest.Mock;
  rejectDecrypt: jest.Mock;
  rejectEncryption: jest.Mock;
  rejectAllPendingApprovals: jest.Mock;
} {
  const subscribe = jest.fn();
  const hubOn = jest.fn();
  const setDefaultHomeActiveTabName = jest.fn();
  const rejectUnapproved = jest.fn();
  const rejectDecrypt = jest.fn();
  const rejectEncryption = jest.fn();
  const rejectAllPendingApprovals = jest.fn();

  return {
    approvalController: {
      state: { pendingApprovals: {} },
    } as BadgeManagerController['approvalController'],
    appStateController: {
      setDefaultHomeActiveTabName,
    },
    controllerMessenger: {
      subscribe,
    },
    signatureController: {
      hub: { on: hubOn },
      rejectUnapproved,
    },
    decryptMessageController: {
      rejectUnapproved: rejectDecrypt,
    },
    encryptionPublicKeyController: {
      rejectUnapproved: rejectEncryption,
    },
    legacyBackgroundApiService: {
      rejectAllPendingApprovals,
    },
    subscribe,
    hubOn,
    setDefaultHomeActiveTabName,
    rejectUnapproved,
    rejectDecrypt,
    rejectEncryption,
    rejectAllPendingApprovals,
  };
}

function createNotificationManager(): BadgeManagerNotificationManager & {
  emit: (event: string, payload: { automaticallyClosed?: boolean }) => void;
} {
  let listener:
    | ((payload: { automaticallyClosed?: boolean }) => void)
    | undefined;

  return {
    on: (_event, nextListener) => {
      listener = nextListener;
    },
    emit: (_event, payload) => {
      listener?.(payload);
    },
  };
}

function getTransactionHandler(subscribe: jest.Mock) {
  const call = subscribe.mock.calls.find(
    ([event]: [string]) =>
      event === 'TransactionController:transactionStatusUpdated',
  );
  return call?.[1] as (payload: unknown) => void;
}

describe('getBadgeLabel', () => {
  it('returns the count when it does not exceed the maximum', () => {
    expect(getBadgeLabel(3, 9)).toBe('3');
  });

  it('returns a plus suffix when the count exceeds the maximum', () => {
    expect(getBadgeLabel(10, 9)).toBe('9+');
  });
});

describe('createBadgeManager', () => {
  const triggerUi = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAttentionRequiredApprovalCount.mockReturnValue(0);
  });

  function setup(
    overrides: {
      hasPersistentUiOpen?: () => boolean;
      isOnlyNotificationOpen?: () => boolean;
    } = {},
  ) {
    const controller = createMockController();
    const extensionBrowser = createMockBrowser();
    const notificationManager = createNotificationManager();
    const api = createBadgeManager({
      getController: () => controller,
      browser: extensionBrowser,
      notificationManager,
      triggerUi,
      hasPersistentUiOpen: overrides.hasPersistentUiOpen ?? (() => false),
      isOnlyNotificationOpen: overrides.isOnlyNotificationOpen ?? (() => false),
    });

    return { api, controller, extensionBrowser, notificationManager };
  }

  it('sets a blue pending-approval badge when there are no failed transactions', () => {
    mockGetAttentionRequiredApprovalCount.mockReturnValue(2);
    const { extensionBrowser } = setup();

    expect(extensionBrowser.action.setBadgeText).toHaveBeenCalledWith({
      text: '2',
    });
    expect(
      extensionBrowser.action.setBadgeBackgroundColor,
    ).toHaveBeenCalledWith({
      color: '#0376C9',
    });
  });

  it('sets a red failed-tx badge over pending approvals', () => {
    mockGetAttentionRequiredApprovalCount.mockReturnValue(4);
    const { controller, extensionBrowser } = setup();
    const onTransactionStatusUpdated = getTransactionHandler(
      controller.subscribe,
    );

    onTransactionStatusUpdated({
      transactionMeta: {
        status: 'failed',
        chainId: '0x1',
        txParams: { from: '0xABC', nonce: '0x1' },
      },
    });

    expect(extensionBrowser.action.setBadgeText).toHaveBeenLastCalledWith({
      text: '1',
    });
    expect(
      extensionBrowser.action.setBadgeBackgroundColor,
    ).toHaveBeenLastCalledWith({
      color: expect.any(String),
    });
    expect(
      extensionBrowser.action.setBadgeBackgroundColor.mock.calls.at(-1)?.[0]
        .color,
    ).not.toBe('#0376C9');
  });

  it('defers the failed-tx badge while only the notification is open', () => {
    mockGetAttentionRequiredApprovalCount.mockReturnValue(3);
    const { controller, extensionBrowser } = setup({
      isOnlyNotificationOpen: () => true,
    });
    const onTransactionStatusUpdated = getTransactionHandler(
      controller.subscribe,
    );

    onTransactionStatusUpdated({
      transactionMeta: { status: 'dropped' },
    });

    expect(extensionBrowser.action.setBadgeText).toHaveBeenLastCalledWith({
      text: '3',
    });
    expect(controller.setDefaultHomeActiveTabName).not.toHaveBeenCalled();
  });

  it('skips failed-tx tracking when persistent UI is open', () => {
    const { api, controller } = setup({
      hasPersistentUiOpen: () => true,
    });
    const onTransactionStatusUpdated = getTransactionHandler(
      controller.subscribe,
    );

    onTransactionStatusUpdated({
      transactionMeta: { status: 'failed' },
    });

    expect(api.getFailedTxCount()).toBe(0);
    expect(controller.setDefaultHomeActiveTabName).not.toHaveBeenCalled();
  });

  it('ignores duplicate failed nonces', () => {
    const { api, controller } = setup();
    const onTransactionStatusUpdated = getTransactionHandler(
      controller.subscribe,
    );
    const payload = {
      transactionMeta: {
        status: 'failed' as const,
        chainId: '0x1',
        txParams: { from: '0xABC', nonce: '0x5' },
      },
    };

    onTransactionStatusUpdated(payload);
    onTransactionStatusUpdated(payload);

    expect(api.getFailedTxCount()).toBe(1);
  });

  it('sets the Activity landing tab for a failed transaction', () => {
    const { controller } = setup();
    const onTransactionStatusUpdated = getTransactionHandler(
      controller.subscribe,
    );

    onTransactionStatusUpdated({
      transactionMeta: { status: 'failed' },
    });

    expect(controller.setDefaultHomeActiveTabName).toHaveBeenCalledWith(
      AccountOverviewTabKey.Activity,
    );
  });

  it('clears failed-tx state and restores the pending-approval badge', () => {
    mockGetAttentionRequiredApprovalCount.mockReturnValue(2);
    const { api, controller, extensionBrowser } = setup();
    const onTransactionStatusUpdated = getTransactionHandler(
      controller.subscribe,
    );

    onTransactionStatusUpdated({
      transactionMeta: { status: 'failed' },
    });
    api.clearFailedTxBadge();

    expect(api.getFailedTxCount()).toBe(0);
    expect(extensionBrowser.action.setBadgeText).toHaveBeenLastCalledWith({
      text: '2',
    });
  });

  it('rejects unapproved notifications when the popup is closed by the user', () => {
    const { controller, notificationManager } = setup();

    notificationManager.emit(NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED, {
      automaticallyClosed: false,
    });

    expect(controller.rejectUnapproved).toHaveBeenCalled();
    expect(controller.rejectDecrypt).toHaveBeenCalled();
    expect(controller.rejectEncryption).toHaveBeenCalled();
    expect(controller.rejectAllPendingApprovals).toHaveBeenCalled();
    expect(triggerUi).not.toHaveBeenCalled();
  });

  it('reopens the UI when an auto-closed notification still has pending approvals', () => {
    mockGetAttentionRequiredApprovalCount.mockReturnValue(1);
    const { notificationManager } = setup();

    notificationManager.emit(NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED, {
      automaticallyClosed: true,
    });

    expect(triggerUi).toHaveBeenCalled();
  });

  it('subscribes to badge-related controller events', () => {
    const { controller } = setup();

    expect(controller.subscribe).toHaveBeenCalledWith(
      'ApprovalController:stateChange',
      expect.any(Function),
    );
    expect(controller.hubOn).toHaveBeenCalledWith(
      'updateBadge',
      expect.any(Function),
    );
  });
});
