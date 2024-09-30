import type { TransactionMeta } from '@metamask/transaction-controller';
import type { KeyringObject } from '@metamask/keyring-controller';
import type { Hex } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { KeyringType } from '../../../../shared/constants/keyring';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedApproveConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
  LEDGER_USB_VENDOR_ID,
  HardwareTransportStates,
} from '../../../../shared/constants/hardware-wallets';
import * as appActions from '../../../ducks/app/app';
import { attemptLedgerTransportCreation } from '../../../store/actions';
import useLedgerConnection from './useLedgerConnection';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  attemptLedgerTransportCreation: jest.fn(),
}));

type RootState = {
  metamask: Record<string, unknown>;
  appState: Record<string, unknown>;
} & Record<string, unknown>;

const MOCK_LEDGER_ACCOUNT = '0x1234567890abcdef1234567890abcdef12345678';

const updateLedgerHardwareAccounts = (keyrings: KeyringObject[]) => {
  const ledgerHardwareIndex = keyrings.findIndex(
    (keyring) => keyring.type === KeyringType.ledger,
  );

  if (ledgerHardwareIndex === -1) {
    // If 'Ledger Hardware' does not exist, create a new entry
    keyrings.push({
      type: KeyringType.ledger,
      accounts: [MOCK_LEDGER_ACCOUNT],
    });
  } else {
    // If 'Ledger Hardware' exists, update its accounts
    keyrings[ledgerHardwareIndex].accounts = [MOCK_LEDGER_ACCOUNT];
  }

  return keyrings;
};

const generateUnapprovedConfirmationOnLedgerState = (address: Hex) => {
  const transactionMeta = genUnapprovedApproveConfirmation({
    address,
    chainId: '0x5',
  }) as TransactionMeta;

  const clonedState = cloneDeep(
    getMockConfirmStateForTransaction(transactionMeta),
  ) as RootState;

  clonedState.metamask.keyrings = updateLedgerHardwareAccounts(
    clonedState.metamask.keyrings as KeyringObject[],
  );

  clonedState.metamask.ledgerTransportType = LedgerTransportTypes.webhid;

  return clonedState;
};

