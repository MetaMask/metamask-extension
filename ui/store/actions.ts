// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck `redux-thunk` and `@reduxjs/toolkit` are not compatible with
// TypeScript 5.3.3. We can't update them because we rely on an old version of
// @reduxjs/toolkit to be patched by our patch files. The patch is 6000+ lines.
// I don't want to try to figure that one out.
import { ReactFragment } from 'react';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { capitalize, isEqual } from 'lodash';
import { ThunkAction } from 'redux-thunk';
import { Action, AnyAction } from 'redux';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import type { Hex, Json } from '@metamask/utils';
import {
  AssetsContractController,
  BalanceMap,
  Nft,
  Token,
} from '@metamask/assets-controllers';
import { PayloadAction } from '@reduxjs/toolkit';
import { GasFeeController } from '@metamask/gas-fee-controller';
import { PermissionsRequest } from '@metamask/permission-controller';
import { NonEmptyArray } from '@metamask/controller-utils';
import {
  SetNameRequest,
  UpdateProposedNamesRequest,
  UpdateProposedNamesResult,
} from '@metamask/name-controller';
import {
  TransactionMeta,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  NetworkClientId,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { InterfaceState } from '@metamask/snaps-sdk';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import switchDirection from '../../shared/lib/switch-direction';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ORIGIN_METAMASK,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../../shared/constants/app';
import { getEnvironmentType, addHexPrefix } from '../../app/scripts/lib/util';
import {
  getMetaMaskAccounts,
  getPermittedAccountsForCurrentTab,
  hasTransactionPendingApprovals,
  getApprovalFlows,
  getCurrentNetworkTransactions,
  getIsSigningQRHardwareTransaction,
  getNotifications,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getPermissionSubjects,
  getFirstSnapInstallOrUpdateRequest,
  ///: END:ONLY_INCLUDE_IF
  getInternalAccountByAddress,
  getSelectedInternalAccount,
  getInternalAccounts,
  getSelectedNetworkClientId,
} from '../selectors';
import {
  computeEstimatedGasLimit,
  initializeSendState,
  resetSendState,
  // NOTE: Until the send duck is typescript that this is importing a typedef
  // that does not have an explicit export statement. lets see if it breaks the
  // compiler
  DraftTransaction,
  SEND_STAGES,
} from '../ducks/send';
import { switchedToUnconnectedAccount } from '../ducks/alerts/unconnected-account';
import {
  getProviderConfig,
  getUnconnectedAccountAlertEnabledness,
} from '../ducks/metamask/metamask';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import {
  HardwareDeviceNames,
  LedgerTransportTypes,
  LEDGER_USB_VENDOR_ID,
} from '../../shared/constants/hardware-wallets';
import {
  MetaMetricsEventFragment,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
  MetaMetricsPageObject,
  MetaMetricsPageOptions,
  MetaMetricsPagePayload,
  MetaMetricsReferrerObject,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { parseSmartTransactionsError } from '../pages/swaps/swaps.util';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { getSmartTransactionsOptInStatus } from '../../shared/modules/selectors';
import { NOTIFICATIONS_EXPIRATION_DELAY } from '../helpers/constants/notifications';
import {
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from '../../shared/modules/i18n';
import { decimalToHex } from '../../shared/modules/conversion.utils';
import { TxGasFees, PriorityLevels } from '../../shared/constants/gas';
import { RPCDefinition } from '../../shared/constants/network';
import { EtherDenomination } from '../../shared/constants/common';
import {
  isErrorWithMessage,
  logErrorWithMessage,
} from '../../shared/modules/error';
import { ThemeType } from '../../shared/constants/preferences';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import { getMethodDataAsync } from '../../shared/lib/four-byte';
import { DecodedTransactionDataResponse } from '../../shared/types/transaction-decode';
import { LastInteractedConfirmationInfo } from '../pages/confirmations/types/confirm';
import { EndTraceRequest } from '../../shared/lib/trace';
import * as actionConstants from './actionConstants';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { updateCustodyState } from './institutional/institution-actions';
///: END:ONLY_INCLUDE_IF
import {
  generateActionId,
  callBackgroundMethod,
  submitRequestToBackground,
} from './background-connection';
import {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
  TemporaryMessageDataType,
} from './store';

type CustomGasSettings = {
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

export function goHome() {
  return {
    type: actionConstants.GO_HOME,
  };
}
// async actions

export function tryUnlockMetamask(
  password: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    dispatch(unlockInProgress());
    log.debug(`background.submitPassword`);

    return new Promise<void>((resolve, reject) => {
      callBackgroundMethod('submitPassword', [password], (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    })
      .then(() => {
        dispatch(unlockSucceeded());
        return forceUpdateMetamaskState(dispatch);
      })
      .then(() => {
        dispatch(hideLoadingIndication());
      })
      .catch((err) => {
        dispatch(unlockFailed(err.message));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}

/**
 * Adds a new account where all data is encrypted using the given password and
 * where all addresses are generated from a given seed phrase.
 *
 * @param password - The password.
 * @param seedPhrase - The seed phrase.
 * @returns The updated state of the keyring controller.
 */
export function createNewVaultAndRestore(
  password: string,
  seedPhrase: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.createNewVaultAndRestore`);

    // Encode the secret recovery phrase as an array of integers so that it is
    // serialized as JSON properly.
    const encodedSeedPhrase = Array.from(
      Buffer.from(seedPhrase, 'utf8').values(),
    );

    return new Promise<void>((resolve, reject) => {
      callBackgroundMethod(
        'createNewVaultAndRestore',
        [password, encodedSeedPhrase],
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        },
      );
    })
      .then(() => dispatch(unMarkPasswordForgotten()))
      .then(() => {
        dispatch(showAccountsPage());
        dispatch(hideLoadingIndication());
      })
      .catch((err) => {
        dispatch(displayWarning(err.message));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}

export function createNewVaultAndGetSeedPhrase(
  password: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    try {
      await createNewVault(password);
      const seedPhrase = await getSeedPhrase(password);
      return seedPhrase;
    } catch (error) {
      dispatch(displayWarning(error));
      if (isErrorWithMessage(error)) {
        throw new Error(error.message);
      } else {
        throw error;
      }
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function unlockAndGetSeedPhrase(
  password: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    try {
      await submitPassword(password);
      const seedPhrase = await getSeedPhrase(password);
      await forceUpdateMetamaskState(dispatch);
      return seedPhrase;
    } catch (error) {
      dispatch(displayWarning(error));
      if (isErrorWithMessage(error)) {
        throw new Error(error.message);
      } else {
        throw error;
      }
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function submitPassword(password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    callBackgroundMethod('submitPassword', [password], (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function createNewVault(password: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    callBackgroundMethod('createNewVaultAndKeychain', [password], (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(true);
    });
  });
}

export function verifyPassword(password: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    callBackgroundMethod('verifyPassword', [password], (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(true);
    });
  });
}

export async function getSeedPhrase(password: string) {
  const encodedSeedPhrase = await submitRequestToBackground<string>(
    'getSeedPhrase',
    [password],
  );
  return Buffer.from(encodedSeedPhrase).toString('utf8');
}

export function requestRevealSeedWords(
  password: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.verifyPassword`);

    try {
      await verifyPassword(password);
      const seedPhrase = await getSeedPhrase(password);
      return seedPhrase;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function tryReverseResolveAddress(
  address: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return () => {
    return new Promise<void>((resolve) => {
      callBackgroundMethod('tryReverseResolveAddress', [address], (err) => {
        if (err) {
          logErrorWithMessage(err);
        }
        resolve();
      });
    });
  };
}

export function resetAccount(): ThunkAction<
  Promise<string>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    return new Promise<string>((resolve, reject) => {
      callBackgroundMethod<string>('resetAccount', [], (err, account) => {
        dispatch(hideLoadingIndication());
        if (err) {
          if (isErrorWithMessage(err)) {
            dispatch(displayWarning(err.message));
          }
          reject(err);
          return;
        }

        log.info(`Transaction history reset for ${account}`);
        dispatch(showAccountsPage());
        resolve(account as string);
      });
    });
  };
}

export function removeAccount(
  address: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    try {
      await new Promise((resolve, reject) => {
        callBackgroundMethod('removeAccount', [address], (error, account) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(account);
        });
      });
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    log.info(`Account removed: ${address}`);
    dispatch(showAccountsPage());
  };
}

export function importNewAccount(
  strategy: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
  loadingMessage: ReactFragment,
): ThunkAction<
  Promise<MetaMaskReduxState['metamask']>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    let newState;

    dispatch(showLoadingIndication(loadingMessage));

    try {
      log.debug(`background.importAccountWithStrategy`);
      await submitRequestToBackground('importAccountWithStrategy', [
        strategy,
        args,
      ]);
      log.debug(`background.getState`);
      newState = await submitRequestToBackground<
        MetaMaskReduxState['metamask']
      >('getState');
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    return newState;
  };
}

export function addNewAccount(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  log.debug(`background.addNewAccount`);
  return async (dispatch, getState) => {
    const oldAccounts = getInternalAccounts(getState()).filter(
      (internalAccount) =>
        internalAccount.metadata.keyring.type === KeyringTypes.hd,
    );
    dispatch(showLoadingIndication());

    let addedAccountAddress;
    try {
      addedAccountAddress = await submitRequestToBackground('addNewAccount', [
        Object.keys(oldAccounts).length,
      ]);
    } catch (error) {
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    await forceUpdateMetamaskState(dispatch);
    return addedAccountAddress;
  };
}

export function checkHardwareStatus(
  deviceName: HardwareDeviceNames,
  hdPath: string,
): ThunkAction<Promise<boolean>, MetaMaskReduxState, unknown, AnyAction> {
  log.debug(`background.checkHardwareStatus`, deviceName, hdPath);
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    let unlocked = false;
    try {
      unlocked = await submitRequestToBackground<boolean>(
        'checkHardwareStatus',
        [deviceName, hdPath],
      );
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    await forceUpdateMetamaskState(dispatch);
    return unlocked;
  };
}

export function forgetDevice(
  deviceName: HardwareDeviceNames,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  log.debug(`background.forgetDevice`, deviceName);
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    try {
      await submitRequestToBackground('forgetDevice', [deviceName]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    await forceUpdateMetamaskState(dispatch);
  };
}

// TODO: Define an Account Type for the return type of this method and anywhere
// else dealing with accounts.
export function connectHardware(
  deviceName: HardwareDeviceNames,
  page: string,
  hdPath: string,
  t: (key: string) => string,
): ThunkAction<
  Promise<{ address: string }[]>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  log.debug(`background.connectHardware`, deviceName, page, hdPath);
  return async (dispatch, getState) => {
    const { ledgerTransportType } = getState().metamask;

    dispatch(
      showLoadingIndication(`Looking for your ${capitalize(deviceName)}...`),
    );

    let accounts: { address: string }[];
    try {
      if (
        deviceName === HardwareDeviceNames.ledger &&
        ledgerTransportType === LedgerTransportTypes.webhid
      ) {
        const connectedDevices = await window.navigator.hid.requestDevice({
          // The types for web hid were provided by @types/w3c-web-hid and may
          // not be fully formed or correct, because LEDGER_USB_VENDOR_ID is a
          // string and this integration with Navigator.hid works before
          // TypeScript. As a note, on the next declaration we convert the
          // LEDGER_USB_VENDOR_ID to a number for a different API so....
          // TODO: Get David Walsh's opinion here
          filters: [{ vendorId: LEDGER_USB_VENDOR_ID as unknown as number }],
        });
        const userApprovedWebHidConnection = connectedDevices.some(
          (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
        );
        if (!userApprovedWebHidConnection) {
          throw new Error(t('ledgerWebHIDNotConnectedErrorMessage'));
        }
      }

      accounts = await submitRequestToBackground<{ address: string }[]>(
        'connectHardware',
        [deviceName, page, hdPath],
      );
    } catch (error) {
      logErrorWithMessage(error);
      if (
        deviceName === HardwareDeviceNames.ledger &&
        ledgerTransportType === LedgerTransportTypes.webhid &&
        isErrorWithMessage(error) &&
        error.message.match('Failed to open the device')
      ) {
        dispatch(displayWarning(t('ledgerDeviceOpenFailureMessage')));
        throw new Error(t('ledgerDeviceOpenFailureMessage'));
      } else {
        if (deviceName !== HardwareDeviceNames.qr) {
          dispatch(displayWarning(error));
        }
        throw error;
      }
    } finally {
      dispatch(hideLoadingIndication());
    }

    await forceUpdateMetamaskState(dispatch);
    return accounts;
  };
}

export function unlockHardwareWalletAccounts(
  indexes: string[],
  deviceName: HardwareDeviceNames,
  hdPath: string,
  hdPathDescription: string,
): ThunkAction<Promise<undefined>, MetaMaskReduxState, unknown, AnyAction> {
  log.debug(
    `background.unlockHardwareWalletAccount`,
    indexes,
    deviceName,
    hdPath,
    hdPathDescription,
  );
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    for (const index of indexes) {
      try {
        await submitRequestToBackground('unlockHardwareWalletAccount', [
          index,
          deviceName,
          hdPath,
          hdPathDescription,
        ]);
      } catch (err) {
        logErrorWithMessage(err);
        dispatch(displayWarning(err));
        dispatch(hideLoadingIndication());
        throw err;
      }
    }

    dispatch(hideLoadingIndication());
    return undefined;
  };
}

export function showQrScanner(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      showModal({
        name: 'QR_SCANNER',
      }),
    );
  };
}

export function setCurrentCurrency(
  currencyCode: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setCurrentCurrency`);
    try {
      await submitRequestToBackground('setCurrentCurrency', [currencyCode]);
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function decryptMsgInline(
  decryptedMsgData: TemporaryMessageDataType['msgParams'],
): ThunkAction<
  Promise<TemporaryMessageDataType>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  log.debug('action - decryptMsgInline');
  return async (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`actions calling background.decryptMessageInline`);

    let newState;
    try {
      newState = await submitRequestToBackground<
        MetaMaskReduxState['metamask']
      >('decryptMessageInline', [decryptedMsgData]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      throw error;
    }

    dispatch(updateMetamaskState(newState));
    return newState.unapprovedDecryptMsgs[decryptedMsgData.metamaskId];
  };
}

export function decryptMsg(
  decryptedMsgData: TemporaryMessageDataType['msgParams'],
): ThunkAction<
  Promise<TemporaryMessageDataType['msgParams']>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  log.debug('action - decryptMsg');
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.decryptMessage`);

    let newState: MetaMaskReduxState['metamask'];
    try {
      newState = await submitRequestToBackground<
        MetaMaskReduxState['metamask']
      >('decryptMessage', [decryptedMsgData]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(decryptedMsgData.metamaskId));
    dispatch(closeCurrentNotificationWindow());
    return decryptedMsgData;
  };
}

export function encryptionPublicKeyMsg(
  msgData: TemporaryMessageDataType['msgParams'],
): ThunkAction<
  Promise<TemporaryMessageDataType['msgParams']>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  log.debug('action - encryptionPublicKeyMsg');
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.encryptionPublicKey`);

    let newState: MetaMaskReduxState['metamask'];
    try {
      newState = await submitRequestToBackground<
        MetaMaskReduxState['metamask']
      >('encryptionPublicKey', [msgData]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.metamaskId));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function updateCustomNonce(value: string) {
  return {
    type: actionConstants.UPDATE_CUSTOM_NONCE,
    value,
  };
}

const updateMetamaskStateFromBackground = (): Promise<
  MetaMaskReduxState['metamask']
> => {
  log.debug(`background.getState`);

  return new Promise((resolve, reject) => {
    callBackgroundMethod<MetaMaskReduxState['metamask']>(
      'getState',
      [],
      (error, newState) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(newState as MetaMaskReduxState['metamask']);
      },
    );
  });
};

/**
 * TODO: update previousGasParams to use typed gas params object
 * TODO: Not a thunk, but rather a wrapper around a background call
 *
 * @param txId - MetaMask internal transaction id
 * @param previousGasParams - Object of gas params to set as previous
 */
export function updatePreviousGasParams(
  txId: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousGasParams: Record<string, any>,
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    let updatedTransaction: TransactionMeta;
    try {
      updatedTransaction = await submitRequestToBackground(
        'updatePreviousGasParams',
        [txId, previousGasParams],
      );
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }

    return updatedTransaction;
  };
}

export function updateEditableParams(
  txId: string,
  editableParams: Partial<TransactionParams>,
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    let updatedTransaction: TransactionMeta;
    try {
      updatedTransaction = await submitRequestToBackground(
        'updateEditableParams',
        [txId, editableParams],
      );
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
    await forceUpdateMetamaskState(dispatch);
    return updatedTransaction;
  };
}

/**
 * Appends new send flow history to a transaction
 * TODO: Not a thunk, but rather a wrapper around a background call
 *
 * @param txId - the id of the transaction to update
 * @param currentSendFlowHistoryLength - sendFlowHistory entries currently
 * @param sendFlowHistory - the new send flow history to append to the
 * transaction
 * @returns
 */
export function updateTransactionSendFlowHistory(
  txId: string,
  currentSendFlowHistoryLength: number,
  sendFlowHistory: DraftTransaction['history'],
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    let updatedTransaction: TransactionMeta;
    try {
      updatedTransaction = await submitRequestToBackground(
        'updateTransactionSendFlowHistory',
        [txId, currentSendFlowHistoryLength, sendFlowHistory],
      );
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }

    return updatedTransaction;
  };
}

export async function backupUserData(): Promise<{
  filename: string;
  data: string;
}> {
  let backedupData;
  try {
    backedupData = await submitRequestToBackground<{
      filename: string;
      data: string;
    }>('backupUserData');
  } catch (error) {
    logErrorWithMessage(error);
    throw error;
  }

  return backedupData;
}

export async function restoreUserData(jsonString: Json): Promise<true> {
  try {
    await submitRequestToBackground('restoreUserData', [jsonString]);
  } catch (error) {
    logErrorWithMessage(error);
    throw error;
  }

  return true;
}

// TODO: Not a thunk, but rather a wrapper around a background call
export function updateTransactionGasFees(
  txId: string,
  txGasFees: Partial<TxGasFees>,
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    let updatedTransaction: TransactionMeta;
    try {
      updatedTransaction = await submitRequestToBackground(
        'updateTransactionGasFees',
        [txId, txGasFees],
      );
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }

    return updatedTransaction;
  };
}

export function updateTransaction(
  txMeta: TransactionMeta,
  dontShowLoadingIndicator: boolean,
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    !dontShowLoadingIndicator && dispatch(showLoadingIndication());

    try {
      await submitRequestToBackground('updateTransaction', [txMeta]);
    } catch (error) {
      dispatch(updateTransactionParams(txMeta.id, txMeta.txParams));
      dispatch(hideLoadingIndication());
      dispatch(goHome());
      logErrorWithMessage(error);
      throw error;
    }

    try {
      dispatch(updateTransactionParams(txMeta.id, txMeta.txParams));
      const newState = await updateMetamaskStateFromBackground();
      dispatch(updateMetamaskState(newState));
      dispatch(showConfTxPage({ id: txMeta.id }));
      return txMeta;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

/**
 * Action to create a new transaction in the controller and route to the
 * confirmation page. Returns the newly created txMeta in case additional logic
 * should be applied to the transaction after creation.
 *
 * @param txParams - The transaction parameters
 * @param options
 * @param options.sendFlowHistory - The history of the send flow at time of creation.
 * @param options.type - The type of the transaction being added.
 * @returns
 */
export function addTransactionAndRouteToConfirmationPage(
  txParams: TransactionParams,
  options?: {
    sendFlowHistory?: DraftTransaction['history'];
    type?: TransactionType;
  },
): ThunkAction<
  Promise<TransactionMeta | null>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const actionId = generateActionId();

    try {
      log.debug('background.addTransaction');

      const transactionMeta = await submitRequestToBackground<TransactionMeta>(
        'addTransaction',
        [txParams, { ...options, actionId, origin: ORIGIN_METAMASK }],
      );

      dispatch(showConfTxPage());
      return transactionMeta;
    } catch (error) {
      dispatch(hideLoadingIndication());
      dispatch(displayWarning(error));
      throw error;
    }
    return null;
  };
}

/**
 * Wrapper around the promisifedBackground to create a new unapproved
 * transaction in the background and return the newly created txMeta.
 * This method does not show errors or route to a confirmation page and is
 * used primarily for swaps functionality.
 *
 * @param txParams - the transaction parameters
 * @param options - Additional options for the transaction.
 * @param options.method
 * @param options.requireApproval - Whether the transaction requires approval.
 * @param options.swaps - Options specific to swaps transactions.
 * @param options.swaps.hasApproveTx - Whether the swap required an approval transaction.
 * @param options.swaps.meta - Additional transaction metadata required by swaps.
 * @param options.type
 * @returns
 */
export async function addTransactionAndWaitForPublish(
  txParams: TransactionParams,
  options: {
    method?: string;
    requireApproval?: boolean;
    swaps?: { hasApproveTx?: boolean; meta?: Record<string, unknown> };
    type?: TransactionType;
  },
): Promise<TransactionMeta> {
  log.debug('background.addTransactionAndWaitForPublish');

  const actionId = generateActionId();

  return await submitRequestToBackground<TransactionMeta>(
    'addTransactionAndWaitForPublish',
    [
      txParams,
      {
        ...options,
        origin: ORIGIN_METAMASK,
        actionId,
      },
    ],
  );
}

export function updateAndApproveTx(
  txMeta: TransactionMeta,
  dontShowLoadingIndicator: boolean,
  loadingIndicatorMessage: string,
): ThunkAction<
  Promise<TransactionMeta | null>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch, getState) => {
    !dontShowLoadingIndicator &&
      dispatch(showLoadingIndication(loadingIndicatorMessage));

    const getIsSendActive = () =>
      Boolean(getState().send.stage !== SEND_STAGES.INACTIVE);

    return new Promise((resolve, reject) => {
      const actionId = generateActionId();

      callBackgroundMethod(
        'resolvePendingApproval',
        [String(txMeta.id), { txMeta, actionId }, { waitForResult: true }],
        (err) => {
          dispatch(updateTransactionParams(txMeta.id, txMeta.txParams));

          if (!getIsSendActive()) {
            dispatch(resetSendState());
          }

          if (err) {
            dispatch(goHome());
            logErrorWithMessage(err);
            reject(err);
            return;
          }

          resolve(txMeta);
        },
      );
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        if (!getIsSendActive()) {
          dispatch(resetSendState());
        }
        dispatch(completedTx(txMeta.id));
        dispatch(hideLoadingIndication());
        dispatch(updateCustomNonce(''));
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        dispatch(closeCurrentNotificationWindow());
        ///: END:ONLY_INCLUDE_IF
        return txMeta;
      })
      .catch((err) => {
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}

export async function getTransactions(
  filters: {
    filterToCurrentNetwork?: boolean;
    searchCriteria?: Partial<TransactionMeta> & Partial<TransactionParams>;
  } = {},
): Promise<TransactionMeta[]> {
  return await submitRequestToBackground<TransactionMeta[]>('getTransactions', [
    filters,
  ]);
}

export function completedTx(
  txId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch({
      type: actionConstants.COMPLETED_TX,
      value: {
        id: txId,
      },
    });
  };
}

export function updateTransactionParams(
  txId: string,
  txParams: TransactionParams,
) {
  return {
    type: actionConstants.UPDATE_TRANSACTION_PARAMS,
    id: txId,
    value: txParams,
  };
}

export function disableSnap(
  snapId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('disableSnap', [snapId]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function enableSnap(
  snapId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('enableSnap', [snapId]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function updateSnap(
  origin: string,
  snap: { [snapId: string]: { version: string } },
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch, getState) => {
    await submitRequestToBackground('updateSnap', [origin, snap]);
    await forceUpdateMetamaskState(dispatch);

    const state = getState();

    const approval = getFirstSnapInstallOrUpdateRequest(state);

    return approval?.metadata.id;
  };
}

export async function getPhishingResult(website: string) {
  return await submitRequestToBackground('getPhishingResult', [website]);
}

// TODO: Clean this up.
export function removeSnap(
  snapId: string,
): ThunkAction<Promise<void>, MetaMaskReduxState, unknown, AnyAction> {
  return async (
    dispatch: MetaMaskReduxDispatch,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    getState,
    ///: END:ONLY_INCLUDE_IF
  ) => {
    dispatch(showLoadingIndication());
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    const subjects = getPermissionSubjects(getState()) as {
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [k: string]: { permissions: Record<string, any> };
    };

    const isAccountsSnap =
      subjects[snapId]?.permissions?.snap_manageAccounts !== undefined;
    ///: END:ONLY_INCLUDE_IF

    try {
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      if (isAccountsSnap) {
        const addresses: string[] = await submitRequestToBackground(
          'getAccountsBySnapId',
          [snapId],
        );
        for (const address of addresses) {
          await submitRequestToBackground('removeAccount', [address]);
        }
      }
      ///: END:ONLY_INCLUDE_IF

      await submitRequestToBackground('removeSnap', [snapId]);
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      dispatch(displayWarning(error));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export async function handleSnapRequest<
  Params extends JsonRpcParams = JsonRpcParams,
>(args: {
  snapId: string;
  origin: string;
  handler: string;
  request: JsonRpcRequest<Params>;
}): Promise<unknown> {
  return submitRequestToBackground('handleSnapRequest', [args]);
}

export function dismissNotifications(
  ids: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('dismissNotifications', [ids]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function deleteExpiredNotifications(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch, getState) => {
    const state = getState();
    const notifications = getNotifications(state);

    const notificationIdsToDelete = notifications
      .filter((notification) => {
        const expirationTime = new Date(
          Date.now() - NOTIFICATIONS_EXPIRATION_DELAY,
        );

        return Boolean(
          notification.readDate &&
            new Date(notification.readDate) < expirationTime,
        );
      })
      .map(({ id }) => id);
    if (notificationIdsToDelete.length) {
      await submitRequestToBackground('dismissNotifications', [
        notificationIdsToDelete,
      ]);
      await forceUpdateMetamaskState(dispatch);
    }
  };
}

export function markNotificationsAsRead(
  ids: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('markNotificationsAsRead', [ids]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function revokeDynamicSnapPermissions(
  snapId: string,
  permissionNames: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('revokeDynamicSnapPermissions', [
      snapId,
      permissionNames,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

/**
 * Disconnects a given origin from a snap.
 *
 * This revokes the permission granted to the origin
 * that provides the capability to communicate with a snap.
 *
 * @param origin - The origin.
 * @param snapId - The snap ID.
 */
export function disconnectOriginFromSnap(
  origin: string,
  snapId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('disconnectOriginFromSnap', [
      origin,
      snapId,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function cancelDecryptMsg(
  msgData: TemporaryMessageDataType,
): ThunkAction<
  Promise<TemporaryMessageDataType>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await submitRequestToBackground<
        MetaMaskReduxState['metamask']
      >('cancelDecryptMessage', [msgData.id]);
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelEncryptionPublicKeyMsg(
  msgData: TemporaryMessageDataType,
): ThunkAction<
  Promise<TemporaryMessageDataType>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await submitRequestToBackground<
        MetaMaskReduxState['metamask']
      >('cancelEncryptionPublicKey', [msgData.id]);
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelTx(
  txMeta: TransactionMeta,
  _showLoadingIndication = true,
): ThunkAction<
  Promise<TransactionMeta>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    _showLoadingIndication && dispatch(showLoadingIndication());
    return new Promise<void>((resolve, reject) => {
      callBackgroundMethod(
        'rejectPendingApproval',
        [
          String(txMeta.id),
          ethErrors.provider.userRejectedRequest().serialize(),
        ],
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        },
      );
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        dispatch(resetSendState());
        dispatch(completedTx(txMeta.id));
        dispatch(hideLoadingIndication());
        dispatch(closeCurrentNotificationWindow());

        return txMeta;
      })
      .catch((error) => {
        dispatch(hideLoadingIndication());
        throw error;
      });
  };
}

/**
 * Cancels all of the given transactions
 *
 * @param txMetaList
 * @returns
 */
export function cancelTxs(
  txMetaList: TransactionMeta[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    try {
      const txIds = txMetaList.map(({ id }) => id);
      const cancellations = txIds.map(
        (id) =>
          new Promise<void>((resolve, reject) => {
            callBackgroundMethod(
              'rejectPendingApproval',
              [
                String(id),
                ethErrors.provider.userRejectedRequest().serialize(),
              ],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }

                resolve();
              },
            );
          }),
      );

      await Promise.all(cancellations);

      const newState = await updateMetamaskStateFromBackground();
      dispatch(updateMetamaskState(newState));
      dispatch(resetSendState());

      txIds.forEach((id) => {
        dispatch(completedTx(id));
      });
    } finally {
      if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
        closeNotificationPopup();
      } else {
        dispatch(hideLoadingIndication());
      }
    }
  };
}

export function markPasswordForgotten(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await new Promise<void>((resolve, reject) => {
        callBackgroundMethod('markPasswordForgotten', [], (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    } finally {
      // TODO: handle errors
      dispatch(hideLoadingIndication());
      await forceUpdateMetamaskState(dispatch);
    }
  };
}

export function unMarkPasswordForgotten(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    return new Promise<void>((resolve) => {
      callBackgroundMethod('unMarkPasswordForgotten', [], () => {
        resolve();
      });
    }).then(() => forceUpdateMetamaskState(dispatch));
  };
}

export function closeWelcomeScreen() {
  return {
    type: actionConstants.CLOSE_WELCOME_SCREEN,
  };
}

//
// unlock screen
//

export function unlockInProgress() {
  return {
    type: actionConstants.UNLOCK_IN_PROGRESS,
  };
}

export function unlockFailed(message?: string) {
  return {
    type: actionConstants.UNLOCK_FAILED,
    value: message,
  };
}

export function unlockSucceeded(message?: string) {
  return {
    type: actionConstants.UNLOCK_SUCCEEDED,
    value: message,
  };
}

export function updateMetamaskState(
  newState: MetaMaskReduxState['metamask'],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch, getState) => {
    const state = getState();
    const providerConfig = getProviderConfig(state);
    const { metamask: currentState } = state;

    const { currentLocale } = currentState;
    const currentInternalAccount = getSelectedInternalAccount(state);
    const selectedAddress = currentInternalAccount?.address;
    const { currentLocale: newLocale } = newState;
    const newProviderConfig = getProviderConfig({ metamask: newState });
    const newInternalAccount = getSelectedInternalAccount({
      metamask: newState,
    });
    const newSelectedAddress = newInternalAccount?.address;

    if (currentLocale && newLocale && currentLocale !== newLocale) {
      dispatch(updateCurrentLocale(newLocale));
    }

    if (selectedAddress !== newSelectedAddress) {
      dispatch({ type: actionConstants.SELECTED_ADDRESS_CHANGED });
    }

    const newAddressBook =
      newState.addressBook?.[newProviderConfig?.chainId] ?? {};
    const oldAddressBook =
      currentState.addressBook?.[providerConfig?.chainId] ?? {};
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newAccounts: { [address: string]: Record<string, any> } =
      getMetaMaskAccounts({ metamask: newState });
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldAccounts: { [address: string]: Record<string, any> } =
      getMetaMaskAccounts({ metamask: currentState });
    const newSelectedAccount = newAccounts[newSelectedAddress];
    const oldSelectedAccount = newAccounts[selectedAddress];
    // dispatch an ACCOUNT_CHANGED for any account whose balance or other
    // properties changed in this update
    Object.entries(oldAccounts).forEach(([address, oldAccount]) => {
      if (!isEqual(oldAccount, newAccounts[address])) {
        dispatch({
          type: actionConstants.ACCOUNT_CHANGED,
          payload: { account: newAccounts[address] },
        });
      }
    });

    // Also emit an event for the selected account changing, either due to a
    // property update or if the entire account changes.
    if (isEqual(oldSelectedAccount, newSelectedAccount) === false) {
      dispatch({
        type: actionConstants.SELECTED_ACCOUNT_CHANGED,
        payload: { account: newSelectedAccount },
      });
    }
    // We need to keep track of changing address book entries
    if (isEqual(oldAddressBook, newAddressBook) === false) {
      dispatch({
        type: actionConstants.ADDRESS_BOOK_UPDATED,
        payload: { addressBook: newAddressBook },
      });
    }

    // track when gasFeeEstimates change
    if (
      isEqual(currentState.gasFeeEstimates, newState.gasFeeEstimates) === false
    ) {
      dispatch({
        type: actionConstants.GAS_FEE_ESTIMATES_UPDATED,
        payload: {
          gasFeeEstimates: newState.gasFeeEstimates,
          gasEstimateType: newState.gasEstimateType,
        },
      });
    }
    dispatch({
      type: actionConstants.UPDATE_METAMASK_STATE,
      value: newState,
    });
    if (providerConfig.chainId !== newProviderConfig.chainId) {
      dispatch({
        type: actionConstants.CHAIN_CHANGED,
        payload: newProviderConfig.chainId,
      });
      // We dispatch this action to ensure that the send state stays up to date
      // after the chain changes. This async thunk will fail gracefully in the
      // event that we are not yet on the send flow with a draftTransaction in
      // progress.

      dispatch(initializeSendState({ chainHasChanged: true }));
    }

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    updateCustodyState(dispatch, newState, getState());
    ///: END:ONLY_INCLUDE_IF
  };
}

const backgroundSetLocked = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    callBackgroundMethod('setLocked', [], (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

export function lockMetamask(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  log.debug(`background.setLocked`);

  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    return backgroundSetLocked()
      .then(() => updateMetamaskStateFromBackground())
      .catch((error) => {
        dispatch(displayWarning(error.message));
        return Promise.reject(error);
      })
      .then((newState) => {
        dispatch(updateMetamaskState(newState));
        dispatch(hideLoadingIndication());
        dispatch({ type: actionConstants.LOCK_METAMASK });
      })
      .catch(() => {
        dispatch(hideLoadingIndication());
        dispatch({ type: actionConstants.LOCK_METAMASK });
      });
  };
}

async function _setSelectedInternalAccount(accountId: string): Promise<void> {
  log.debug(`background.setSelectedInternalAccount`);
  await submitRequestToBackground('setSelectedInternalAccount', [accountId]);
}

/**
 * Sets the selected internal account.
 *
 * @param accountId - The ID of the account to set as selected.
 * @returns A thunk action that dispatches loading and warning indications.
 */
export function setSelectedInternalAccount(
  accountId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setSelectedInternalAccount`);
    try {
      await _setSelectedInternalAccount(accountId);
    } catch (error) {
      dispatch(displayWarning(error));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setSelectedAccount(
  address: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch, getState) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setSelectedAccount`);

    const state = getState();
    const unconnectedAccountAccountAlertIsEnabled =
      getUnconnectedAccountAlertEnabledness(state);
    const activeTabOrigin = state.activeTab.origin;
    const internalAccount = getInternalAccountByAddress(state, address);
    const permittedAccountsForCurrentTab =
      getPermittedAccountsForCurrentTab(state);
    const currentTabIsConnectedToPreviousAddress =
      Boolean(activeTabOrigin) &&
      permittedAccountsForCurrentTab.includes(internalAccount.address);
    const currentTabIsConnectedToNextAddress =
      Boolean(activeTabOrigin) &&
      permittedAccountsForCurrentTab.includes(address);
    const switchingToUnconnectedAddress =
      currentTabIsConnectedToPreviousAddress &&
      !currentTabIsConnectedToNextAddress;

    try {
      await _setSelectedInternalAccount(internalAccount.id);
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      dispatch(displayWarning(error));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }

    if (
      unconnectedAccountAccountAlertIsEnabled &&
      switchingToUnconnectedAddress
    ) {
      dispatch(switchedToUnconnectedAccount());
      await setUnconnectedAccountAlertShown(activeTabOrigin);
    }
  };
}

export function addPermittedAccount(
  origin: string,
  address: [],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await new Promise<void>((resolve, reject) => {
      callBackgroundMethod(
        'addPermittedAccount',
        [origin, address],
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });
    await forceUpdateMetamaskState(dispatch);
  };
}
export function addMorePermittedAccounts(
  origin: string,
  address: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await new Promise<void>((resolve, reject) => {
      callBackgroundMethod(
        'addMorePermittedAccounts',
        [origin, address],
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });
    await forceUpdateMetamaskState(dispatch);
  };
}

export function removePermittedAccount(
  origin: string,
  address: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await new Promise<void>((resolve, reject) => {
      callBackgroundMethod(
        'removePermittedAccount',
        [origin, address],
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });
    await forceUpdateMetamaskState(dispatch);
  };
}

export function showAccountsPage() {
  return {
    type: actionConstants.SHOW_ACCOUNTS_PAGE,
  };
}

export function showConfTxPage({ id }: Partial<TransactionMeta> = {}) {
  return {
    type: actionConstants.SHOW_CONF_TX_PAGE,
    id,
  };
}

export function addToken(
  {
    address,
    symbol,
    decimals,
    image,
    networkClientId,
  }: {
    address?: string;
    symbol?: string;
    decimals?: number;
    image?: string;
    networkClientId?: NetworkClientId;
  },
  dontShowLoadingIndicator?: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot add token without address');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await submitRequestToBackground('addToken', [
        {
          address,
          symbol,
          decimals,
          image,
          networkClientId,
        },
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

/**
 * To add the tokens user selected to state
 *
 * @param tokensToImport
 * @param networkClientId
 */
export function addImportedTokens(
  tokensToImport: Token[],
  networkClientId?: NetworkClientId,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('addImportedTokens', [
        tokensToImport,
        networkClientId,
      ]);
    } catch (error) {
      logErrorWithMessage(error);
    } finally {
      await forceUpdateMetamaskState(dispatch);
    }
  };
}

/**
 * To add ignored token addresses to state
 *
 * @param options
 * @param options.tokensToIgnore
 * @param options.dontShowLoadingIndicator
 */
export function ignoreTokens({
  tokensToIgnore,
  dontShowLoadingIndicator = false,
}: {
  tokensToIgnore: string[];
  dontShowLoadingIndicator: boolean;
}): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  const _tokensToIgnore = Array.isArray(tokensToIgnore)
    ? tokensToIgnore
    : [tokensToIgnore];

  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await submitRequestToBackground('ignoreTokens', [_tokensToIgnore]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

/**
 * To fetch the ERC20 tokens with non-zero balance in a single call
 *
 * @param selectedAddress - the targeted account
 * @param tokensToDetect - the targeted list of tokens
 * @param networkClientId - unique identifier for the network client
 */
export async function getBalancesInSingleCall(
  selectedAddress: string,
  tokensToDetect: string[],
  networkClientId: string,
): Promise<BalanceMap> {
  return await submitRequestToBackground('getBalancesInSingleCall', [
    selectedAddress,
    tokensToDetect,
    networkClientId,
  ]);
}

export function addNft(
  address: string,
  tokenID: string,
  dontShowLoadingIndicator: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot add NFT without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot add NFT without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await submitRequestToBackground('addNft', [address, tokenID]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function addNftVerifyOwnership(
  address: string,
  tokenID: string,
  dontShowLoadingIndicator: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot add NFT without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot add NFT without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await submitRequestToBackground('addNftVerifyOwnership', [
        address,
        tokenID,
      ]);
    } catch (error) {
      if (
        isErrorWithMessage(error) &&
        (error.message.includes('This NFT is not owned by the user') ||
          error.message.includes('Unable to verify ownership'))
      ) {
        throw error;
      } else {
        logErrorWithMessage(error);
        dispatch(displayWarning(error));
      }
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function removeAndIgnoreNft(
  address: string,
  tokenID: string,
  shouldShowLoadingIndicator?: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot ignore NFT without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot ignore NFT without tokenID');
    }
    if (!shouldShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await submitRequestToBackground('removeAndIgnoreNft', [address, tokenID]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
      throw error;
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function removeNft(
  address: string,
  tokenID: string,
  dontShowLoadingIndicator: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot remove NFT without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot remove NFT without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await submitRequestToBackground('removeNft', [address, tokenID]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning(error));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export async function checkAndUpdateAllNftsOwnershipStatus() {
  await submitRequestToBackground('checkAndUpdateAllNftsOwnershipStatus');
}

export async function isNftOwner(
  ownerAddress: string,
  nftAddress: string,
  nftId: string,
): Promise<boolean> {
  return await submitRequestToBackground('isNftOwner', [
    ownerAddress,
    nftAddress,
    nftId,
  ]);
}

export async function checkAndUpdateSingleNftOwnershipStatus(nft: Nft) {
  await submitRequestToBackground('checkAndUpdateSingleNftOwnershipStatus', [
    nft,
    false,
  ]);
}
// When we upgrade to TypeScript 4.5 this is part of the language. It will get
// the underlying type of a Promise generic type. So Awaited<Promise<void>> is
// void.
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export async function getTokenStandardAndDetails(
  address: string,
  userAddress?: string,
  tokenId?: string,
): Promise<
  Awaited<
    ReturnType<AssetsContractController['getTokenStandardAndDetails']>
  > & { balance?: string }
> {
  return await submitRequestToBackground('getTokenStandardAndDetails', [
    address,
    userAddress,
    tokenId,
  ]);
}

export async function getTokenSymbol(address: string): Promise<string | null> {
  return await submitRequestToBackground('getTokenSymbol', [address]);
}

export function clearPendingTokens(): Action {
  return {
    type: actionConstants.CLEAR_PENDING_TOKENS,
  };
}

/**
 * Action to switch globally selected network and set switched network details
 * for the purpose of displaying the user a toast about the network change
 *
 * @param networkClientIdForThisDomain - Thet network client ID last used by the origin
 * @param selectedTabOrigin - Origin of the current tab
 */
export function automaticallySwitchNetwork(
  networkClientIdForThisDomain: string,
  selectedTabOrigin: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await setActiveNetworkConfigurationId(networkClientIdForThisDomain);
    await dispatch(
      setSwitchedNetworkDetails({
        networkClientId: networkClientIdForThisDomain,
        origin: selectedTabOrigin,
      }),
    );
    await forceUpdateMetamaskState(dispatch);
  };
}

/**
 * Action to store details about the switched-to network in the background state
 *
 * @param switchedNetworkDetails - Object containing networkClientId and origin
 * @param switchedNetworkDetails.networkClientId
 * @param switchedNetworkDetails.selectedTabOrigin
 */
export function setSwitchedNetworkDetails(switchedNetworkDetails: {
  networkClientId: string;
  selectedTabOrigin: string;
}): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwitchedNetworkDetails', [
      switchedNetworkDetails,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

/**
 * Action to clear details about the switched-to network in the background state
 */
export function clearSwitchedNetworkDetails(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('clearSwitchedNetworkDetails', []);
    await forceUpdateMetamaskState(dispatch);
  };
}

/**
 * Update the currentPopupid generated when the user opened the popup
 *
 * @param id - The Snap interface ID.
 * @returns Promise Resolved on successfully submitted background request.
 */
export function setCurrentExtensionPopupId(
  id: number,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground<void>('setCurrentExtensionPopupId', [id]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function abortTransactionSigning(
  transactionId: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ThunkAction<Promise<void>, MetaMaskReduxState, any, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('abortTransactionSigning', [
        transactionId,
      ]);
    } catch (error) {
      dispatch(displayWarning(error));
    }
  };
}

export function getLayer1GasFee({
  chainId,
  networkClientId,
  transactionParams,
}: {
  chainId?: Hex;
  networkClientId?: NetworkClientId;
  transactionParams: TransactionParams;
}): // TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ThunkAction<Promise<void>, MetaMaskReduxState, any, AnyAction> {
  return async () =>
    await submitRequestToBackground('getLayer1GasFee', [
      { chainId, networkClientId, transactionParams },
    ]);
}

export function createCancelTransaction(
  txId: string,
  customGasSettings: CustomGasSettings,
  options: { estimatedBaseFee?: string } = {},
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  log.debug('background.createCancelTransaction');
  let newTxId: string;

  return (dispatch: MetaMaskReduxDispatch) => {
    const actionId = generateActionId();
    return new Promise<MetaMaskReduxState['metamask']>((resolve, reject) => {
      callBackgroundMethod<MetaMaskReduxState['metamask']>(
        'createCancelTransaction',
        [txId, customGasSettings, { ...options, actionId }],
        (err, newState) => {
          if (err) {
            if (
              err?.message?.includes(
                'Previous transaction is already confirmed',
              )
            ) {
              dispatch(
                showModal({
                  name: 'TRANSACTION_ALREADY_CONFIRMED',
                  originalTransactionId: txId,
                }),
              );
            }
            dispatch(displayWarning(err));
            reject(err);
            return;
          }
          if (newState) {
            const currentNetworkTxList = getCurrentNetworkTransactions({
              metamask: newState,
            });
            const { id } =
              currentNetworkTxList[currentNetworkTxList.length - 1];
            newTxId = id;
            resolve(newState);
          }
        },
      );
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTxId);
  };
}

export function createSpeedUpTransaction(
  txId: string,
  customGasSettings: CustomGasSettings,
  options: { estimatedBaseFee?: string } = {},
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  log.debug('background.createSpeedUpTransaction');
  let newTx: TransactionMeta;

  return (dispatch: MetaMaskReduxDispatch) => {
    const actionId = generateActionId();
    return new Promise<MetaMaskReduxState['metamask']>((resolve, reject) => {
      callBackgroundMethod<MetaMaskReduxState['metamask']>(
        'createSpeedUpTransaction',
        [txId, customGasSettings, { ...options, actionId }],
        (err, newState) => {
          if (err) {
            dispatch(displayWarning(err));
            reject(err);
            return;
          }

          if (newState) {
            const currentNetworkTxList =
              getCurrentNetworkTransactions(newState);
            newTx = currentNetworkTxList[currentNetworkTxList.length - 1];
            resolve(newState);
          }
        },
      );
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTx);
  };
}

export function createRetryTransaction(
  txId: string,
  customGasSettings: CustomGasSettings,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  let newTx: TransactionMeta;

  return (dispatch: MetaMaskReduxDispatch) => {
    return new Promise<MetaMaskReduxState['metamask']>((resolve, reject) => {
      const actionId = generateActionId();
      callBackgroundMethod<MetaMaskReduxState['metamask']>(
        'createSpeedUpTransaction',
        [txId, customGasSettings, { actionId }],
        (err, newState) => {
          if (err) {
            dispatch(displayWarning(err));
            reject(err);
            return;
          }
          if (newState) {
            const currentNetworkTxList =
              getCurrentNetworkTransactions(newState);
            newTx = currentNetworkTxList[currentNetworkTxList.length - 1];
            resolve(newState);
          }
        },
      );
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTx);
  };
}

//
// config
//

export function upsertNetworkConfiguration(
  {
    id,
    rpcUrl,
    chainId,
    nickname,
    rpcPrefs,
    ticker = EtherDenomination.ETH,
  }: {
    id?: string;
    rpcUrl: string;
    chainId: string;
    nickname: string;
    rpcPrefs: RPCDefinition['rpcPrefs'];
    ticker: string;
  },
  {
    setActive,
    source,
  }: {
    setActive: boolean;
    source: string;
  },
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch) => {
    log.debug(
      `background.upsertNetworkConfiguration: ${id} ${rpcUrl} ${chainId} ${ticker} ${nickname}`,
    );
    let networkConfigurationId;
    try {
      networkConfigurationId = await submitRequestToBackground(
        'upsertNetworkConfiguration',
        [
          {
            id,
            rpcUrl,
            chainId,
            ticker,
            nickname: nickname || rpcUrl,
            rpcPrefs,
          },
          { setActive, source, referrer: ORIGIN_METAMASK },
        ],
      );
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem adding network!'));
    }
    return networkConfigurationId;
  };
}

export function setActiveNetwork(
  networkConfigurationId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch) => {
    log.debug(`background.setActiveNetwork: ${networkConfigurationId}`);
    try {
      await submitRequestToBackground('setActiveNetwork', [
        networkConfigurationId,
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning('Had a problem changing networks!'));
    }
  };
}

export async function setActiveNetworkConfigurationId(
  networkConfigurationId: string,
): Promise<undefined> {
  log.debug(
    `background.setActiveNetworkConfigurationId: ${networkConfigurationId}`,
  );
  await submitRequestToBackground('setActiveNetworkConfigurationId', [
    networkConfigurationId,
  ]);
}

export function rollbackToPreviousProvider(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('rollbackToPreviousProvider');
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning('Had a problem changing networks!'));
    }
  };
}

export function removeNetworkConfiguration(
  networkConfigurationId: string,
): ThunkAction<Promise<void>, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch) => {
    log.debug(
      `background.removeNetworkConfiguration: ${networkConfigurationId}`,
    );
    return new Promise((resolve, reject) => {
      callBackgroundMethod(
        'removeNetworkConfiguration',
        [networkConfigurationId],
        (err) => {
          if (err) {
            logErrorWithMessage(err);
            dispatch(displayWarning('Had a problem removing network!'));
            reject(err);
            return;
          }
          resolve();
        },
      );
    });
  };
}

// Calls the addressBookController to add a new address.
export function addToAddressBook(
  recipient: string,
  nickname = '',
  memo = '',
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  log.debug(`background.addToAddressBook`);

  return async (dispatch, getState) => {
    const { chainId } = getProviderConfig(getState());

    let set;
    try {
      set = await submitRequestToBackground('setAddressBook', [
        toChecksumHexAddress(recipient),
        nickname,
        chainId,
        memo,
      ]);
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning('Address book failed to update'));
      throw error;
    }
    if (!set) {
      dispatch(displayWarning('Address book failed to update'));
    }
  };
}

/**
 * @description Calls the addressBookController to remove an existing address.
 * @param chainId
 * @param addressToRemove - Address of the entry to remove from the address book
 */
export function removeFromAddressBook(
  chainId: string,
  addressToRemove: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  log.debug(`background.removeFromAddressBook`);

  return async (dispatch) => {
    await submitRequestToBackground('removeFromAddressBook', [
      chainId,
      toChecksumHexAddress(addressToRemove),
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function showNetworkDropdown(): Action {
  return {
    type: actionConstants.NETWORK_DROPDOWN_OPEN,
  };
}

export function hideNetworkDropdown() {
  return {
    type: actionConstants.NETWORK_DROPDOWN_CLOSE,
  };
}

export function showImportTokensModal(): Action {
  return {
    type: actionConstants.IMPORT_TOKENS_POPOVER_OPEN,
  };
}

export function hideImportTokensModal(): Action {
  return {
    type: actionConstants.IMPORT_TOKENS_POPOVER_CLOSE,
  };
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModalPayload = { name: string } & Record<string, any>;

export function showModal(payload: ModalPayload): PayloadAction<ModalPayload> {
  return {
    type: actionConstants.MODAL_OPEN,
    payload,
  };
}

export function hideModal(): Action {
  return {
    type: actionConstants.MODAL_CLOSE,
  };
}

export function showImportNftsModal(payload: {
  tokenAddress?: string;
  tokenId?: string;
  ignoreErc20Token?: boolean;
}) {
  return {
    type: actionConstants.IMPORT_NFTS_MODAL_OPEN,
    payload,
  };
}

export function hideImportNftsModal(): Action {
  return {
    type: actionConstants.IMPORT_NFTS_MODAL_CLOSE,
  };
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setConfirmationExchangeRates(value: Record<string, any>) {
  return {
    type: actionConstants.SET_CONFIRMATION_EXCHANGE_RATES,
    value,
  };
}

export function showIpfsModal(): Action {
  return {
    type: actionConstants.SHOW_IPFS_MODAL_OPEN,
  };
}

export function hideIpfsModal(): Action {
  return {
    type: actionConstants.SHOW_IPFS_MODAL_CLOSE,
  };
}

export function closeCurrentNotificationWindow(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (_, getState) => {
    const state = getState();
    const approvalFlows = getApprovalFlows(state);
    if (
      getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION &&
      !hasTransactionPendingApprovals(state) &&
      !getIsSigningQRHardwareTransaction(state) &&
      approvalFlows.length === 0
    ) {
      closeNotificationPopup();
    }
  };
}

export function showAlert(msg: string): PayloadAction<string> {
  return {
    type: actionConstants.ALERT_OPEN,
    payload: msg,
  };
}

export function hideAlert(): Action {
  return {
    type: actionConstants.ALERT_CLOSE,
  };
}

export function showDeprecatedNetworkModal(): Action {
  return {
    type: actionConstants.DEPRECATED_NETWORK_POPOVER_OPEN,
  };
}

export function hideDeprecatedNetworkModal(): Action {
  return {
    type: actionConstants.DEPRECATED_NETWORK_POPOVER_CLOSE,
  };
}

/**
 * TODO: this should be moved somewhere else when it makese sense to do so
 */
type NftDropDownState = {
  [address: string]: {
    [chainId: string]: {
      [nftAddress: string]: boolean;
    };
  };
};

export function updateNftDropDownState(
  value: NftDropDownState,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('updateNftDropDownState', [value]);
    await forceUpdateMetamaskState(dispatch);
  };
}

type QrCodeData = {
  // Address when a Ethereum Address has been detected
  type?: 'address' | string;
  // contains an address key when Ethereum Address detected
  values?: { address?: string } & Json;
};

/**
 * This action will receive two types of values via qrCodeData
 * an object with the following structure {type, values}
 * or null (used to clear the previous value)
 *
 * @param qrCodeData
 */
export function qrCodeDetected(
  qrCodeData: QrCodeData,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await dispatch({
      type: actionConstants.QR_CODE_DETECTED,
      value: qrCodeData,
    });

    // If on the send page, the send slice will listen for the QR_CODE_DETECTED
    // action and update its state. Address changes need to recompute gasLimit
    // so we fire this method so that the send page gasLimit can be recomputed
    dispatch(computeEstimatedGasLimit());
  };
}

export function showLoadingIndication(
  message?: string | ReactFragment,
): PayloadAction<string | ReactFragment | undefined> {
  return {
    type: actionConstants.SHOW_LOADING,
    payload: message,
  };
}

export function showNftStillFetchingIndication(): Action {
  return {
    type: actionConstants.SHOW_NFT_STILL_FETCHING_INDICATION,
  };
}

export function setShowNftDetectionEnablementToast(
  value: boolean,
): PayloadAction<string | ReactFragment | undefined> {
  return {
    type: actionConstants.SHOW_NFT_DETECTION_ENABLEMENT_TOAST,
    payload: value,
  };
}

export function setHardwareWalletDefaultHdPath({
  device,
  path,
}: {
  device: HardwareDeviceNames;
  path: string;
}): PayloadAction<{ device: HardwareDeviceNames; path: string }> {
  return {
    type: actionConstants.SET_HARDWARE_WALLET_DEFAULT_HD_PATH,
    payload: { device, path },
  };
}

export function hideLoadingIndication(): Action {
  return {
    type: actionConstants.HIDE_LOADING,
  };
}

export function hideNftStillFetchingIndication(): Action {
  return {
    type: actionConstants.HIDE_NFT_STILL_FETCHING_INDICATION,
  };
}

/**
 * An action creator for display a warning to the user in various places in the
 * UI. It will not be cleared until a new warning replaces it or `hideWarning`
 * is called.
 *
 * @deprecated This way of displaying a warning is confusing for users and
 * should no longer be used.
 * @param payload - The warning to show.
 * @returns The action to display the warning.
 */
export function displayWarning(payload: unknown): PayloadAction<string> {
  if (isErrorWithMessage(payload)) {
    return {
      type: actionConstants.DISPLAY_WARNING,
      payload: payload.message,
    };
  } else if (typeof payload === 'string') {
    return {
      type: actionConstants.DISPLAY_WARNING,
      payload,
    };
  }
  return {
    type: actionConstants.DISPLAY_WARNING,
    payload: `${payload}`,
  };
}

export function hideWarning() {
  return {
    type: actionConstants.HIDE_WARNING,
  };
}

export function exportAccount(
  password: string,
  address: string,
  setPrivateKey: (key: string) => void,
  setShowHoldToReveal: (show: boolean) => void,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return function (dispatch) {
    dispatch(showLoadingIndication());

    log.debug(`background.verifyPassword`);
    return new Promise<string>((resolve, reject) => {
      callBackgroundMethod('verifyPassword', [password], function (err) {
        if (err) {
          log.error('Error in verifying password.');
          dispatch(hideLoadingIndication());
          dispatch(displayWarning('Incorrect Password.'));
          reject(err);
          return;
        }
        log.debug(`background.exportAccount`);
        callBackgroundMethod<string>(
          'exportAccount',
          [address, password],
          function (err2, result) {
            dispatch(hideLoadingIndication());

            if (err2) {
              logErrorWithMessage(err2);
              dispatch(displayWarning('Had a problem exporting the account.'));
              reject(err2);
              return;
            }

            setPrivateKey(result as string);
            setShowHoldToReveal(true);
            resolve(result as string);
          },
        );
      });
    });
  };
}

export function exportAccounts(
  password: string,
  addresses: string[],
): ThunkAction<Promise<string[]>, MetaMaskReduxState, unknown, AnyAction> {
  return function (dispatch) {
    log.debug(`background.verifyPassword`);
    return new Promise<string[]>((resolve, reject) => {
      callBackgroundMethod('verifyPassword', [password], function (err) {
        if (err) {
          log.error('Error in submitting password.');
          reject(err);
          return;
        }
        log.debug(`background.exportAccounts`);
        const accountPromises = addresses.map(
          (address) =>
            new Promise<string>((resolve2, reject2) =>
              callBackgroundMethod<string>(
                'exportAccount',
                [address, password],
                function (err2, result) {
                  if (err2) {
                    logErrorWithMessage(err2);
                    dispatch(
                      displayWarning('Had a problem exporting the account.'),
                    );
                    reject2(err2);
                    return;
                  }
                  resolve2(result as string);
                },
              ),
            ),
        );
        resolve(Promise.all(accountPromises));
      });
    });
  };
}

export function showPrivateKey(key: string): PayloadAction<string> {
  return {
    type: actionConstants.SHOW_PRIVATE_KEY,
    payload: key,
  };
}

export function setAccountLabel(
  account: string,
  label: string,
): ThunkAction<Promise<string>, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setAccountLabel`);

    return new Promise((resolve, reject) => {
      callBackgroundMethod('setAccountLabel', [account, label], (err) => {
        dispatch(hideLoadingIndication());

        if (err) {
          dispatch(displayWarning(err));
          reject(err);
          return;
        }

        dispatch({
          type: actionConstants.SET_ACCOUNT_LABEL,
          value: { account, label },
        });
        resolve(account);
      });
    });
  };
}