describe('useLedgerConnection', () => {
  const mockAttemptLedgerTransportCreation = jest.mocked(
    attemptLedgerTransportCreation,
  );

  let state: RootState;
  let originalNavigatorHid: HID;

  beforeEach(() => {
    originalNavigatorHid = window.navigator.hid;
    jest.resetAllMocks();
    Object.defineProperty(window.navigator, 'hid', {
      value: {
        getDevices: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve([{ vendorId: Number(LEDGER_USB_VENDOR_ID) }]),
          ),
      },
      configurable: true,
    });

    state = generateUnapprovedConfirmationOnLedgerState(MOCK_LEDGER_ACCOUNT);
  });

  afterAll(() => {
    Object.defineProperty(window.navigator, 'hid', {
      value: originalNavigatorHid,
      configurable: true,
    });
  });

  describe('checks hid devices initially', () => {
    it('set LedgerWebHidConnectedStatus to connected if it finds Ledger hid', async () => {
      const spyOnSetLedgerWebHidConnectedStatus = jest.spyOn(
        appActions,
        'setLedgerWebHidConnectedStatus',
      );

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.notConnected;

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerWebHidConnectedStatus).toHaveBeenCalledWith(
        WebHIDConnectedStatuses.connected,
      );
    });

    it('set LedgerWebHidConnectedStatus to notConnected if it does not find Ledger hid', async () => {
      const spyOnSetLedgerWebHidConnectedStatus = jest.spyOn(
        appActions,
        'setLedgerWebHidConnectedStatus',
      );

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.unknown;

      (window.navigator.hid.getDevices as jest.Mock).mockImplementationOnce(
        () => Promise.resolve([]),
      );

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerWebHidConnectedStatus).toHaveBeenCalledWith(
        WebHIDConnectedStatuses.notConnected,
      );
    });
  });

  describe('determines transport status', () => {
    it('set LedgerTransportStatus to verified if transport creation is successful', async () => {
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      mockAttemptLedgerTransportCreation.mockResolvedValue(true);

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.connected;
      state.appState.ledgerTransportStatus = HardwareTransportStates.none;

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerTransportStatus).toHaveBeenCalledWith(
        HardwareTransportStates.verified,
      );
    });

    it('set LedgerTransportStatus to unknownFailure if transport creation fails', async () => {
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      mockAttemptLedgerTransportCreation.mockResolvedValue(false);

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.connected;
      state.appState.ledgerTransportStatus = HardwareTransportStates.none;

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerTransportStatus).toHaveBeenCalledWith(
        HardwareTransportStates.unknownFailure,
      );
    });

    it('set LedgerTransportStatus to deviceOpenFailure if device open fails', async () => {
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      mockAttemptLedgerTransportCreation.mockRejectedValue(
        new Error('Failed to open the device'),
      );

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.connected;
      state.appState.ledgerTransportStatus = HardwareTransportStates.none;

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerTransportStatus).toHaveBeenCalledWith(
        HardwareTransportStates.deviceOpenFailure,
      );
    });

    it('set LedgerTransportStatus to verified if device is already open', async () => {
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      mockAttemptLedgerTransportCreation.mockRejectedValue(
        new Error('the device is already open'),
      );

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.connected;
      state.appState.ledgerTransportStatus = HardwareTransportStates.none;

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerTransportStatus).toHaveBeenCalledWith(
        HardwareTransportStates.verified,
      );
    });

    it('set LedgerTransportStatus to unknownFailure if an unknown error occurs', async () => {
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      mockAttemptLedgerTransportCreation.mockRejectedValue(
        new Error('Unknown error'),
      );

      state.appState.ledgerWebHidConnectedStatus =
        WebHIDConnectedStatuses.connected;
      state.appState.ledgerTransportStatus = HardwareTransportStates.none;

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerTransportStatus).toHaveBeenCalledWith(
        HardwareTransportStates.unknownFailure,
      );
    });
  });

  it('reset LedgerTransportStatus to none on unmount', () => {
    const spyOnSetLedgerTransportStatus = jest.spyOn(
      appActions,
      'setLedgerTransportStatus',
    );

    const { unmount } = renderHookWithConfirmContextProvider(
      useLedgerConnection,
      state,
    );

    unmount();

    expect(spyOnSetLedgerTransportStatus).toHaveBeenCalledWith(
      HardwareTransportStates.none,
    );
  });

  describe('does nothing', () => {
    it('when address is not a ledger address', async () => {
      const spyOnSetLedgerWebHidConnectedStatus = jest.spyOn(
        appActions,
        'setLedgerWebHidConnectedStatus',
      );
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      // Set state to have empty keyrings, simulating a non-Ledger address
      state.metamask.keyrings = [];

      renderHookWithConfirmContextProvider(useLedgerConnection, state);

      await flushPromises();

      expect(spyOnSetLedgerWebHidConnectedStatus).not.toHaveBeenCalled();
      expect(spyOnSetLedgerTransportStatus).not.toHaveBeenCalled();
    });

    it('when from address is not defined in currentConfirmation', async () => {
      const tempState = generateUnapprovedConfirmationOnLedgerState(
        undefined as unknown as Hex,
      );

      const spyOnSetLedgerWebHidConnectedStatus = jest.spyOn(
        appActions,
        'setLedgerWebHidConnectedStatus',
      );
      const spyOnSetLedgerTransportStatus = jest.spyOn(
        appActions,
        'setLedgerTransportStatus',
      );

      renderHookWithConfirmContextProvider(useLedgerConnection, tempState);

      await flushPromises();

      expect(spyOnSetLedgerWebHidConnectedStatus).not.toHaveBeenCalled();
      expect(spyOnSetLedgerTransportStatus).not.toHaveBeenCalled();
    });
  });
});