export function clearAccountDetails(): Action {
  return {
    type: actionConstants.CLEAR_ACCOUNT_DETAILS,
  };
}

export function showSendTokenPage(): Action {
  return {
    type: actionConstants.SHOW_SEND_TOKEN_PAGE,
  };
}

// TODO: Lift to shared folder when it makes sense
type TemporaryFeatureFlagDef = {
  [feature: string]: boolean;
};
type TemporaryPreferenceFlagDef = {
  [preference: string]: boolean | object;
};

export function setFeatureFlag(
  feature: string,
  activated: boolean,
  notificationType: string,
): ThunkAction<
  Promise<TemporaryFeatureFlagDef>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    return new Promise((resolve, reject) => {
      callBackgroundMethod<TemporaryFeatureFlagDef>(
        'setFeatureFlag',
        [feature, activated],
        (err, updatedFeatureFlags) => {
          dispatch(hideLoadingIndication());
          if (err) {
            dispatch(displayWarning(err));
            reject(err);
            return;
          }
          notificationType && dispatch(showModal({ name: notificationType }));
          resolve(updatedFeatureFlags as TemporaryFeatureFlagDef);
        },
      );
    });
  };
}

export function setPreference(
  preference: string,
  value: boolean | string | object,
): ThunkAction<
  Promise<TemporaryPreferenceFlagDef>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    return new Promise<TemporaryPreferenceFlagDef>((resolve, reject) => {
      callBackgroundMethod<TemporaryPreferenceFlagDef>(
        'setPreference',
        [preference, value],
        (err, updatedPreferences) => {
          dispatch(hideLoadingIndication());
          if (err) {
            dispatch(displayWarning(err));
            reject(err);
            return;
          }
          resolve(updatedPreferences as TemporaryPreferenceFlagDef);
        },
      );
    });
  };
}

export function setDefaultHomeActiveTabName(
  value: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setDefaultHomeActiveTabName', [value]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setUseNativeCurrencyAsPrimaryCurrencyPreference(
  value: boolean,
) {
  return setPreference('useNativeCurrencyAsPrimaryCurrency', value);
}

export function setHideZeroBalanceTokens(value: boolean) {
  return setPreference('hideZeroBalanceTokens', value);
}

export function setShowFiatConversionOnTestnetsPreference(value: boolean) {
  return setPreference('showFiatInTestnets', value);
}

export function setShowTestNetworks(value: boolean) {
  return setPreference('showTestNetworks', value);
}

export function setPetnamesEnabled(value: boolean) {
  return setPreference('petnamesEnabled', value);
}

export function setRedesignedConfirmationsEnabled(value: boolean) {
  return setPreference('redesignedConfirmationsEnabled', value);
}

export function setRedesignedTransactionsEnabled(value: boolean) {
  return setPreference('redesignedTransactionsEnabled', value);
}

export function setFeatureNotificationsEnabled(value: boolean) {
  return setPreference('featureNotificationsEnabled', value);
}

export function setShowExtensionInFullSizeView(value: boolean) {
  return setPreference('showExtensionInFullSizeView', value);
}

export function setRedesignedConfirmationsDeveloperEnabled(value: boolean) {
  return setPreference('isRedesignedConfirmationsDeveloperEnabled', value);
}

export function setSmartTransactionsOptInStatus(
  value: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch, getState) => {
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(
      getState(),
    );
    trackMetaMetricsEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        stx_opt_in: value,
        prev_stx_opt_in: smartTransactionsOptInStatus,
      },
    });
    await dispatch(setPreference('smartTransactionsOptInStatus', value));
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setShowMultiRpcModal(value: boolean) {
  return setPreference('showMultiRpcModal', value);
}

export function setAutoLockTimeLimit(value: number | null) {
  return setPreference('autoLockTimeLimit', value);
}

export function setIncomingTransactionsPreferences(
  chainId: string,
  value: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setIncomingTransactionsPreferences`);
    await submitRequestToBackground('setIncomingTransactionsPreferences', [
      chainId,
      value,
    ]);
    dispatch(hideLoadingIndication());
  };
}

export function setCompletedOnboarding(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    try {
      await submitRequestToBackground('completeOnboarding');
      dispatch(completeOnboarding());
    } catch (err) {
      dispatch(displayWarning(err));
      throw err;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function completeOnboarding() {
  return {
    type: actionConstants.COMPLETE_ONBOARDING,
  };
}

export function resetOnboarding(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch) => {
    try {
      await dispatch(setSeedPhraseBackedUp(false));
      dispatch(resetOnboardingAction());
    } catch (err) {
      console.error(err);
    }
  };
}

export function resetOnboardingAction() {
  return {
    type: actionConstants.RESET_ONBOARDING,
  };
}

export function setServiceWorkerKeepAlivePreference(
  value: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setServiceWorkerKeepAlivePreference`);
    try {
      await submitRequestToBackground('setServiceWorkerKeepAlivePreference', [
        value,
      ]);
    } catch (error) {
      dispatch(displayWarning(error));
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export async function forceUpdateMetamaskState(
  dispatch: MetaMaskReduxDispatch,
) {
  log.debug(`background.getState`);

  let newState;
  try {
    newState = await submitRequestToBackground<MetaMaskReduxState['metamask']>(
      'getState',
    );
  } catch (error) {
    dispatch(displayWarning(error));
    throw error;
  }

  dispatch(updateMetamaskState(newState));
  return newState;
}

export function toggleAccountMenu() {
  return {
    type: actionConstants.TOGGLE_ACCOUNT_MENU,
  };
}

export function toggleNetworkMenu(payload?: {
  isAddingNewNetwork: boolean;
  isMultiRpcOnboarding: boolean;
}) {
  return {
    type: actionConstants.TOGGLE_NETWORK_MENU,
    payload,
  };
}

export function setAccountDetailsAddress(address: string) {
  return {
    type: actionConstants.SET_ACCOUNT_DETAILS_ADDRESS,
    payload: address,
  };
}

export function setParticipateInMetaMetrics(
  participationPreference: boolean,
): ThunkAction<
  Promise<[boolean, string]>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.setParticipateInMetaMetrics`);
    return new Promise((resolve, reject) => {
      callBackgroundMethod<string>(
        'setParticipateInMetaMetrics',
        [participationPreference],
        (err, metaMetricsId) => {
          log.debug(err);
          if (err) {
            dispatch(displayWarning(err));
            reject(err);
            return;
          }

          dispatch({
            type: actionConstants.SET_PARTICIPATE_IN_METAMETRICS,
            value: participationPreference,
          });

          resolve([participationPreference, metaMetricsId as string]);
        },
      );
    });
  };
}

export function setDataCollectionForMarketing(
  dataCollectionPreference: boolean,
): ThunkAction<
  Promise<[boolean, string]>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.setDataCollectionForMarketing`);
    await submitRequestToBackground('setDataCollectionForMarketing', [
      dataCollectionPreference,
    ]);
    dispatch({
      type: actionConstants.SET_DATA_COLLECTION_FOR_MARKETING,
      value: dataCollectionPreference,
    });
  };
}

export function setUseBlockie(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseBlockie`);
    callBackgroundMethod('setUseBlockie', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setUseNonceField(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseNonceField`);
    try {
      await submitRequestToBackground('setUseNonceField', [val]);
    } catch (error) {
      dispatch(displayWarning(error));
    }
    dispatch(hideLoadingIndication());
  };
}

export function setUsePhishDetect(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUsePhishDetect`);
    callBackgroundMethod('setUsePhishDetect', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setUseMultiAccountBalanceChecker(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseMultiAccountBalanceChecker`);
    callBackgroundMethod('setUseMultiAccountBalanceChecker', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setUseSafeChainsListValidation(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseSafeChainsListValidation`);
    callBackgroundMethod('setUseSafeChainsListValidation', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setUseTokenDetection(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseTokenDetection`);
    callBackgroundMethod('setUseTokenDetection', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setOpenSeaEnabled(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setOpenSeaEnabled`);
    try {
      await submitRequestToBackground('setOpenSeaEnabled', [val]);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setUseNftDetection(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseNftDetection`);
    try {
      await submitRequestToBackground('setUseNftDetection', [val]);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setUse4ByteResolution(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUse4ByteResolution`);
    try {
      await submitRequestToBackground('setUse4ByteResolution', [val]);
    } catch (error) {
      dispatch(displayWarning(error));
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setUseCurrencyRateCheck(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseCurrencyRateCheck`);
    callBackgroundMethod('setUseCurrencyRateCheck', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

// TokenDetectionController
export function detectTokens(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.detectTokens`);
    await submitRequestToBackground('detectTokens');
    dispatch(hideLoadingIndication());
    await forceUpdateMetamaskState(dispatch);
  };
}

export function detectNfts(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showNftStillFetchingIndication());
    log.debug(`background.detectNfts`);
    try {
      await submitRequestToBackground('detectNfts');
    } finally {
      dispatch(hideNftStillFetchingIndication());
    }
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setAdvancedGasFee(
  val: { chainId: Hex; maxBaseFee?: string; priorityFee?: string } | null,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setAdvancedGasFee`);
    callBackgroundMethod('setAdvancedGasFee', [val], (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setTheme(
  val: ThemeType,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setTheme`);
    try {
      await submitRequestToBackground('setTheme', [val]);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setIpfsGateway(
  val: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.setIpfsGateway`);
    callBackgroundMethod('setIpfsGateway', [val], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function toggleExternalServices(
  val: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.toggleExternalServices`);
    callBackgroundMethod('toggleExternalServices', [val], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setIsIpfsGatewayEnabled(
  val: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.setIsIpfsGatewayEnabled`);
    callBackgroundMethod('setIsIpfsGatewayEnabled', [val], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setUseAddressBarEnsResolution(
  val: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.setUseAddressBarEnsResolution`);
    callBackgroundMethod('setUseAddressBarEnsResolution', [val], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function updateCurrentLocale(
  key: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());

    try {
      await loadRelativeTimeFormatLocaleData(key);
      const localeMessages = await fetchLocale(key);
      const textDirection = await submitRequestToBackground<
        'rtl' | 'ltr' | 'auto'
      >('setCurrentLocale', [key]);
      switchDirection(textDirection);
      dispatch(setCurrentLocale(key, localeMessages));
    } catch (error) {
      dispatch(displayWarning(error));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setCurrentLocale(
  locale: string,
  messages: {
    [translationKey: string]: { message: string; description?: string };
  },
): PayloadAction<{
  locale: string;
  messages: {
    [translationKey: string]: { message: string; description?: string };
  };
}> {
  return {
    type: actionConstants.SET_CURRENT_LOCALE,
    payload: {
      locale,
      messages,
    },
  };
}

export function setPendingTokens(pendingTokens: {
  customToken?: Token;
  selectedTokens?: {
    [address: string]: Token & { isCustom?: boolean; unlisted?: boolean };
  };
  tokenAddressList: string[];
}) {
  const {
    customToken,
    selectedTokens = {},
    tokenAddressList = [],
  } = pendingTokens;
  const tokens =
    customToken?.address &&
    customToken?.symbol &&
    Boolean(customToken?.decimals >= 0 && customToken?.decimals <= 36)
      ? {
          ...selectedTokens,
          [customToken.address]: {
            ...customToken,
            isCustom: true,
          },
        }
      : selectedTokens;

  Object.keys(tokens).forEach((tokenAddress) => {
    const found = tokenAddressList.find((addr) =>
      isEqualCaseInsensitive(addr, tokenAddress),
    );

    tokens[tokenAddress] = {
      ...tokens[tokenAddress],
      unlisted: !found,
    };
  });

  return {
    type: actionConstants.SET_PENDING_TOKENS,
    payload: tokens,
  };
}

// Swaps

export function setSwapsLiveness(
  swapsLiveness: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsLiveness', [swapsLiveness]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsFeatureFlags(
  featureFlags: TemporaryFeatureFlagDef,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsFeatureFlags', [featureFlags]);
    await forceUpdateMetamaskState(dispatch);
  };
}

type Quotes = [
  { destinationAmount: string; decimals: number; aggregator: string },
  string,
];

export function fetchAndSetQuotes(
  fetchParams: {
    slippage: string;
    sourceToken: string;
    destinationToken: string;
    value: string;
    fromAddress: string;
    balanceError: string;
    sourceDecimals: number;
  },
  fetchParamsMetaData: {
    sourceTokenInfo: Token;
    destinationTokenInfo: Token;
    accountBalance: string;
    chainId: string;
  },
): ThunkAction<Promise<Quotes>, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const [quotes, selectedAggId] = await submitRequestToBackground<Quotes>(
      'fetchAndSetQuotes',
      [fetchParams, fetchParamsMetaData],
    );
    await forceUpdateMetamaskState(dispatch);
    return [quotes, selectedAggId];
  };
}

export function setSelectedQuoteAggId(
  aggId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSelectedQuoteAggId', [aggId]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsTokens(
  tokens: Token[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsTokens', [tokens]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function clearSwapsQuotes(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('clearSwapsQuotes');
    await forceUpdateMetamaskState(dispatch);
  };
}

export function resetBackgroundSwapsState(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('resetSwapsState');
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setCustomApproveTxData(
  data: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setCustomApproveTxData', [data]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsTxGasPrice(
  gasPrice: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsTxGasPrice', [gasPrice]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsTxGasLimit(
  gasLimit: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsTxGasLimit', [gasLimit, true]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function updateCustomSwapsEIP1559GasParams({
  gasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await Promise.all([
      submitRequestToBackground('setSwapsTxGasLimit', [gasLimit]),
      submitRequestToBackground('setSwapsTxMaxFeePerGas', [maxFeePerGas]),
      submitRequestToBackground('setSwapsTxMaxFeePriorityPerGas', [
        maxPriorityFeePerGas,
      ]),
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

// Note that the type widening happening below will resolve when we switch gas
// constants to TypeScript, at which point we'll get better type safety.
// TODO: Remove this comment when gas constants is typescript
export function updateSwapsUserFeeLevel(
  swapsCustomUserFeeLevel: PriorityLevels,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsUserFeeLevel', [
      swapsCustomUserFeeLevel,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsQuotesPollingLimitEnabled(
  quotesPollingLimitEnabled: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsQuotesPollingLimitEnabled', [
      quotesPollingLimitEnabled,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function safeRefetchQuotes(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('safeRefetchQuotes');
    await forceUpdateMetamaskState(dispatch);
  };
}

export function stopPollingForQuotes(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('stopPollingForQuotes');
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setBackgroundSwapRouteState(
  routeState: '' | 'loading' | 'awaiting' | 'smartTransactionStatus',
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setBackgroundSwapRouteState', [
      routeState,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function resetSwapsPostFetchState(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('resetPostFetchState');
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsErrorKey(
  errorKey: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setSwapsErrorKey', [errorKey]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setInitialGasEstimate(
  initialAggId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('setInitialGasEstimate', [initialAggId]);
    await forceUpdateMetamaskState(dispatch);
  };
}

// Permissions

export function requestAccountsPermissionWithId(
  origin: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const id = await submitRequestToBackground(
      'requestAccountsPermissionWithId',
      [origin],
    );
    await forceUpdateMetamaskState(dispatch);
    return id;
  };
}

/**
 * Approves the permissions request.
 *
 * @param request - The permissions request to approve.
 */
export function approvePermissionsRequest(
  request: PermissionsRequest,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    callBackgroundMethod('approvePermissionsRequest', [request], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
      forceUpdateMetamaskState(dispatch);
    });
  };
}

/**
 * Rejects the permissions request with the given ID.
 *
 * @param requestId - The id of the request to be rejected
 */
export function rejectPermissionsRequest(
  requestId: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    return new Promise((resolve, reject) => {
      callBackgroundMethod('rejectPermissionsRequest', [requestId], (err) => {
        if (err) {
          dispatch(displayWarning(err));
          reject(err);
          return;
        }
        forceUpdateMetamaskState(dispatch).then(resolve).catch(reject);
      });
    });
  };
}

/**
 * Clears the given permissions for the given origin.
 *
 * @param subjects
 */
export function removePermissionsFor(
  subjects: Record<string, NonEmptyArray<string>>,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    callBackgroundMethod('removePermissionsFor', [subjects], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

/**
 * Updates the order of networks after drag and drop
 *
 * @param orderedNetworkList
 */
export function updateNetworksList(
  orderedNetworkList: [],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    await submitRequestToBackground('updateNetworksList', [orderedNetworkList]);
  };
}

/**
 * Updates the pinned accounts list
 *
 * @param pinnedAccountList
 */
export function updateAccountsList(
  pinnedAccountList: [],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    await submitRequestToBackground('updateAccountsList', [pinnedAccountList]);
  };
}

/**
 * Hides account in the accounts list
 *
 * @param hiddenAccountList
 */
export function updateHiddenAccountsList(
  hiddenAccountList: [],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    await submitRequestToBackground('updateHiddenAccountsList', [
      hiddenAccountList,
    ]);
  };
}

// Pending Approvals

/**
 * Resolves a pending approval and closes the current notification window if no
 * further approvals are pending after the background state updates.
 *
 * @param id - The pending approval id
 * @param [value] - The value required to confirm a pending approval
 */
export function resolvePendingApproval(
  id: string,
  value: unknown,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (_dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('resolvePendingApproval', [id, value]);
    // Before closing the current window, check if any additional confirmations
    // are added as a result of this confirmation being accepted

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    const { pendingApprovals } = await forceUpdateMetamaskState(_dispatch);
    if (Object.values(pendingApprovals).length === 0) {
      _dispatch(closeCurrentNotificationWindow());
    }
    ///: END:ONLY_INCLUDE_IF
  };
}

/**
 * Rejects a pending approval and closes the current notification window if no
 * further approvals are pending after the background state updates.
 *
 * @param id - The pending approval id
 * @param [error] - The error to throw when rejecting the approval
 */
export function rejectPendingApproval(
  id: string,
  error: unknown,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground('rejectPendingApproval', [id, error]);
    // Before closing the current window, check if any additional confirmations
    // are added as a result of this confirmation being rejected
    const { pendingApprovals } = await forceUpdateMetamaskState(dispatch);
    if (Object.values(pendingApprovals).length === 0) {
      dispatch(closeCurrentNotificationWindow());
    }
  };
}

/**
 * Rejects all approvals for the given messages
 *
 * @param messageList - The list of messages to reject
 */
export function rejectAllMessages(
  messageList: [],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const userRejectionError = serializeError(
      ethErrors.provider.userRejectedRequest(),
    );
    await Promise.all(
      messageList.map(
        async ({ id }) =>
          await submitRequestToBackground('rejectPendingApproval', [
            id,
            userRejectionError,
          ]),
      ),
    );
    const { pendingApprovals } = await forceUpdateMetamaskState(dispatch);
    if (Object.values(pendingApprovals).length === 0) {
      dispatch(closeCurrentNotificationWindow());
    }
  };
}

export function setFirstTimeFlowType(
  type: FirstTimeFlowType,
): ThunkAction<Promise<void>, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      log.debug(`background.setFirstTimeFlowType`);
      await submitRequestToBackground('setFirstTimeFlowType', [type]);
      dispatch({
        type: actionConstants.SET_FIRST_TIME_FLOW_TYPE,
        value: type,
      });
    } catch (err) {
      dispatch(displayWarning(err));
    }
  };
}

export function setSelectedNetworkConfigurationId(
  networkConfigurationId: string,
): PayloadAction<string> {
  return {
    type: actionConstants.SET_SELECTED_NETWORK_CONFIGURATION_ID,
    payload: networkConfigurationId,
  };
}

export function setNewNetworkAdded({
  networkConfigurationId,
  nickname,
}: {
  networkConfigurationId: string;
  nickname: string;
}): PayloadAction<object> {
  return {
    type: actionConstants.SET_NEW_NETWORK_ADDED,
    payload: { networkConfigurationId, nickname },
  };
}

export function setEditedNetwork(
  payload:
    | {
        chainId: string;
        networkConfigurationId?: string;
        nickname: string;
        editCompleted?: boolean;
      }
    | undefined = undefined,
): PayloadAction<object> {
  return { type: actionConstants.SET_EDIT_NETWORK, payload };
}

export function setNewNftAddedMessage(
  newNftAddedMessage: string,
): PayloadAction<string> {
  return {
    type: actionConstants.SET_NEW_NFT_ADDED_MESSAGE,
    payload: newNftAddedMessage,
  };
}

export function setRemoveNftMessage(
  removeNftMessage: string,
): PayloadAction<string> {
  return {
    type: actionConstants.SET_REMOVE_NFT_MESSAGE,
    payload: removeNftMessage,
  };
}

export function setNewTokensImported(
  newTokensImported: string,
): PayloadAction<string> {
  return {
    type: actionConstants.SET_NEW_TOKENS_IMPORTED,
    payload: newTokensImported,
  };
}

export function setNewTokensImportedError(
  newTokensImportedError: string,
): PayloadAction<string> {
  return {
    type: actionConstants.SET_NEW_TOKENS_IMPORTED_ERROR,
    payload: newTokensImportedError,
  };
}

export function setLastActiveTime(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    callBackgroundMethod('setLastActiveTime', [], (err) => {
      if (err) {
        dispatch(displayWarning(err));
      }
    });
  };
}

export function setDismissSeedBackUpReminder(
  value: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    await submitRequestToBackground('setDismissSeedBackUpReminder', [value]);
    dispatch(hideLoadingIndication());
  };
}

export function getRpcMethodPreferences(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(showLoadingIndication());
    await submitRequestToBackground('getRpcMethodPreferences', []);
    dispatch(hideLoadingIndication());
  };
}

export function setConnectedStatusPopoverHasBeenShown(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return () => {
    callBackgroundMethod('setConnectedStatusPopoverHasBeenShown', [], (err) => {
      if (isErrorWithMessage(err)) {
        throw new Error(err.message);
      }
    });
  };
}

export function setRecoveryPhraseReminderHasBeenShown() {
  return () => {
    callBackgroundMethod('setRecoveryPhraseReminderHasBeenShown', [], (err) => {
      if (isErrorWithMessage(err)) {
        throw new Error(err.message);
      }
    });
  };
}

export function setRecoveryPhraseReminderLastShown(
  lastShown: number,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return () => {
    callBackgroundMethod(
      'setRecoveryPhraseReminderLastShown',
      [lastShown],
      (err) => {
        if (isErrorWithMessage(err)) {
          throw new Error(err.message);
        }
      },
    );
  };
}

export function setTermsOfUseLastAgreed(lastAgreed: number) {
  return async () => {
    await submitRequestToBackground('setTermsOfUseLastAgreed', [lastAgreed]);
  };
}

export function setSurveyLinkLastClickedOrClosed(time: number) {
  return async () => {
    await submitRequestToBackground('setSurveyLinkLastClickedOrClosed', [time]);
  };
}

export function setNewPrivacyPolicyToastClickedOrClosed() {
  return async () => {
    await submitRequestToBackground('setNewPrivacyPolicyToastClickedOrClosed');
  };
}

export function setOnboardingDate() {
  return async () => {
    await submitRequestToBackground('setOnboardingDate');
  };
}

export function setNewPrivacyPolicyToastShownDate(time: number) {
  return async () => {
    await submitRequestToBackground('setNewPrivacyPolicyToastShownDate', [
      time,
    ]);
  };
}

export function setOutdatedBrowserWarningLastShown(lastShown: number) {
  return async () => {
    await submitRequestToBackground('setOutdatedBrowserWarningLastShown', [
      lastShown,
    ]);
  };
}

export function getContractMethodData(
  data = '',
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch, getState) => {
    const prefixedData = addHexPrefix(data);
    const fourBytePrefix = prefixedData.slice(0, 10);
    if (fourBytePrefix.length < 10) {
      return {};
    }
    const { knownMethodData, use4ByteResolution } = getState().metamask;
    if (
      knownMethodData?.[fourBytePrefix] &&
      Object.keys(knownMethodData[fourBytePrefix]).length !== 0
    ) {
      return knownMethodData[fourBytePrefix];
    }

    log.debug(`loadingMethodData`);

    const { name, params } = (await getMethodDataAsync(
      fourBytePrefix,
      use4ByteResolution,
    )) as {
      name: string;
      params: unknown;
    };

    callBackgroundMethod(
      'addKnownMethodData',
      [fourBytePrefix, { name, params }],
      (err) => {
        if (err) {
          dispatch(displayWarning(err));
        }
      },
    );
    return { name, params };
  };
}

export function setSeedPhraseBackedUp(
  seedPhraseBackupState: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch: MetaMaskReduxDispatch) => {
    log.debug(`background.setSeedPhraseBackedUp`);
    return new Promise((resolve, reject) => {
      callBackgroundMethod(
        'setSeedPhraseBackedUp',
        [seedPhraseBackupState],
        (err) => {
          if (err) {
            dispatch(displayWarning(err));
            reject(err);
            return;
          }
          forceUpdateMetamaskState(dispatch).then(resolve).catch(reject);
        },
      );
    });
  };
}

export function setNextNonce(nextNonce: string): PayloadAction<string> {
  return {
    type: actionConstants.SET_NEXT_NONCE,
    payload: nextNonce,
  };
}

/**
 * This function initiates the nonceLock in the background for the given
 * address, and returns the next nonce to use. It then calls setNextNonce which
 * sets the nonce in state on the nextNonce key. NOTE: The nextNonce key is
 * actually ephemeral application state. It does not appear to be part of the
 * background state.
 *
 * TODO: move this to a different slice, MetaMask slice will eventually be
 * deprecated because it should not contain any ephemeral/app state but just
 * background state. In addition we should key nextNonce by address to prevent
 * accidental usage of a stale nonce as the call to getNextNonce only works for
 * the currently selected address.
 *
 * @returns
 */
export function getNextNonce(): ThunkAction<
  Promise<string>,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch, getState) => {
    const { address } = getSelectedInternalAccount(getState());
    const networkClientId = getSelectedNetworkClientId(getState());
    let nextNonce;
    try {
      nextNonce = await submitRequestToBackground<string>('getNextNonce', [
        address,
        networkClientId,
      ]);
    } catch (error) {
      dispatch(displayWarning(error));
      throw error;
    }
    dispatch(setNextNonce(nextNonce));
    return nextNonce;
  };
}

export function setRequestAccountTabIds(requestAccountTabIds: {
  [origin: string]: string;
}): PayloadAction<{
  [origin: string]: string;
}> {
  return {
    type: actionConstants.SET_REQUEST_ACCOUNT_TABS,
    payload: requestAccountTabIds,
  };
}

export function getRequestAccountTabIds(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const requestAccountTabIds = await submitRequestToBackground<{
      [origin: string]: string;
    }>('getRequestAccountTabIds');
    dispatch(setRequestAccountTabIds(requestAccountTabIds));
  };
}

export function setOpenMetamaskTabsIDs(openMetaMaskTabIDs: {
  [tabId: string]: boolean;
}): PayloadAction<{ [tabId: string]: boolean }> {
  return {
    type: actionConstants.SET_OPEN_METAMASK_TAB_IDS,
    payload: openMetaMaskTabIDs,
  };
}

export function getOpenMetamaskTabsIds(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const openMetaMaskTabIDs = await submitRequestToBackground<{
      [tabId: string]: boolean;
    }>('getOpenMetamaskTabsIds');
    dispatch(setOpenMetamaskTabsIDs(openMetaMaskTabIDs));
  };
}

export async function attemptLedgerTransportCreation() {
  return await submitRequestToBackground('attemptLedgerTransportCreation');
}

/**
 * This method deduplicates error reports to sentry by maintaining a state
 * object 'singleExceptions' in the app slice. The only place this state object
 * is accessed from is within this method, to check if it has already seen and
 * therefore tracked this error. This is to avoid overloading sentry with lots
 * of duplicate errors.
 *
 * @param error
 * @returns
 */
export function captureSingleException(
  error: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch, getState) => {
    const { singleExceptions } = getState().appState;
    if (!(error in singleExceptions)) {
      dispatch({
        type: actionConstants.CAPTURE_SINGLE_EXCEPTION,
        value: error,
      });
      captureException(Error(error));
    }
  };
}

// Wrappers around promisifedBackground
/**
 * The "actions" below are not actions nor action creators. They cannot use
 * dispatch nor should they be dispatched when used. Instead they can be
 * called directly. These wrappers will be moved into their location at some
 * point in the future.
 */

export function estimateGas(params: TransactionParams): Promise<Hex> {
  return submitRequestToBackground('estimateGas', [params]);
}

export async function updateTokenType(
  tokenAddress: string,
): Promise<Token | undefined> {
  try {
    return await submitRequestToBackground('updateTokenType', [tokenAddress]);
  } catch (error) {
    logErrorWithMessage(error);
  }
  return undefined;
}

export async function addPollingTokenToAppState(pollingToken: string) {
  return submitRequestToBackground('addPollingTokenToAppState', [
    pollingToken,
    POLLING_TOKEN_ENVIRONMENT_TYPES[getEnvironmentType()],
  ]);
}

export async function removePollingTokenFromAppState(pollingToken: string) {
  return submitRequestToBackground('removePollingTokenFromAppState', [
    pollingToken,
    POLLING_TOKEN_ENVIRONMENT_TYPES[getEnvironmentType()],
  ]);
}

/**
 * Informs the CurrencyRateController that the UI requires currency rate polling
 *
 * @param networkClientId - unique identifier for the network client
 * @returns polling token that can be used to stop polling
 */
export async function currencyRateStartPollingByNetworkClientId(
  networkClientId: string,
): Promise<string> {
  const pollingToken = await submitRequestToBackground(
    'currencyRateStartPollingByNetworkClientId',
    [networkClientId],
  );
  await addPollingTokenToAppState(pollingToken);
  return pollingToken;
}

/**
 * Informs the CurrencyRateController that the UI no longer requires currency rate polling
 * for the given network client.
 * If all network clients unsubscribe, the controller stops polling.
 *
 * @param pollingToken - Poll token received from calling startPollingByNetworkClientId
 */
export async function currencyRateStopPollingByPollingToken(
  pollingToken: string,
) {
  await submitRequestToBackground('currencyRateStopPollingByPollingToken', [
    pollingToken,
  ]);
  await removePollingTokenFromAppState(pollingToken);
}

/**
 * Informs the GasFeeController that the UI requires gas fee polling
 *
 * @param networkClientId - unique identifier for the network client
 * @returns polling token that can be used to stop polling
 */
export async function gasFeeStartPollingByNetworkClientId(
  networkClientId: string,
) {
  const pollingToken = await submitRequestToBackground(
    'gasFeeStartPollingByNetworkClientId',
    [networkClientId],
  );
  await addPollingTokenToAppState(pollingToken);
  return pollingToken;
}

/**
 * Informs the GasFeeController that the UI no longer requires gas fee polling
 * for the given network client.
 * If all network clients unsubscribe, the controller stops polling.
 *
 * @param pollingToken - Poll token received from calling startPollingByNetworkClientId
 */
export async function gasFeeStopPollingByPollingToken(pollingToken: string) {
  await submitRequestToBackground('gasFeeStopPollingByPollingToken', [
    pollingToken,
  ]);
  await removePollingTokenFromAppState(pollingToken);
}

export function getGasFeeTimeEstimate(
  maxPriorityFeePerGas: string,
  maxFeePerGas: string,
): Promise<ReturnType<GasFeeController['getTimeEstimate']>> {
  return submitRequestToBackground('getGasFeeTimeEstimate', [
    maxPriorityFeePerGas,
    maxFeePerGas,
  ]);
}

export async function closeNotificationPopup() {
  await submitRequestToBackground('markNotificationPopupAsAutomaticallyClosed');
  global.platform.closeCurrentWindow();
}

/**
 * @param payload - details of the event to track
 * @param options - options for routing/handling of event
 * @returns
 */
export function trackMetaMetricsEvent(
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) {
  return submitRequestToBackground('trackMetaMetricsEvent', [
    { ...payload, actionId: generateActionId() },
    options,
  ]);
}

export function createEventFragment(
  options: MetaMetricsEventFragment,
): Promise<string> {
  const actionId = generateActionId();
  return submitRequestToBackground('createEventFragment', [
    { ...options, actionId },
  ]);
}

export function createTransactionEventFragment(
  transactionId: string,
): Promise<string> {
  const actionId = generateActionId();
  return submitRequestToBackground('createTransactionEventFragment', [
    {
      transactionId,
      actionId,
    },
  ]);
}

export function updateEventFragment(
  id: string,
  payload: MetaMetricsEventFragment,
) {
  return submitRequestToBackground('updateEventFragment', [id, payload]);
}

export function finalizeEventFragment(
  id: string,
  options?: {
    abandoned?: boolean;
    page?: MetaMetricsPageObject;
    referrer?: MetaMetricsReferrerObject;
  },
) {
  return submitRequestToBackground('finalizeEventFragment', [id, options]);
}

/**
 * @param payload - details of the page viewed
 * @param options - options for handling the page view
 */
export function trackMetaMetricsPage(
  payload: MetaMetricsPagePayload,
  options: MetaMetricsPageOptions,
) {
  return submitRequestToBackground('trackMetaMetricsPage', [
    { ...payload, actionId: generateActionId() },
    options,
  ]);
}

export function resetViewedNotifications() {
  return submitRequestToBackground('resetViewedNotifications');
}

export function updateViewedNotifications(notificationIdViewedStatusMap: {
  [notificationId: string]: boolean;
}) {
  return submitRequestToBackground('updateViewedNotifications', [
    notificationIdViewedStatusMap,
  ]);
}

export async function setAlertEnabledness(
  alertId: string,
  enabledness: boolean,
) {
  await submitRequestToBackground('setAlertEnabledness', [
    alertId,
    enabledness,
  ]);
}

export async function setUnconnectedAccountAlertShown(origin: string) {
  await submitRequestToBackground('setUnconnectedAccountAlertShown', [origin]);
}

export async function setWeb3ShimUsageAlertDismissed(origin: string) {
  await submitRequestToBackground('setWeb3ShimUsageAlertDismissed', [origin]);
}

// Smart Transactions Controller
export function clearSmartTransactionFees() {
  submitRequestToBackground('clearSmartTransactionFees');
}

export function fetchSmartTransactionFees(
  unsignedTransaction: Partial<TransactionParams> & { chainId: string },
  approveTxParams: TransactionParams,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    if (approveTxParams) {
      approveTxParams.value = '0x0';
    }
    try {
      const smartTransactionFees = await await submitRequestToBackground(
        'fetchSmartTransactionFees',
        [unsignedTransaction, approveTxParams],
      );
      dispatch({
        type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
        payload: null,
      });
      return smartTransactionFees;
    } catch (err) {
      logErrorWithMessage(err);
      if (isErrorWithMessage(err) && err.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(err.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj,
        });
      }
      throw err;
    }
  };
}

type TemporarySmartTransactionGasFees = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gas: string;
  value: string;
};

const createSignedTransactions = async (
  unsignedTransaction: Partial<TransactionParams> & { chainId: string },
  fees: TemporarySmartTransactionGasFees[],
  areCancelTransactions?: boolean,
): Promise<TransactionParams[]> => {
  const unsignedTransactionsWithFees = fees.map((fee) => {
    const unsignedTransactionWithFees = {
      ...unsignedTransaction,
      maxFeePerGas: decimalToHex(fee.maxFeePerGas),
      maxPriorityFeePerGas: decimalToHex(fee.maxPriorityFeePerGas),
      gas: areCancelTransactions
        ? decimalToHex(21000) // It has to be 21000 for cancel transactions, otherwise the API would reject it.
        : unsignedTransaction.gas,
      value: unsignedTransaction.value,
    };
    if (areCancelTransactions) {
      unsignedTransactionWithFees.to = unsignedTransactionWithFees.from;
      unsignedTransactionWithFees.data = '0x';
    }
    return unsignedTransactionWithFees;
  });
  const signedTransactions = await submitRequestToBackground<
    TransactionParams[]
  >('approveTransactionsWithSameNonce', [unsignedTransactionsWithFees]);
  return signedTransactions;
};

export function signAndSendSmartTransaction({
  unsignedTransaction,
  smartTransactionFees,
}: {
  unsignedTransaction: Partial<TransactionParams> & { chainId: string };
  smartTransactionFees: {
    fees: TemporarySmartTransactionGasFees[];
    cancelFees: TemporarySmartTransactionGasFees[];
  };
}): ThunkAction<Promise<string>, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const signedTransactions = await createSignedTransactions(
      unsignedTransaction,
      smartTransactionFees.fees,
    );
    const signedCanceledTransactions = await createSignedTransactions(
      unsignedTransaction,
      smartTransactionFees.cancelFees,
      true,
    );
    try {
      const response = await submitRequestToBackground<{ uuid: string }>(
        'submitSignedTransactions',
        [
          {
            signedTransactions,
            signedCanceledTransactions,
            txParams: unsignedTransaction,
          },
        ],
      ); // Returns e.g.: { uuid: 'dP23W7c2kt4FK9TmXOkz1UM2F20' }
      return response.uuid;
    } catch (err) {
      logErrorWithMessage(err);
      if (isErrorWithMessage(err) && err.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(err.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj,
        });
      }
      throw err;
    }
  };
}

export function updateSmartTransaction(
  uuid: string,
  txMeta: TransactionMeta,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('updateSmartTransaction', [
        {
          uuid,
          ...txMeta,
        },
      ]);
    } catch (err) {
      logErrorWithMessage(err);
      if (isErrorWithMessage(err) && err.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(err.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj,
        });
      }
      throw err;
    }
  };
}

export function setSmartTransactionsRefreshInterval(
  refreshInterval: number,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    try {
      await submitRequestToBackground('setStatusRefreshInterval', [
        refreshInterval,
      ]);
    } catch (err) {
      logErrorWithMessage(err);
    }
  };
}

export function cancelSmartTransaction(
  uuid: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('cancelSmartTransaction', [uuid]);
    } catch (err) {
      logErrorWithMessage(err);
      if (isErrorWithMessage(err) && err.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(err.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj,
        });
      }
      throw err;
    }
  };
}

// TODO: Not a thunk but rather a wrapper around a background call
export function fetchSmartTransactionsLiveness() {
  return async () => {
    try {
      await submitRequestToBackground('fetchSmartTransactionsLiveness');
    } catch (err) {
      logErrorWithMessage(err);
    }
  };
}

export function dismissSmartTransactionsErrorMessage(): Action {
  return {
    type: actionConstants.DISMISS_SMART_TRANSACTIONS_ERROR_MESSAGE,
  };
}

// App state
export function hideTestNetMessage() {
  return submitRequestToBackground('setShowTestnetMessageInDropdown', [false]);
}

export function hideBetaHeader() {
  return submitRequestToBackground('setShowBetaHeader', [false]);
}

export function hidePermissionsTour() {
  return submitRequestToBackground('setShowPermissionsTour', [false]);
}

export function hideAccountBanner() {
  return submitRequestToBackground('setShowAccountBanner', [false]);
}

export function hideNetworkBanner() {
  return submitRequestToBackground('setShowNetworkBanner', [false]);
}

export function neverShowSwitchedNetworkMessage() {
  return submitRequestToBackground('setSwitchedNetworkNeverShowMessage', [
    true,
  ]);
}

/**
 * Sends the background state the networkClientId and domain upon network switch
 *
 * @param selectedTabOrigin - The origin to set the new networkClientId for
 * @param networkClientId - The new networkClientId
 */
export function setNetworkClientIdForDomain(
  selectedTabOrigin: string,
  networkClientId: string,
): Promise<void> {
  return submitRequestToBackground('setNetworkClientIdForDomain', [
    selectedTabOrigin,
    networkClientId,
  ]);
}

export function setSecurityAlertsEnabled(val: boolean): void {
  try {
    submitRequestToBackground('setSecurityAlertsEnabled', [val]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export async function setWatchEthereumAccountEnabled(value: boolean) {
  try {
    await submitRequestToBackground('setWatchEthereumAccountEnabled', [value]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export async function setBitcoinSupportEnabled(value: boolean) {
  try {
    await submitRequestToBackground('setBitcoinSupportEnabled', [value]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export async function setBitcoinTestnetSupportEnabled(value: boolean) {
  try {
    await submitRequestToBackground('setBitcoinTestnetSupportEnabled', [value]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export async function setAddSnapAccountEnabled(value: boolean): Promise<void> {
  try {
    await submitRequestToBackground('setAddSnapAccountEnabled', [value]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export function showKeyringSnapRemovalModal(payload: {
  snapName: string;
  result: 'success' | 'failed';
}) {
  return {
    type: actionConstants.SHOW_KEYRING_SNAP_REMOVAL_RESULT,
    payload,
  };
}

export function hideKeyringRemovalResultModal() {
  return {
    type: actionConstants.HIDE_KEYRING_SNAP_REMOVAL_RESULT,
  };
}

export async function getSnapAccountsById(snapId: string): Promise<string[]> {
  const addresses: string[] = await submitRequestToBackground(
    'getAccountsBySnapId',
    [snapId],
  );

  return addresses;
}
///: END:ONLY_INCLUDE_IF

export function setUseRequestQueue(val: boolean): void {
  try {
    submitRequestToBackground('setUseRequestQueue', [val]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export function setUseExternalNameSources(val: boolean): void {
  try {
    submitRequestToBackground('setUseExternalNameSources', [val]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export function setUseTransactionSimulations(val: boolean): void {
  try {
    submitRequestToBackground('setUseTransactionSimulations', [val]);
  } catch (error) {
    logErrorWithMessage(error);
  }
}

export function setFirstTimeUsedNetwork(chainId: string) {
  return submitRequestToBackground('setFirstTimeUsedNetwork', [chainId]);
}

// QR Hardware Wallets
export async function submitQRHardwareCryptoHDKey(cbor: Hex) {
  await submitRequestToBackground('submitQRHardwareCryptoHDKey', [cbor]);
}

export async function submitQRHardwareCryptoAccount(cbor: Hex) {
  await submitRequestToBackground('submitQRHardwareCryptoAccount', [cbor]);
}

export function cancelSyncQRHardware(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(hideLoadingIndication());
    await submitRequestToBackground('cancelSyncQRHardware');
  };
}

export async function submitQRHardwareSignature(requestId: string, cbor: Hex) {
  await submitRequestToBackground('submitQRHardwareSignature', [
    requestId,
    cbor,
  ]);
}

export function cancelQRHardwareSignRequest(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    dispatch(hideLoadingIndication());
    await submitRequestToBackground('cancelQRHardwareSignRequest');
  };
}

export function requestUserApproval({
  origin,
  type,
  requestData,
}: {
  origin: string;
  type: string;
  requestData: object;
}): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      await submitRequestToBackground('requestUserApproval', [
        {
          origin,
          type,
          requestData,
        },
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      dispatch(displayWarning('Had trouble requesting user approval'));
    }
  };
}

export async function getCurrentNetworkEIP1559Compatibility(): Promise<
  boolean | undefined
> {
  let networkEIP1559Compatibility;
  try {
    networkEIP1559Compatibility = await submitRequestToBackground<boolean>(
      'getCurrentNetworkEIP1559Compatibility',
    );
  } catch (error) {
    console.error(error);
  }
  return networkEIP1559Compatibility;
}

export async function getNetworkConfigurationByNetworkClientId(
  networkClientId: NetworkClientId,
): Promise<NetworkConfiguration | undefined> {
  let networkConfiguration;
  try {
    networkConfiguration =
      await submitRequestToBackground<NetworkConfiguration>(
        'getNetworkConfigurationByNetworkClientId',
        [networkClientId],
      );
  } catch (error) {
    console.error(error);
  }
  return networkConfiguration;
}

export function updateProposedNames(
  request: UpdateProposedNamesRequest,
): ThunkAction<
  UpdateProposedNamesResult,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (async () => {
    const data = await submitRequestToBackground<UpdateProposedNamesResult>(
      'updateProposedNames',
      [request],
    );

    return data;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

export function setName(
  request: SetNameRequest,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (async () => {
    await submitRequestToBackground<void>('setName', [request]);
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

/**
 * Throw an error in the background for testing purposes.
 *
 * @param message - The error message.
 * @deprecated This is only meant to facilitiate E2E testing. We should not use
 * this for handling errors.
 */
export async function throwTestBackgroundError(message: string): Promise<void> {
  await submitRequestToBackground('throwTestError', [message]);
}

/**
 * Set status of popover warning for the first snap installation.
 *
 * @param shown - True if popover has been shown.
 * @returns Promise Resolved on successfully submitted background request.
 */
export function setSnapsInstallPrivacyWarningShownStatus(shown: boolean) {
  return async () => {
    await submitRequestToBackground(
      'setSnapsInstallPrivacyWarningShownStatus',
      [shown],
    );
  };
}

/**
 * Update the state of a given Snap interface.
 *
 * @param id - The Snap interface ID.
 * @param state - The interface state.
 * @returns Promise Resolved on successfully submitted background request.
 */
export function updateInterfaceState(
  id: string,
  state: InterfaceState,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground<void>('updateInterfaceState', [id, state]);
    await forceUpdateMetamaskState(dispatch);
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

/**
 * Delete the Snap interface from state.
 *
 * @param id - The Snap interface ID.
 * @returns Promise Resolved on successfully submitted background request.
 */
export function deleteInterface(
  id: string,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground<void>('deleteInterface', [id]);
    await forceUpdateMetamaskState(dispatch);
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

export function trackInsightSnapUsage(snapId: string) {
  return async () => {
    await submitRequestToBackground('trackInsightSnapView', [snapId]);
  };
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export async function setSnapsAddSnapAccountModalDismissed() {
  await submitRequestToBackground('setSnapsAddSnapAccountModalDismissed', [
    true,
  ]);
}
///: END:ONLY_INCLUDE_IF

/**
 * Initiates the sign-in process.
 *
 * This function dispatches a request to the background script to perform the sign-in operation.
 * Upon success, it dispatches an action with type `PERFORM_SIGN_IN` to update the Redux state.
 * If the operation fails, it logs the error message and rethrows the error.
 *
 * @returns A thunk action that performs the sign-in operation.
 */
export function performSignIn(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('performSignIn');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during sign-in.';
      logErrorWithMessage(errorMessage);
      throw error;
    }
  };
}

/**
 * Initiates the sign-out process.
 *
 * This function dispatches a request to the background script to perform the sign-out operation.
 * Upon success, it dispatches an action with type `PERFORM_SIGN_OUT` to update the Redux state.
 * If the operation fails, it logs the error message and rethrows the error.
 *
 * @returns A thunk action that performs the sign-out operation.
 */
export function performSignOut(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('performSignOut');
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Enables profile syncing.
 *
 * This function sends a request to the background script to enable profile syncing across devices.
 * Upon success, it dispatches an action with type `SET_PROFILE_SYNCING_ENABLED` to update the Redux state.
 * If the operation encounters an error, it logs the error message and rethrows the error to be handled by the caller.
 *
 * @returns A thunk action that, when dispatched, attempts to enable profile syncing.
 */
export function enableProfileSyncing(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('enableProfileSyncing');
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Disables profile syncing.
 *
 * This function sends a request to the background script to disable profile syncing across devices.
 * Upon success, it dispatches an action with type `SET_PROFILE_SYNCING_DISABLED` to update the Redux state.
 * If the operation fails, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @returns A thunk action that, when dispatched, attempts to disable profile syncing.
 */
export function disableProfileSyncing(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('disableProfileSyncing');
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Initiates the creation of on-chain triggers.
 *
 * This function dispatches a request to the background script to create on-chain triggers.
 * Upon success, it dispatches an action with type `CREATE_ON_CHAIN_TRIGGERS` to update the Redux state.
 * If the operation fails, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @returns A thunk action that, when dispatched, attempts to create on-chain triggers.
 */
export function createOnChainTriggers(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('createOnChainTriggers');
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Deletes on-chain triggers associated with specified accounts.
 *
 * This function sends a request to the background script to delete on-chain triggers for the provided accounts.
 * Upon success, it dispatches an action with type `DELETE_ON_CHAIN_TRIGGERS_BY_ACCOUNT` to update the Redux state.
 * If the operation encounters an error, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @param accounts - An array of account identifiers for which on-chain triggers should be deleted.
 * @returns A thunk action that, when dispatched, attempts to delete on-chain triggers for the specified accounts.
 */
export function deleteOnChainTriggersByAccount(
  accounts: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    try {
      await submitRequestToBackground('deleteOnChainTriggersByAccount', [
        accounts,
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Updates on-chain triggers for specified accounts.
 *
 * This function dispatches a request to the background script to update on-chain triggers associated with the given accounts.
 * Upon success, it dispatches an action with type `UPDATE_ON_CHAIN_TRIGGERS_BY_ACCOUNT` to update the Redux state.
 * If the operation fails, it logs the error message and rethrows the error to ensure proper error handling.
 *
 * @param accounts - An array of account identifiers for which on-chain triggers should be updated.
 * @returns A thunk action that, when dispatched, attempts to update on-chain triggers for the specified accounts.
 */
export function updateOnChainTriggersByAccount(
  accounts: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    try {
      await submitRequestToBackground('updateOnChainTriggersByAccount', [
        accounts,
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Fetches and updates MetaMask notifications.
 *
 * This function sends a request to the background script to fetch the latest notifications and update the state accordingly.
 * Upon success, it dispatches an action with type `FETCH_AND_UPDATE_METAMASK_NOTIFICATIONS` to update the Redux state.
 * If the operation encounters an error, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @returns A thunk action that, when dispatched, attempts to fetch and update MetaMask notifications.
 */
export function fetchAndUpdateMetamaskNotifications(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      const response = await submitRequestToBackground(
        'fetchAndUpdateMetamaskNotifications',
      );
      return response;
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Marks MetaMask notifications as read.
 *
 * This function sends a request to the background script to mark the specified notifications as read.
 * Upon success, it dispatches an action with type `MARK_METAMASK_NOTIFICATIONS_AS_READ` to update the Redux state.
 * If the operation encounters an error, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @param notifications - An array of notification identifiers to be marked as read.
 * @returns A thunk action that, when dispatched, attempts to mark MetaMask notifications as read.
 */
export function markMetamaskNotificationsAsRead(
  notifications: NotificationServicesController.Types.MarkAsReadNotificationsParam,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    try {
      await submitRequestToBackground('markMetamaskNotificationsAsRead', [
        notifications,
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Enables or disables feature announcements.
 *
 * This function sends a request to the background script to toggle the enabled state of feature announcements.
 * Upon success, it dispatches an action with type `SET_FEATURE_ANNOUNCEMENTS_ENABLED` to update the Redux state.
 * If the operation encounters an error, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @param state - A boolean indicating whether to enable (true) or disable (false) feature announcements.
 * @returns A thunk action that, when dispatched, attempts to set the enabled state of feature announcements.
 */
export function setFeatureAnnouncementsEnabled(
  state: boolean,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    try {
      await submitRequestToBackground('setFeatureAnnouncementsEnabled', [
        state,
      ]);
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Checks the presence of accounts in user storage.
 *
 * This function sends a request to the background script to check the presence of specified accounts in user storage.
 * Upon success, it dispatches an action with type `CHECK_ACCOUNTS_PRESENCE` to update the Redux state.
 * If the operation encounters an error, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @param accounts - An array of account addresses to be checked.
 * @returns A thunk action that, when dispatched, attempts to check the presence of accounts in user storage.
 */
export function checkAccountsPresence(
  accounts: string[],
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async () => {
    try {
      const response = await submitRequestToBackground(
        'checkAccountsPresence',
        [accounts],
      );
      return response;
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    }
  };
}

/**
 * Triggers a modal to confirm the action of turning off profile syncing.
 * This function dispatches an action to show a modal dialog asking the user to confirm if they want to turn off profile syncing.
 *
 * @returns A thunk action that, when dispatched, shows the confirmation modal.
 */
export function showConfirmTurnOffProfileSyncing(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      showModal({
        name: 'CONFIRM_TURN_OFF_PROFILE_SYNCING',
      }),
    );
  };
}

/**
 * Triggers a modal to confirm the action of turning on MetaMask notifications.
 * This function dispatches an action to show a modal dialog asking the user to confirm if they want to turn on MetaMask notifications.
 *
 * @returns A thunk action that, when dispatched, shows the confirmation modal.
 */
export function showConfirmTurnOnMetamaskNotifications(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch: MetaMaskReduxDispatch) => {
    dispatch(
      showModal({
        name: 'TURN_ON_METAMASK_NOTIFICATIONS',
      }),
    );
  };
}

/**
 * Enables MetaMask notifications.
 * This function dispatches a request to the background script to enable MetaMask notifications.
 * If the operation fails, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @returns A thunk action that, when dispatched, attempts to enable MetaMask notifications.
 */
export function enableMetamaskNotifications(): ThunkAction<
  void,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('enableMetamaskNotifications');
    } catch (error) {
      log.error(error);
      throw error;
    }
  };
}

/**
 * Disables MetaMask notifications.
 * This function dispatches a request to the background script to disable MetaMask notifications.
 * If the operation fails, it logs the error message and rethrows the error to ensure it is handled appropriately.
 *
 * @returns A thunk action that, when dispatched, attempts to disable MetaMask notifications.
 */
export function disableMetamaskNotifications(): ThunkAction<
  void,
  unknown,
  AnyAction
> {
  return async () => {
    try {
      await submitRequestToBackground('disableMetamaskNotifications');
    } catch (error) {
      log.error(error);
      throw error;
    }
  };
}

export function setIsProfileSyncingEnabled(
  isProfileSyncingEnabled: boolean,
): ThunkAction<void, unknown, unknown, AnyAction> {
  return async (dispatch: MetaMaskReduxDispatch) => {
    try {
      dispatch(showLoadingIndication());
      await submitRequestToBackground('setIsProfileSyncingEnabled', [
        isProfileSyncingEnabled,
      ]);
      dispatch(hideLoadingIndication());
    } catch (error) {
      logErrorWithMessage(error);
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setConfirmationAdvancedDetailsOpen(value: boolean) {
  return setPreference('showConfirmationAdvancedDetails', value);
}

export async function getNextAvailableAccountName(
  keyring?: KeyringTypes,
): Promise<string> {
  return await submitRequestToBackground<string>(
    'getNextAvailableAccountName',
    [keyring],
  );
}

export async function decodeTransactionData({
  transactionData,
  contractAddress,
  chainId,
}: {
  transactionData: Hex;
  contractAddress: Hex;
  chainId: Hex;
}): Promise<DecodedTransactionDataResponse | undefined> {
  return await submitRequestToBackground<string>('decodeTransactionData', [
    {
      transactionData,
      contractAddress,
      chainId,
    },
  ]);
}

export async function multichainUpdateBalance(
  accountId: string,
): Promise<void> {
  return await submitRequestToBackground<void>('multichainUpdateBalance', [
    accountId,
  ]);
}

export async function multichainUpdateBalances(): Promise<void> {
  return await submitRequestToBackground<void>('multichainUpdateBalances', []);
}

export async function getLastInteractedConfirmationInfo(): Promise<
  LastInteractedConfirmationInfo | undefined
> {
  return await submitRequestToBackground<void>(
    'getLastInteractedConfirmationInfo',
  );
}

export async function setLastInteractedConfirmationInfo(
  info: LastInteractedConfirmationInfo,
): Promise<void> {
  return await submitRequestToBackground<void>(
    'setLastInteractedConfirmationInfo',
    [info],
  );
}

export async function endBackgroundTrace(request: EndTraceRequest) {
  // We want to record the timestamp immediately, not after the request reaches the background.
  // Sentry uses the Performance interface for more accuracy, so we also must use it to align with
  // other timings.
  const timestamp =
    request.timestamp || performance.timeOrigin + performance.now();

  await submitRequestToBackground<void>('endTrace', [
    { ...request, timestamp },
  ]);
}
