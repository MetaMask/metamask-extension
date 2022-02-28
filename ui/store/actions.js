import pify from 'pify';
import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { capitalize, isEqual } from 'lodash';
import getBuyUrl from '../../app/scripts/lib/buy-url';
import {
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from '../helpers/utils/i18n-helper';
import { getMethodDataAsync } from '../helpers/utils/transactions.util';
import { isEqualCaseInsensitive } from '../helpers/utils/util';
import switchDirection from '../helpers/utils/switch-direction';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../../shared/constants/app';
import { hasUnconfirmedTransactions } from '../helpers/utils/confirm-tx.util';
import txHelper from '../helpers/utils/tx-helper';
import { getEnvironmentType, addHexPrefix } from '../../app/scripts/lib/util';
import { decimalToHex } from '../helpers/utils/conversions.util';
import {
  getMetaMaskAccounts,
  getPermittedAccountsForCurrentTab,
  getSelectedAddress,
} from '../selectors';
import { computeEstimatedGasLimit, resetSendState } from '../ducks/send';
import { switchedToUnconnectedAccount } from '../ducks/alerts/unconnected-account';
import { getUnconnectedAccountAlertEnabledness } from '../ducks/metamask/metamask';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import {
  DEVICE_NAMES,
  LEDGER_TRANSPORT_TYPES,
  LEDGER_USB_VENDOR_ID,
} from '../../shared/constants/hardware-wallets';
import { parseSmartTransactionsError } from '../pages/swaps/swaps.util';
import * as actionConstants from './actionConstants';

let background = null;
let promisifiedBackground = null;
export function _setBackgroundConnection(backgroundConnection) {
  background = backgroundConnection;
  promisifiedBackground = pify(background);
}

export function goHome() {
  return {
    type: actionConstants.GO_HOME,
  };
}
// async actions

export function tryUnlockMetamask(password) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    dispatch(unlockInProgress());
    log.debug(`background.submitPassword`);

    return new Promise((resolve, reject) => {
      background.submitPassword(password, (error) => {
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

export function createNewVaultAndRestore(password, seed) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.createNewVaultAndRestore`);
    let vault;
    return new Promise((resolve, reject) => {
      background.createNewVaultAndRestore(password, seed, (err, _vault) => {
        if (err) {
          reject(err);
          return;
        }
        vault = _vault;
        resolve();
      });
    })
      .then(() => dispatch(unMarkPasswordForgotten()))
      .then(() => {
        dispatch(showAccountsPage());
        dispatch(hideLoadingIndication());
        return vault;
      })
      .catch((err) => {
        dispatch(displayWarning(err.message));
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}

export function createNewVaultAndGetSeedPhrase(password) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    try {
      await createNewVault(password);
      const seedWords = await verifySeedPhrase();
      return seedWords;
    } catch (error) {
      dispatch(displayWarning(error.message));
      throw new Error(error.message);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function unlockAndGetSeedPhrase(password) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    try {
      await submitPassword(password);
      const seedWords = await verifySeedPhrase();
      await forceUpdateMetamaskState(dispatch);
      return seedWords;
    } catch (error) {
      dispatch(displayWarning(error.message));
      throw new Error(error.message);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function submitPassword(password) {
  return new Promise((resolve, reject) => {
    background.submitPassword(password, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function createNewVault(password) {
  return new Promise((resolve, reject) => {
    background.createNewVaultAndKeychain(password, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(true);
    });
  });
}

export function verifyPassword(password) {
  return new Promise((resolve, reject) => {
    background.verifyPassword(password, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(true);
    });
  });
}

export function verifySeedPhrase() {
  return new Promise((resolve, reject) => {
    background.verifySeedPhrase((error, seedWords) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(seedWords);
    });
  });
}

export function requestRevealSeedWords(password) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.verifyPassword`);

    try {
      await verifyPassword(password);
      const seedWords = await verifySeedPhrase();
      return seedWords;
    } catch (error) {
      dispatch(displayWarning(error.message));
      throw new Error(error.message);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function tryReverseResolveAddress(address) {
  return () => {
    return new Promise((resolve) => {
      background.tryReverseResolveAddress(address, (err) => {
        if (err) {
          log.error(err);
        }
        resolve();
      });
    });
  };
}

export function fetchInfoToSync() {
  return (dispatch) => {
    log.debug(`background.fetchInfoToSync`);
    return new Promise((resolve, reject) => {
      background.fetchInfoToSync((err, result) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  };
}

export function resetAccount() {
  return (dispatch) => {
    dispatch(showLoadingIndication());

    return new Promise((resolve, reject) => {
      background.resetAccount((err, account) => {
        dispatch(hideLoadingIndication());
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }

        log.info(`Transaction history reset for ${account}`);
        dispatch(showAccountsPage());
        resolve(account);
      });
    });
  };
}

export function removeAccount(address) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    try {
      await new Promise((resolve, reject) => {
        background.removeAccount(address, (error, account) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(account);
        });
      });
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      dispatch(displayWarning(error.message));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    log.info(`Account removed: ${address}`);
    dispatch(showAccountsPage());
  };
}

export function importNewAccount(strategy, args) {
  return async (dispatch) => {
    let newState;
    dispatch(
      showLoadingIndication('This may take a while, please be patient.'),
    );
    try {
      log.debug(`background.importAccountWithStrategy`);
      await promisifiedBackground.importAccountWithStrategy(strategy, args);
      log.debug(`background.getState`);
      newState = await promisifiedBackground.getState();
    } catch (err) {
      dispatch(displayWarning(err.message));
      throw err;
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    if (newState.selectedAddress) {
      dispatch({
        type: actionConstants.SHOW_ACCOUNT_DETAIL,
        value: newState.selectedAddress,
      });
    }
    return newState;
  };
}

export function addNewAccount() {
  log.debug(`background.addNewAccount`);
  return async (dispatch, getState) => {
    const oldIdentities = getState().metamask.identities;
    dispatch(showLoadingIndication());

    let newIdentities;
    try {
      const { identities } = await promisifiedBackground.addNewAccount();
      newIdentities = identities;
    } catch (error) {
      dispatch(displayWarning(error.message));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    const newAccountAddress = Object.keys(newIdentities).find(
      (address) => !oldIdentities[address],
    );
    await forceUpdateMetamaskState(dispatch);
    return newAccountAddress;
  };
}

export function checkHardwareStatus(deviceName, hdPath) {
  log.debug(`background.checkHardwareStatus`, deviceName, hdPath);
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    let unlocked;
    try {
      unlocked = await promisifiedBackground.checkHardwareStatus(
        deviceName,
        hdPath,
      );
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    await forceUpdateMetamaskState(dispatch);
    return unlocked;
  };
}

export function forgetDevice(deviceName) {
  log.debug(`background.forgetDevice`, deviceName);
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    try {
      await promisifiedBackground.forgetDevice(deviceName);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
      throw error;
    } finally {
      dispatch(hideLoadingIndication());
    }

    await forceUpdateMetamaskState(dispatch);
  };
}

export function connectHardware(deviceName, page, hdPath, t) {
  log.debug(`background.connectHardware`, deviceName, page, hdPath);
  return async (dispatch, getState) => {
    const { ledgerTransportType } = getState().metamask;

    dispatch(
      showLoadingIndication(`Looking for your ${capitalize(deviceName)}...`),
    );

    let accounts;
    try {
      if (deviceName === DEVICE_NAMES.LEDGER) {
        await promisifiedBackground.establishLedgerTransportPreference();
      }
      if (
        deviceName === DEVICE_NAMES.LEDGER &&
        ledgerTransportType === LEDGER_TRANSPORT_TYPES.WEBHID
      ) {
        const connectedDevices = await window.navigator.hid.requestDevice({
          filters: [{ vendorId: LEDGER_USB_VENDOR_ID }],
        });
        const userApprovedWebHidConnection = connectedDevices.some(
          (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
        );
        if (!userApprovedWebHidConnection) {
          throw new Error(t('ledgerWebHIDNotConnectedErrorMessage'));
        }
      }

      accounts = await promisifiedBackground.connectHardware(
        deviceName,
        page,
        hdPath,
      );
    } catch (error) {
      log.error(error);
      if (
        deviceName === DEVICE_NAMES.LEDGER &&
        ledgerTransportType === LEDGER_TRANSPORT_TYPES.WEBHID &&
        error.message.match('Failed to open the device')
      ) {
        dispatch(displayWarning(t('ledgerDeviceOpenFailureMessage')));
        throw new Error(t('ledgerDeviceOpenFailureMessage'));
      } else {
        if (deviceName !== DEVICE_NAMES.QR) {
          dispatch(displayWarning(error.message));
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
  indexes,
  deviceName,
  hdPath,
  hdPathDescription,
) {
  log.debug(
    `background.unlockHardwareWalletAccount`,
    indexes,
    deviceName,
    hdPath,
    hdPathDescription,
  );
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    for (const index of indexes) {
      try {
        await promisifiedBackground.unlockHardwareWalletAccount(
          index,
          deviceName,
          hdPath,
          hdPathDescription,
        );
      } catch (e) {
        log.error(e);
        dispatch(displayWarning(e.message));
        dispatch(hideLoadingIndication());
        throw e;
      }
    }

    dispatch(hideLoadingIndication());
    return undefined;
  };
}

export function showQrScanner() {
  return (dispatch) => {
    dispatch(
      showModal({
        name: 'QR_SCANNER',
      }),
    );
  };
}

export function setCurrentCurrency(currencyCode) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setCurrentCurrency`);
    try {
      await promisifiedBackground.setCurrentCurrency(currencyCode);
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function signMsg(msgData) {
  log.debug('action - signMsg');
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.signMessage`);
    let newState;
    try {
      newState = await promisifiedBackground.signMessage(msgData);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
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

export function signPersonalMsg(msgData) {
  log.debug('action - signPersonalMsg');
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.signPersonalMessage`);

    let newState;
    try {
      newState = await promisifiedBackground.signPersonalMessage(msgData);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
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

export function decryptMsgInline(decryptedMsgData) {
  log.debug('action - decryptMsgInline');
  return async (dispatch) => {
    log.debug(`actions calling background.decryptMessageInline`);

    let newState;
    try {
      newState = await promisifiedBackground.decryptMessageInline(
        decryptedMsgData,
      );
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
      throw error;
    }

    dispatch(updateMetamaskState(newState));
    return newState.unapprovedDecryptMsgs[decryptedMsgData.metamaskId];
  };
}

export function decryptMsg(decryptedMsgData) {
  log.debug('action - decryptMsg');
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.decryptMessage`);

    let newState;
    try {
      newState = await promisifiedBackground.decryptMessage(decryptedMsgData);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
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

export function encryptionPublicKeyMsg(msgData) {
  log.debug('action - encryptionPublicKeyMsg');
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.encryptionPublicKey`);

    let newState;
    try {
      newState = await promisifiedBackground.encryptionPublicKey(msgData);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
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

export function signTypedMsg(msgData) {
  log.debug('action - signTypedMsg');
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`actions calling background.signTypedMessage`);

    let newState;
    try {
      newState = await promisifiedBackground.signTypedMessage(msgData);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
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

export function updateCustomNonce(value) {
  return {
    type: actionConstants.UPDATE_CUSTOM_NONCE,
    value,
  };
}

const updateMetamaskStateFromBackground = () => {
  log.debug(`background.getState`);

  return new Promise((resolve, reject) => {
    background.getState((error, newState) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(newState);
    });
  });
};

export function updateTransaction(txData, dontShowLoadingIndicator) {
  return async (dispatch) => {
    !dontShowLoadingIndicator && dispatch(showLoadingIndication());

    try {
      await promisifiedBackground.updateTransaction(txData);
    } catch (error) {
      dispatch(updateTransactionParams(txData.id, txData.txParams));
      dispatch(hideLoadingIndication());
      dispatch(txError(error));
      dispatch(goHome());
      log.error(error.message);
      throw error;
    }

    try {
      dispatch(updateTransactionParams(txData.id, txData.txParams));
      const newState = await updateMetamaskStateFromBackground();
      dispatch(updateMetamaskState(newState));
      dispatch(showConfTxPage({ id: txData.id }));
      return txData;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function addUnapprovedTransaction(txParams, origin, type) {
  log.debug('background.addUnapprovedTransaction');

  return () => {
    return new Promise((resolve, reject) => {
      background.addUnapprovedTransaction(
        txParams,
        origin,
        type,
        (err, txMeta) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(txMeta);
        },
      );
    });
  };
}

export function updateAndApproveTx(txData, dontShowLoadingIndicator) {
  return (dispatch) => {
    !dontShowLoadingIndicator && dispatch(showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.updateAndApproveTransaction(txData, (err) => {
        dispatch(updateTransactionParams(txData.id, txData.txParams));
        dispatch(resetSendState());

        if (err) {
          dispatch(txError(err));
          dispatch(goHome());
          log.error(err.message);
          reject(err);
          return;
        }

        resolve(txData);
      });
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        dispatch(resetSendState());
        dispatch(completedTx(txData.id));
        dispatch(hideLoadingIndication());
        dispatch(updateCustomNonce(''));
        dispatch(closeCurrentNotificationWindow());

        return txData;
      })
      .catch((err) => {
        dispatch(hideLoadingIndication());
        return Promise.reject(err);
      });
  };
}

export async function getTransactions(filters = {}) {
  return await promisifiedBackground.getTransactions(filters);
}

export function completedTx(id) {
  return (dispatch, getState) => {
    const state = getState();
    const {
      unapprovedTxs,
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedTypedMessages,
      network,
      provider: { chainId },
    } = state.metamask;
    const unconfirmedActions = txHelper(
      unapprovedTxs,
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedTypedMessages,
      network,
      chainId,
    );
    const otherUnconfirmedActions = unconfirmedActions.filter(
      (tx) => tx.id !== id,
    );
    dispatch({
      type: actionConstants.COMPLETED_TX,
      value: {
        id,
        unconfirmedActionsCount: otherUnconfirmedActions.length,
      },
    });
  };
}

export function updateTransactionParams(id, txParams) {
  return {
    type: actionConstants.UPDATE_TRANSACTION_PARAMS,
    id,
    value: txParams,
  };
}

export function txError(err) {
  return {
    type: actionConstants.TRANSACTION_ERROR,
    message: err.message,
  };
}

///: BEGIN:ONLY_INCLUDE_IN(flask)
export function disableSnap(snapId) {
  return async (dispatch) => {
    await promisifiedBackground.disableSnap(snapId);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function enableSnap(snapId) {
  return async (dispatch) => {
    await promisifiedBackground.enableSnap(snapId);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function removeSnap(snap) {
  return async (dispatch) => {
    await promisifiedBackground.removeSnap(snap);
    await forceUpdateMetamaskState(dispatch);
  };
}

export async function removeSnapError(msgData) {
  return promisifiedBackground.removeSnapError(msgData);
}
///: END:ONLY_INCLUDE_IN

export function cancelMsg(msgData) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await promisifiedBackground.cancelMessage(msgData.id);
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelPersonalMsg(msgData) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await promisifiedBackground.cancelPersonalMessage(msgData.id);
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelDecryptMsg(msgData) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await promisifiedBackground.cancelDecryptMessage(msgData.id);
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelEncryptionPublicKeyMsg(msgData) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await promisifiedBackground.cancelEncryptionPublicKey(
        msgData.id,
      );
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelTypedMsg(msgData) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    let newState;
    try {
      newState = await promisifiedBackground.cancelTypedMessage(msgData.id);
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch(updateMetamaskState(newState));
    dispatch(completedTx(msgData.id));
    dispatch(closeCurrentNotificationWindow());
    return msgData;
  };
}

export function cancelTx(txData, _showLoadingIndication = true) {
  return (dispatch) => {
    _showLoadingIndication && dispatch(showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.cancelTransaction(txData.id, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    })
      .then(() => updateMetamaskStateFromBackground())
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => {
        dispatch(resetSendState());
        dispatch(completedTx(txData.id));
        dispatch(hideLoadingIndication());
        dispatch(closeCurrentNotificationWindow());

        return txData;
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
 * @param {Array<object>} txDataList - a list of tx data objects
 * @returns {function(*): Promise<void>}
 */
export function cancelTxs(txDataList) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    try {
      const txIds = txDataList.map(({ id }) => id);
      const cancellations = txIds.map(
        (id) =>
          new Promise((resolve, reject) => {
            background.cancelTransaction(id, (err) => {
              if (err) {
                reject(err);
                return;
              }

              resolve();
            });
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

export function markPasswordForgotten() {
  return async (dispatch) => {
    try {
      await new Promise((resolve, reject) => {
        return background.markPasswordForgotten((error) => {
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
      dispatch(forgotPassword());
      await forceUpdateMetamaskState(dispatch);
    }
  };
}

export function unMarkPasswordForgotten() {
  return (dispatch) => {
    return new Promise((resolve) => {
      background.unMarkPasswordForgotten(() => {
        dispatch(forgotPassword(false));
        resolve();
      });
    }).then(() => forceUpdateMetamaskState(dispatch));
  };
}

export function forgotPassword(forgotPasswordState = true) {
  return {
    type: actionConstants.FORGOT_PASSWORD,
    value: forgotPasswordState,
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

export function unlockFailed(message) {
  return {
    type: actionConstants.UNLOCK_FAILED,
    value: message,
  };
}

export function unlockSucceeded(message) {
  return {
    type: actionConstants.UNLOCK_SUCCEEDED,
    value: message,
  };
}

export function updateMetamaskState(newState) {
  return (dispatch, getState) => {
    const { metamask: currentState } = getState();

    const { currentLocale, selectedAddress, provider } = currentState;
    const {
      currentLocale: newLocale,
      selectedAddress: newSelectedAddress,
      provider: newProvider,
    } = newState;

    if (currentLocale && newLocale && currentLocale !== newLocale) {
      dispatch(updateCurrentLocale(newLocale));
    }

    if (selectedAddress !== newSelectedAddress) {
      dispatch({ type: actionConstants.SELECTED_ADDRESS_CHANGED });
    }

    const newAddressBook = newState.addressBook?.[newProvider?.chainId] ?? {};
    const oldAddressBook = currentState.addressBook?.[provider?.chainId] ?? {};
    const newAccounts = getMetaMaskAccounts({ metamask: newState });
    const oldAccounts = getMetaMaskAccounts({ metamask: currentState });
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
    if (provider.chainId !== newProvider.chainId) {
      dispatch({
        type: actionConstants.CHAIN_CHANGED,
        payload: newProvider.chainId,
      });
    }
    dispatch({
      type: actionConstants.UPDATE_METAMASK_STATE,
      value: newState,
    });
  };
}

const backgroundSetLocked = () => {
  return new Promise((resolve, reject) => {
    background.setLocked((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

export function lockMetamask() {
  log.debug(`background.setLocked`);

  return (dispatch) => {
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

async function _setSelectedAddress(address) {
  log.debug(`background.setSelectedAddress`);
  await promisifiedBackground.setSelectedAddress(address);
}

export function setSelectedAddress(address) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setSelectedAddress`);
    try {
      await _setSelectedAddress(address);
    } catch (error) {
      dispatch(displayWarning(error.message));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function showAccountDetail(address) {
  return async (dispatch, getState) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setSelectedAddress`);

    const state = getState();
    const unconnectedAccountAccountAlertIsEnabled = getUnconnectedAccountAlertEnabledness(
      state,
    );
    const activeTabOrigin = state.activeTab.origin;
    const selectedAddress = getSelectedAddress(state);
    const permittedAccountsForCurrentTab = getPermittedAccountsForCurrentTab(
      state,
    );
    const currentTabIsConnectedToPreviousAddress =
      Boolean(activeTabOrigin) &&
      permittedAccountsForCurrentTab.includes(selectedAddress);
    const currentTabIsConnectedToNextAddress =
      Boolean(activeTabOrigin) &&
      permittedAccountsForCurrentTab.includes(address);
    const switchingToUnconnectedAddress =
      currentTabIsConnectedToPreviousAddress &&
      !currentTabIsConnectedToNextAddress;

    try {
      await _setSelectedAddress(address);
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      dispatch(displayWarning(error.message));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }

    dispatch({
      type: actionConstants.SHOW_ACCOUNT_DETAIL,
      value: address,
    });
    if (
      unconnectedAccountAccountAlertIsEnabled &&
      switchingToUnconnectedAddress
    ) {
      dispatch(switchedToUnconnectedAccount());
      await setUnconnectedAccountAlertShown(activeTabOrigin);
    }
  };
}

export function addPermittedAccount(origin, address) {
  return async (dispatch) => {
    await new Promise((resolve, reject) => {
      background.addPermittedAccount(origin, address, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await forceUpdateMetamaskState(dispatch);
  };
}

export function removePermittedAccount(origin, address) {
  return async (dispatch) => {
    await new Promise((resolve, reject) => {
      background.removePermittedAccount(origin, address, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await forceUpdateMetamaskState(dispatch);
  };
}

export function showAccountsPage() {
  return {
    type: actionConstants.SHOW_ACCOUNTS_PAGE,
  };
}

export function showConfTxPage({ id } = {}) {
  return {
    type: actionConstants.SHOW_CONF_TX_PAGE,
    id,
  };
}

export function addToken(
  address,
  symbol,
  decimals,
  image,
  dontShowLoadingIndicator,
) {
  return async (dispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot add token without address');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await promisifiedBackground.addToken(address, symbol, decimals, image);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function addCollectible(address, tokenID, dontShowLoadingIndicator) {
  return async (dispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot add collectible without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot add collectible without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await promisifiedBackground.addCollectible(address, tokenID);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function addCollectibleVerifyOwnership(
  address,
  tokenID,
  dontShowLoadingIndicator,
) {
  return async (dispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot add collectible without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot add collectible without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await promisifiedBackground.addCollectibleVerifyOwnership(
        address,
        tokenID,
      );
    } catch (error) {
      if (
        error.message.includes('This collectible is not owned by the user') ||
        error.message.includes('Unable to verify ownership.')
      ) {
        throw error;
      } else {
        log.error(error);
        dispatch(displayWarning(error.message));
      }
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function removeAndIgnoreCollectible(
  address,
  tokenID,
  dontShowLoadingIndicator,
) {
  return async (dispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot ignore collectible without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot ignore collectible without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await promisifiedBackground.removeAndIgnoreCollectible(address, tokenID);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function removeCollectible(address, tokenID, dontShowLoadingIndicator) {
  return async (dispatch) => {
    if (!address) {
      throw new Error('MetaMask - Cannot remove collectible without address');
    }
    if (!tokenID) {
      throw new Error('MetaMask - Cannot remove collectible without tokenID');
    }
    if (!dontShowLoadingIndicator) {
      dispatch(showLoadingIndication());
    }
    try {
      await promisifiedBackground.removeCollectible(address, tokenID);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export async function checkAndUpdateAllCollectiblesOwnershipStatus() {
  await promisifiedBackground.checkAndUpdateAllCollectiblesOwnershipStatus();
}

export async function isCollectibleOwner(
  ownerAddress,
  collectibleAddress,
  collectibleId,
) {
  return await promisifiedBackground.isCollectibleOwner(
    ownerAddress,
    collectibleAddress,
    collectibleId,
  );
}

export async function checkAndUpdateSingleCollectibleOwnershipStatus(
  collectible,
) {
  await promisifiedBackground.checkAndUpdateSingleCollectibleOwnershipStatus(
    collectible,
    false,
  );
}

export async function getTokenStandardAndDetails(
  address,
  userAddress,
  tokenId,
) {
  return await promisifiedBackground.getTokenStandardAndDetails(
    address,
    userAddress,
    tokenId,
  );
}

export function removeToken(address) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    try {
      await promisifiedBackground.removeToken(address);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
    } finally {
      await forceUpdateMetamaskState(dispatch);
      dispatch(hideLoadingIndication());
    }
  };
}

export function addTokens(tokens) {
  return (dispatch) => {
    if (Array.isArray(tokens)) {
      return Promise.all(
        tokens.map(({ address, symbol, decimals }) =>
          dispatch(addToken(address, symbol, decimals)),
        ),
      );
    }
    return Promise.all(
      Object.entries(tokens).map(([_, { address, symbol, decimals }]) =>
        dispatch(addToken(address, symbol, decimals)),
      ),
    );
  };
}

export function rejectWatchAsset(suggestedAssetID) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    try {
      await promisifiedBackground.rejectWatchAsset(suggestedAssetID);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
    dispatch(closeCurrentNotificationWindow());
  };
}

export function acceptWatchAsset(suggestedAssetID) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    try {
      await promisifiedBackground.acceptWatchAsset(suggestedAssetID);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning(error.message));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
    dispatch(closeCurrentNotificationWindow());
  };
}

export function clearPendingTokens() {
  return {
    type: actionConstants.CLEAR_PENDING_TOKENS,
  };
}

export function createCancelTransaction(
  txId,
  customGasSettings,
  newTxMetaProps,
) {
  log.debug('background.cancelTransaction');
  let newTxId;

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.createCancelTransaction(
        txId,
        customGasSettings,
        newTxMetaProps,
        (err, newState) => {
          if (err) {
            dispatch(displayWarning(err.message));
            reject(err);
            return;
          }

          const { currentNetworkTxList } = newState;
          const { id } = currentNetworkTxList[currentNetworkTxList.length - 1];
          newTxId = id;
          resolve(newState);
        },
      );
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTxId);
  };
}

export function createSpeedUpTransaction(
  txId,
  customGasSettings,
  newTxMetaProps,
) {
  log.debug('background.createSpeedUpTransaction');
  let newTx;

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.createSpeedUpTransaction(
        txId,
        customGasSettings,
        newTxMetaProps,
        (err, newState) => {
          if (err) {
            dispatch(displayWarning(err.message));
            reject(err);
            return;
          }

          const { currentNetworkTxList } = newState;
          newTx = currentNetworkTxList[currentNetworkTxList.length - 1];
          resolve(newState);
        },
      );
    })
      .then((newState) => dispatch(updateMetamaskState(newState)))
      .then(() => newTx);
  };
}

export function createRetryTransaction(txId, customGasSettings) {
  let newTx;

  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.createSpeedUpTransaction(
        txId,
        customGasSettings,
        (err, newState) => {
          if (err) {
            dispatch(displayWarning(err.message));
            reject(err);
            return;
          }

          const { currentNetworkTxList } = newState;
          newTx = currentNetworkTxList[currentNetworkTxList.length - 1];
          resolve(newState);
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

export function setProviderType(type) {
  return async (dispatch) => {
    log.debug(`background.setProviderType`, type);

    try {
      await promisifiedBackground.setProviderType(type);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem changing networks!'));
      return;
    }
    dispatch(updateProviderType(type));
  };
}

export function updateProviderType(type) {
  return {
    type: actionConstants.SET_PROVIDER_TYPE,
    value: type,
  };
}

export function updateAndSetCustomRpc(
  newRpc,
  chainId,
  ticker = 'ETH',
  nickname,
  rpcPrefs,
) {
  return async (dispatch) => {
    log.debug(
      `background.updateAndSetCustomRpc: ${newRpc} ${chainId} ${ticker} ${nickname}`,
    );

    try {
      await promisifiedBackground.updateAndSetCustomRpc(
        newRpc,
        chainId,
        ticker,
        nickname || newRpc,
        rpcPrefs,
      );
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem changing networks!'));
      return;
    }

    dispatch({
      type: actionConstants.SET_RPC_TARGET,
      value: newRpc,
    });
  };
}

export function editRpc(
  oldRpc,
  newRpc,
  chainId,
  ticker = 'ETH',
  nickname,
  rpcPrefs,
) {
  return async (dispatch) => {
    log.debug(`background.delRpcTarget: ${oldRpc}`);
    try {
      promisifiedBackground.delCustomRpc(oldRpc);
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem removing network!'));
      return;
    }

    try {
      await promisifiedBackground.updateAndSetCustomRpc(
        newRpc,
        chainId,
        ticker,
        nickname || newRpc,
        rpcPrefs,
      );
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem changing networks!'));
      return;
    }

    dispatch({
      type: actionConstants.SET_RPC_TARGET,
      value: newRpc,
    });
  };
}

export function setRpcTarget(newRpc, chainId, ticker = 'ETH', nickname) {
  return async (dispatch) => {
    log.debug(
      `background.setRpcTarget: ${newRpc} ${chainId} ${ticker} ${nickname}`,
    );

    try {
      await promisifiedBackground.setCustomRpc(
        newRpc,
        chainId,
        ticker,
        nickname || newRpc,
      );
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem changing networks!'));
    }
  };
}

export function rollbackToPreviousProvider() {
  return async (dispatch) => {
    try {
      await promisifiedBackground.rollbackToPreviousProvider();
    } catch (error) {
      log.error(error);
      dispatch(displayWarning('Had a problem changing networks!'));
    }
  };
}

export function delRpcTarget(oldRpc) {
  return (dispatch) => {
    log.debug(`background.delRpcTarget: ${oldRpc}`);
    return new Promise((resolve, reject) => {
      background.delCustomRpc(oldRpc, (err) => {
        if (err) {
          log.error(err);
          dispatch(displayWarning('Had a problem removing network!'));
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}

// Calls the addressBookController to add a new address.
export function addToAddressBook(recipient, nickname = '', memo = '') {
  log.debug(`background.addToAddressBook`);

  return async (dispatch, getState) => {
    const { chainId } = getState().metamask.provider;

    let set;
    try {
      set = await promisifiedBackground.setAddressBook(
        toChecksumHexAddress(recipient),
        nickname,
        chainId,
        memo,
      );
    } catch (error) {
      log.error(error);
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
 * @param {string} addressToRemove - Address of the entry to remove from the address book
 */
export function removeFromAddressBook(chainId, addressToRemove) {
  log.debug(`background.removeFromAddressBook`);

  return async () => {
    await promisifiedBackground.removeFromAddressBook(
      chainId,
      toChecksumHexAddress(addressToRemove),
    );
  };
}

export function showNetworkDropdown() {
  return {
    type: actionConstants.NETWORK_DROPDOWN_OPEN,
  };
}

export function hideNetworkDropdown() {
  return {
    type: actionConstants.NETWORK_DROPDOWN_CLOSE,
  };
}

export function showModal(payload) {
  return {
    type: actionConstants.MODAL_OPEN,
    payload,
  };
}

export function hideModal(payload) {
  return {
    type: actionConstants.MODAL_CLOSE,
    payload,
  };
}

export function closeCurrentNotificationWindow() {
  return (_, getState) => {
    if (
      getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION &&
      !hasUnconfirmedTransactions(getState())
    ) {
      closeNotificationPopup();
    }
  };
}

export function showAlert(msg) {
  return {
    type: actionConstants.ALERT_OPEN,
    value: msg,
  };
}

export function hideAlert() {
  return {
    type: actionConstants.ALERT_CLOSE,
  };
}

export function updateCollectibleDropDownState(value) {
  return async (dispatch) => {
    await promisifiedBackground.updateCollectibleDropDownState(value);
    await forceUpdateMetamaskState(dispatch);
  };
}

/**
 * This action will receive two types of values via qrCodeData
 * an object with the following structure {type, values}
 * or null (used to clear the previous value)
 *
 * @param qrCodeData
 */
export function qrCodeDetected(qrCodeData) {
  return async (dispatch) => {
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

export function showLoadingIndication(message) {
  return {
    type: actionConstants.SHOW_LOADING,
    value: message,
  };
}

export function setHardwareWalletDefaultHdPath({ device, path }) {
  return {
    type: actionConstants.SET_HARDWARE_WALLET_DEFAULT_HD_PATH,
    value: { device, path },
  };
}

export function hideLoadingIndication() {
  return {
    type: actionConstants.HIDE_LOADING,
  };
}

export function displayWarning(text) {
  return {
    type: actionConstants.DISPLAY_WARNING,
    value: text,
  };
}

export function hideWarning() {
  return {
    type: actionConstants.HIDE_WARNING,
  };
}

export function exportAccount(password, address) {
  return function (dispatch) {
    dispatch(showLoadingIndication());

    log.debug(`background.verifyPassword`);
    return new Promise((resolve, reject) => {
      background.verifyPassword(password, function (err) {
        if (err) {
          log.error('Error in verifying password.');
          dispatch(hideLoadingIndication());
          dispatch(displayWarning('Incorrect Password.'));
          reject(err);
          return;
        }
        log.debug(`background.exportAccount`);
        background.exportAccount(address, function (err2, result) {
          dispatch(hideLoadingIndication());

          if (err2) {
            log.error(err2);
            dispatch(displayWarning('Had a problem exporting the account.'));
            reject(err2);
            return;
          }

          dispatch(showPrivateKey(result));
          resolve(result);
        });
      });
    });
  };
}

export function exportAccounts(password, addresses) {
  return function (dispatch) {
    log.debug(`background.verifyPassword`);
    return new Promise((resolve, reject) => {
      background.verifyPassword(password, function (err) {
        if (err) {
          log.error('Error in submitting password.');
          reject(err);
          return;
        }
        log.debug(`background.exportAccounts`);
        const accountPromises = addresses.map(
          (address) =>
            new Promise((resolve2, reject2) =>
              background.exportAccount(address, function (err2, result) {
                if (err2) {
                  log.error(err2);
                  dispatch(
                    displayWarning('Had a problem exporting the account.'),
                  );
                  reject2(err2);
                  return;
                }
                resolve2(result);
              }),
            ),
        );
        resolve(Promise.all(accountPromises));
      });
    });
  };
}

export function showPrivateKey(key) {
  return {
    type: actionConstants.SHOW_PRIVATE_KEY,
    value: key,
  };
}

export function setAccountLabel(account, label) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setAccountLabel`);

    return new Promise((resolve, reject) => {
      background.setAccountLabel(account, label, (err) => {
        dispatch(hideLoadingIndication());

        if (err) {
          dispatch(displayWarning(err.message));
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

export function clearAccountDetails() {
  return {
    type: actionConstants.CLEAR_ACCOUNT_DETAILS,
  };
}

export function showSendTokenPage() {
  return {
    type: actionConstants.SHOW_SEND_TOKEN_PAGE,
  };
}

export function buyEth(opts) {
  return async (dispatch) => {
    const url = await getBuyUrl(opts);
    global.platform.openTab({ url });
    dispatch({
      type: actionConstants.BUY_ETH,
    });
  };
}

export function setFeatureFlag(feature, activated, notificationType) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.setFeatureFlag(
        feature,
        activated,
        (err, updatedFeatureFlags) => {
          dispatch(hideLoadingIndication());
          if (err) {
            dispatch(displayWarning(err.message));
            reject(err);
            return;
          }
          dispatch(updateFeatureFlags(updatedFeatureFlags));
          notificationType && dispatch(showModal({ name: notificationType }));
          resolve(updatedFeatureFlags);
        },
      );
    });
  };
}

export function updateFeatureFlags(updatedFeatureFlags) {
  return {
    type: actionConstants.UPDATE_FEATURE_FLAGS,
    value: updatedFeatureFlags,
  };
}

export function setPreference(preference, value) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    return new Promise((resolve, reject) => {
      background.setPreference(preference, value, (err, updatedPreferences) => {
        dispatch(hideLoadingIndication());

        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }

        dispatch(updatePreferences(updatedPreferences));
        resolve(updatedPreferences);
      });
    });
  };
}

export function updatePreferences(value) {
  return {
    type: actionConstants.UPDATE_PREFERENCES,
    value,
  };
}

export function setDefaultHomeActiveTabName(value) {
  return async (dispatch) => {
    await promisifiedBackground.setDefaultHomeActiveTabName(value);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setUseNativeCurrencyAsPrimaryCurrencyPreference(value) {
  return setPreference('useNativeCurrencyAsPrimaryCurrency', value);
}

export function setHideZeroBalanceTokens(value) {
  return setPreference('hideZeroBalanceTokens', value);
}

export function setShowFiatConversionOnTestnetsPreference(value) {
  return setPreference('showFiatInTestnets', value);
}

export function setShowTestNetworks(value) {
  return setPreference('showTestNetworks', value);
}

export function setAutoLockTimeLimit(value) {
  return setPreference('autoLockTimeLimit', value);
}

export function setCompletedOnboarding() {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    try {
      await promisifiedBackground.completeOnboarding();
      dispatch(completeOnboarding());
    } catch (err) {
      dispatch(displayWarning(err.message));
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

export function setMouseUserState(isMouseUser) {
  return {
    type: actionConstants.SET_MOUSE_USER_STATE,
    value: isMouseUser,
  };
}

export async function forceUpdateMetamaskState(dispatch) {
  log.debug(`background.getState`);

  let newState;
  try {
    newState = await promisifiedBackground.getState();
  } catch (error) {
    dispatch(displayWarning(error.message));
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

export function setParticipateInMetaMetrics(val) {
  return (dispatch) => {
    log.debug(`background.setParticipateInMetaMetrics`);
    return new Promise((resolve, reject) => {
      background.setParticipateInMetaMetrics(val, (err, metaMetricsId) => {
        log.debug(err);
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }

        dispatch({
          type: actionConstants.SET_PARTICIPATE_IN_METAMETRICS,
          value: val,
        });
        resolve([val, metaMetricsId]);
      });
    });
  };
}

export function setUseBlockie(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseBlockie`);
    background.setUseBlockie(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
    dispatch({
      type: actionConstants.SET_USE_BLOCKIE,
      value: val,
    });
  };
}

export function setUseNonceField(val) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseNonceField`);
    try {
      await promisifiedBackground.setUseNonceField(val);
    } catch (error) {
      dispatch(displayWarning(error.message));
    }
    dispatch(hideLoadingIndication());
    dispatch({
      type: actionConstants.SET_USE_NONCEFIELD,
      value: val,
    });
  };
}

export function setUsePhishDetect(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUsePhishDetect`);
    background.setUsePhishDetect(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

export function setUseTokenDetection(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseTokenDetection`);
    background.setUseTokenDetection(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

export function setUseCollectibleDetection(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setUseCollectibleDetection`);
    background.setUseCollectibleDetection(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

export function setOpenSeaEnabled(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setOpenSeaEnabled`);
    background.setOpenSeaEnabled(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

export function detectCollectibles() {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.detectCollectibles`);
    await promisifiedBackground.detectCollectibles();
    dispatch(hideLoadingIndication());
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setAdvancedGasFee(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setAdvancedGasFee`);
    background.setAdvancedGasFee(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

export function setEIP1559V2Enabled(val) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setEIP1559V2Enabled`);
    try {
      await promisifiedBackground.setEIP1559V2Enabled(val);
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setIpfsGateway(val) {
  return (dispatch) => {
    dispatch(showLoadingIndication());
    log.debug(`background.setIpfsGateway`);
    background.setIpfsGateway(val, (err) => {
      dispatch(hideLoadingIndication());
      if (err) {
        dispatch(displayWarning(err.message));
      } else {
        dispatch({
          type: actionConstants.SET_IPFS_GATEWAY,
          value: val,
        });
      }
    });
  };
}

export function updateCurrentLocale(key) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());

    try {
      await loadRelativeTimeFormatLocaleData(key);
      const localeMessages = await fetchLocale(key);
      const textDirection = await promisifiedBackground.setCurrentLocale(key);
      await switchDirection(textDirection);
      dispatch(setCurrentLocale(key, localeMessages));
    } catch (error) {
      dispatch(displayWarning(error.message));
      return;
    } finally {
      dispatch(hideLoadingIndication());
    }
  };
}

export function setCurrentLocale(locale, messages) {
  return {
    type: actionConstants.SET_CURRENT_LOCALE,
    value: {
      locale,
      messages,
    },
  };
}

export function setPendingTokens(pendingTokens) {
  const {
    customToken = {},
    selectedTokens = {},
    tokenAddressList = [],
  } = pendingTokens;
  const { address, symbol, decimals } = customToken;
  const tokens =
    address && symbol && decimals >= 0 <= 36
      ? {
          ...selectedTokens,
          [address]: {
            ...customToken,
            isCustom: true,
          },
        }
      : selectedTokens;

  Object.keys(tokens).forEach((tokenAddress) => {
    tokens[tokenAddress].unlisted = !tokenAddressList.find((addr) =>
      isEqualCaseInsensitive(addr, tokenAddress),
    );
  });

  return {
    type: actionConstants.SET_PENDING_TOKENS,
    payload: tokens,
  };
}

// Swaps

export function setSwapsLiveness(swapsLiveness) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsLiveness(swapsLiveness);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsFeatureFlags(featureFlags) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsFeatureFlags(featureFlags);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function fetchAndSetQuotes(fetchParams, fetchParamsMetaData) {
  return async (dispatch) => {
    const [
      quotes,
      selectedAggId,
    ] = await promisifiedBackground.fetchAndSetQuotes(
      fetchParams,
      fetchParamsMetaData,
    );
    await forceUpdateMetamaskState(dispatch);
    return [quotes, selectedAggId];
  };
}

export function setSelectedQuoteAggId(aggId) {
  return async (dispatch) => {
    await promisifiedBackground.setSelectedQuoteAggId(aggId);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsTokens(tokens) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsTokens(tokens);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function clearSwapsQuotes() {
  return async (dispatch) => {
    await promisifiedBackground.clearSwapsQuotes();
    await forceUpdateMetamaskState(dispatch);
  };
}

export function resetBackgroundSwapsState() {
  return async (dispatch) => {
    const id = await promisifiedBackground.resetSwapsState();
    await forceUpdateMetamaskState(dispatch);
    return id;
  };
}

export function setCustomApproveTxData(data) {
  return async (dispatch) => {
    await promisifiedBackground.setCustomApproveTxData(data);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsTxGasPrice(gasPrice) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsTxGasPrice(gasPrice);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsTxGasLimit(gasLimit) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsTxGasLimit(gasLimit, true);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function updateCustomSwapsEIP1559GasParams({
  gasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas,
}) {
  return async (dispatch) => {
    await Promise.all([
      promisifiedBackground.setSwapsTxGasLimit(gasLimit),
      promisifiedBackground.setSwapsTxMaxFeePerGas(maxFeePerGas),
      promisifiedBackground.setSwapsTxMaxFeePriorityPerGas(
        maxPriorityFeePerGas,
      ),
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function updateSwapsUserFeeLevel(swapsCustomUserFeeLevel) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsUserFeeLevel(swapsCustomUserFeeLevel);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsQuotesPollingLimitEnabled(quotesPollingLimitEnabled) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsQuotesPollingLimitEnabled(
      quotesPollingLimitEnabled,
    );
    await forceUpdateMetamaskState(dispatch);
  };
}

export function customSwapsGasParamsUpdated(gasLimit, gasPrice) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsTxGasPrice(gasPrice);
    await promisifiedBackground.setSwapsTxGasLimit(gasLimit, true);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setTradeTxId(tradeTxId) {
  return async (dispatch) => {
    await promisifiedBackground.setTradeTxId(tradeTxId);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setApproveTxId(approveTxId) {
  return async (dispatch) => {
    await promisifiedBackground.setApproveTxId(approveTxId);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function safeRefetchQuotes() {
  return async (dispatch) => {
    await promisifiedBackground.safeRefetchQuotes();
    await forceUpdateMetamaskState(dispatch);
  };
}

export function stopPollingForQuotes() {
  return async (dispatch) => {
    await promisifiedBackground.stopPollingForQuotes();
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setBackgroundSwapRouteState(routeState) {
  return async (dispatch) => {
    await promisifiedBackground.setBackgroundSwapRouteState(routeState);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function resetSwapsPostFetchState() {
  return async (dispatch) => {
    await promisifiedBackground.resetPostFetchState();
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setSwapsErrorKey(errorKey) {
  return async (dispatch) => {
    await promisifiedBackground.setSwapsErrorKey(errorKey);
    await forceUpdateMetamaskState(dispatch);
  };
}

export function setInitialGasEstimate(initialAggId) {
  return async (dispatch) => {
    await promisifiedBackground.setInitialGasEstimate(initialAggId);
    await forceUpdateMetamaskState(dispatch);
  };
}

// Permissions

export function requestAccountsPermissionWithId(origin) {
  return async (dispatch) => {
    const id = await promisifiedBackground.requestAccountsPermissionWithId(
      origin,
    );
    await forceUpdateMetamaskState(dispatch);
    return id;
  };
}

/**
 * Approves the permissions request.
 *
 * @param {Object} request - The permissions request to approve.
 */
export function approvePermissionsRequest(request) {
  return (dispatch) => {
    background.approvePermissionsRequest(request, (err) => {
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

/**
 * Rejects the permissions request with the given ID.
 *
 * @param {string} requestId - The id of the request to be rejected
 */
export function rejectPermissionsRequest(requestId) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.rejectPermissionsRequest(requestId, (err) => {
        if (err) {
          dispatch(displayWarning(err.message));
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
export function removePermissionsFor(subjects) {
  return (dispatch) => {
    background.removePermissionsFor(subjects, (err) => {
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

// Pending Approvals

/**
 * Resolves a pending approval and closes the current notification window if no
 * further approvals are pending after the background state updates.
 *
 * @param {string} id - The pending approval id
 * @param {any} [value] - The value required to confirm a pending approval
 */
export function resolvePendingApproval(id, value) {
  return async (dispatch) => {
    await promisifiedBackground.resolvePendingApproval(id, value);
    // Before closing the current window, check if any additional confirmations
    // are added as a result of this confirmation being accepted
    const { pendingApprovals } = await forceUpdateMetamaskState(dispatch);
    if (Object.values(pendingApprovals).length === 0) {
      dispatch(closeCurrentNotificationWindow());
    }
  };
}

/**
 * Rejects a pending approval and closes the current notification window if no
 * further approvals are pending after the background state updates.
 *
 * @param {string} id - The pending approval id
 * @param {Error} [error] - The error to throw when rejecting the approval
 */
export function rejectPendingApproval(id, error) {
  return async (dispatch) => {
    await promisifiedBackground.rejectPendingApproval(id, error);
    // Before closing the current window, check if any additional confirmations
    // are added as a result of this confirmation being rejected
    const { pendingApprovals } = await forceUpdateMetamaskState(dispatch);
    if (Object.values(pendingApprovals).length === 0) {
      dispatch(closeCurrentNotificationWindow());
    }
  };
}

export function setFirstTimeFlowType(type) {
  return (dispatch) => {
    log.debug(`background.setFirstTimeFlowType`);
    background.setFirstTimeFlowType(type, (err) => {
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
    dispatch({
      type: actionConstants.SET_FIRST_TIME_FLOW_TYPE,
      value: type,
    });
  };
}

export function setSelectedSettingsRpcUrl(newRpcUrl) {
  return {
    type: actionConstants.SET_SELECTED_SETTINGS_RPC_URL,
    value: newRpcUrl,
  };
}

export function setNewNetworkAdded(newNetworkAdded) {
  return {
    type: actionConstants.SET_NEW_NETWORK_ADDED,
    value: newNetworkAdded,
  };
}

export function setNewCollectibleAddedMessage(newCollectibleAddedMessage) {
  return {
    type: actionConstants.SET_NEW_COLLECTIBLE_ADDED_MESSAGE,
    value: newCollectibleAddedMessage,
  };
}

export function setLastActiveTime() {
  return (dispatch) => {
    background.setLastActiveTime((err) => {
      if (err) {
        dispatch(displayWarning(err.message));
      }
    });
  };
}

export function setDismissSeedBackUpReminder(value) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    await promisifiedBackground.setDismissSeedBackUpReminder(value);
    dispatch(hideLoadingIndication());
  };
}

export function setConnectedStatusPopoverHasBeenShown() {
  return () => {
    background.setConnectedStatusPopoverHasBeenShown((err) => {
      if (err) {
        throw new Error(err.message);
      }
    });
  };
}

export function setRecoveryPhraseReminderHasBeenShown() {
  return () => {
    background.setRecoveryPhraseReminderHasBeenShown((err) => {
      if (err) {
        throw new Error(err.message);
      }
    });
  };
}

export function setRecoveryPhraseReminderLastShown(lastShown) {
  return () => {
    background.setRecoveryPhraseReminderLastShown(lastShown, (err) => {
      if (err) {
        throw new Error(err.message);
      }
    });
  };
}

export function loadingMethodDataStarted() {
  return {
    type: actionConstants.LOADING_METHOD_DATA_STARTED,
  };
}

export function loadingMethodDataFinished() {
  return {
    type: actionConstants.LOADING_METHOD_DATA_FINISHED,
  };
}

export function getContractMethodData(data = '') {
  return (dispatch, getState) => {
    const prefixedData = addHexPrefix(data);
    const fourBytePrefix = prefixedData.slice(0, 10);
    const { knownMethodData } = getState().metamask;

    if (
      (knownMethodData &&
        knownMethodData[fourBytePrefix] &&
        Object.keys(knownMethodData[fourBytePrefix]).length !== 0) ||
      fourBytePrefix === '0x'
    ) {
      return Promise.resolve(knownMethodData[fourBytePrefix]);
    }

    dispatch(loadingMethodDataStarted());
    log.debug(`loadingMethodData`);

    return getMethodDataAsync(fourBytePrefix).then(({ name, params }) => {
      dispatch(loadingMethodDataFinished());
      background.addKnownMethodData(fourBytePrefix, { name, params }, (err) => {
        if (err) {
          dispatch(displayWarning(err.message));
        }
      });
      return { name, params };
    });
  };
}

export function loadingTokenParamsStarted() {
  return {
    type: actionConstants.LOADING_TOKEN_PARAMS_STARTED,
  };
}

export function loadingTokenParamsFinished() {
  return {
    type: actionConstants.LOADING_TOKEN_PARAMS_FINISHED,
  };
}

export function setSeedPhraseBackedUp(seedPhraseBackupState) {
  return (dispatch) => {
    log.debug(`background.setSeedPhraseBackedUp`);
    return new Promise((resolve, reject) => {
      background.setSeedPhraseBackedUp(seedPhraseBackupState, (err) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        forceUpdateMetamaskState(dispatch).then(resolve).catch(reject);
      });
    });
  };
}

export function initializeThreeBox() {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.initializeThreeBox((err) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}

export function setShowRestorePromptToFalse() {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.setShowRestorePromptToFalse((err) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}

export function turnThreeBoxSyncingOn() {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.turnThreeBoxSyncingOn((err) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}

export function restoreFromThreeBox(accountAddress) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.restoreFromThreeBox(accountAddress, (err) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}

export function getThreeBoxLastUpdated() {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.getThreeBoxLastUpdated((err, lastUpdated) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve(lastUpdated);
      });
    });
  };
}

export function setThreeBoxSyncingPermission(threeBoxSyncingAllowed) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      background.setThreeBoxSyncingPermission(threeBoxSyncingAllowed, (err) => {
        if (err) {
          dispatch(displayWarning(err.message));
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
}

export function turnThreeBoxSyncingOnAndInitialize() {
  return async (dispatch) => {
    await dispatch(setThreeBoxSyncingPermission(true));
    await dispatch(turnThreeBoxSyncingOn());
    await dispatch(initializeThreeBox(true));
  };
}

export function setNextNonce(nextNonce) {
  return {
    type: actionConstants.SET_NEXT_NONCE,
    value: nextNonce,
  };
}

export function getNextNonce() {
  return async (dispatch, getState) => {
    const address = getState().metamask.selectedAddress;
    let nextNonce;
    try {
      nextNonce = await promisifiedBackground.getNextNonce(address);
    } catch (error) {
      dispatch(displayWarning(error.message));
      throw error;
    }
    dispatch(setNextNonce(nextNonce));
    return nextNonce;
  };
}

export function setRequestAccountTabIds(requestAccountTabIds) {
  return {
    type: actionConstants.SET_REQUEST_ACCOUNT_TABS,
    value: requestAccountTabIds,
  };
}

export function getRequestAccountTabIds() {
  return async (dispatch) => {
    const requestAccountTabIds = await promisifiedBackground.getRequestAccountTabIds();
    dispatch(setRequestAccountTabIds(requestAccountTabIds));
  };
}

export function setOpenMetamaskTabsIDs(openMetaMaskTabIDs) {
  return {
    type: actionConstants.SET_OPEN_METAMASK_TAB_IDS,
    value: openMetaMaskTabIDs,
  };
}

export function getOpenMetamaskTabsIds() {
  return async (dispatch) => {
    const openMetaMaskTabIDs = await promisifiedBackground.getOpenMetamaskTabsIds();
    dispatch(setOpenMetamaskTabsIDs(openMetaMaskTabIDs));
  };
}

export function setCurrentWindowTab(currentWindowTab) {
  return {
    type: actionConstants.SET_CURRENT_WINDOW_TAB,
    value: currentWindowTab,
  };
}

export function getCurrentWindowTab() {
  return async (dispatch) => {
    const currentWindowTab = await global.platform.currentTab();
    dispatch(setCurrentWindowTab(currentWindowTab));
  };
}

export function setLedgerTransportPreference(value) {
  return async (dispatch) => {
    dispatch(showLoadingIndication());
    await promisifiedBackground.setLedgerTransportPreference(value);
    dispatch(hideLoadingIndication());
  };
}

export async function attemptLedgerTransportCreation() {
  return await promisifiedBackground.attemptLedgerTransportCreation();
}

export function captureSingleException(error) {
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

export function estimateGas(params) {
  return promisifiedBackground.estimateGas(params);
}

export async function updateTokenType(tokenAddress) {
  let token = {};
  try {
    token = await promisifiedBackground.updateTokenType(tokenAddress);
  } catch (error) {
    log.error(error);
  }
  return token;
}

/**
 * initiates polling for gas fee estimates.
 *
 * @returns {string} a unique identify of the polling request that can be used
 *  to remove that request from consideration of whether polling needs to
 *  continue.
 */
export function getGasFeeEstimatesAndStartPolling() {
  return promisifiedBackground.getGasFeeEstimatesAndStartPolling();
}

/**
 * Informs the GasFeeController that a specific token is no longer requiring
 * gas fee estimates. If all tokens unsubscribe the controller stops polling.
 *
 * @param {string} pollToken - Poll token received from calling
 *  `getGasFeeEstimatesAndStartPolling`.
 */
export function disconnectGasFeeEstimatePoller(pollToken) {
  return promisifiedBackground.disconnectGasFeeEstimatePoller(pollToken);
}

export async function addPollingTokenToAppState(pollingToken) {
  return promisifiedBackground.addPollingTokenToAppState(
    pollingToken,
    POLLING_TOKEN_ENVIRONMENT_TYPES[getEnvironmentType()],
  );
}

export async function removePollingTokenFromAppState(pollingToken) {
  return promisifiedBackground.removePollingTokenFromAppState(
    pollingToken,
    POLLING_TOKEN_ENVIRONMENT_TYPES[getEnvironmentType()],
  );
}

export function getGasFeeTimeEstimate(maxPriorityFeePerGas, maxFeePerGas) {
  return promisifiedBackground.getGasFeeTimeEstimate(
    maxPriorityFeePerGas,
    maxFeePerGas,
  );
}

export async function closeNotificationPopup() {
  await promisifiedBackground.markNotificationPopupAsAutomaticallyClosed();
  global.platform.closeCurrentWindow();
}

// MetaMetrics
/**
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventPayload} MetaMetricsEventPayload
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsPagePayload} MetaMetricsPagePayload
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsPageOptions} MetaMetricsPageOptions
 */

/**
 * @param {MetaMetricsEventPayload} payload - details of the event to track
 * @param {MetaMetricsEventOptions} options - options for routing/handling of event
 * @returns {Promise<void>}
 */
export function trackMetaMetricsEvent(payload, options) {
  return promisifiedBackground.trackMetaMetricsEvent(payload, options);
}

export function createEventFragment(options) {
  return promisifiedBackground.createEventFragment(options);
}

export function createTransactionEventFragment(transactionId, event) {
  return promisifiedBackground.createTransactionEventFragment(
    transactionId,
    event,
  );
}

export function updateEventFragment(id, payload) {
  return promisifiedBackground.updateEventFragment(id, payload);
}

export function finalizeEventFragment(id, options) {
  return promisifiedBackground.finalizeEventFragment(id, options);
}

/**
 * @param {MetaMetricsPagePayload} payload - details of the page viewed
 * @param {MetaMetricsPageOptions} options - options for handling the page view
 */
export function trackMetaMetricsPage(payload, options) {
  return promisifiedBackground.trackMetaMetricsPage(payload, options);
}

export function updateViewedNotifications(notificationIdViewedStatusMap) {
  return promisifiedBackground.updateViewedNotifications(
    notificationIdViewedStatusMap,
  );
}

export async function setAlertEnabledness(alertId, enabledness) {
  await promisifiedBackground.setAlertEnabledness(alertId, enabledness);
}

export async function setUnconnectedAccountAlertShown(origin) {
  await promisifiedBackground.setUnconnectedAccountAlertShown(origin);
}

export async function setWeb3ShimUsageAlertDismissed(origin) {
  await promisifiedBackground.setWeb3ShimUsageAlertDismissed(origin);
}

// Smart Transactions Controller
export async function setSmartTransactionsOptInStatus(optInState) {
  trackMetaMetricsEvent({
    event: 'STX OptIn',
    category: 'swaps',
    sensitiveProperties: {
      stx_enabled: true,
      current_stx_enabled: true,
      stx_user_opt_in: optInState,
    },
  });
  await promisifiedBackground.setSmartTransactionsOptInStatus(optInState);
}

export function fetchSmartTransactionFees(unsignedTransaction) {
  return async (dispatch) => {
    try {
      return await promisifiedBackground.fetchSmartTransactionFees(
        unsignedTransaction,
      );
    } catch (e) {
      log.error(e);
      if (e.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj.type,
        });
      }
      throw e;
    }
  };
}

export function estimateSmartTransactionsGas(
  unsignedTransaction,
  approveTxParams,
) {
  if (approveTxParams) {
    approveTxParams.value = '0x0';
  }
  return async (dispatch) => {
    try {
      await promisifiedBackground.estimateSmartTransactionsGas(
        unsignedTransaction,
        approveTxParams,
      );
    } catch (e) {
      log.error(e);
      if (e.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj.type,
        });
      }
      throw e;
    }
  };
}

const createSignedTransactions = async (
  unsignedTransaction,
  fees,
  areCancelTransactions,
) => {
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
  const signedTransactions = await promisifiedBackground.approveTransactionsWithSameNonce(
    unsignedTransactionsWithFees,
  );
  return signedTransactions;
};

export function signAndSendSmartTransaction({
  unsignedTransaction,
  smartTransactionFees,
}) {
  return async (dispatch) => {
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
      const response = await promisifiedBackground.submitSignedTransactions({
        signedTransactions,
        signedCanceledTransactions,
        txParams: unsignedTransaction,
      }); // Returns e.g.: { uuid: 'dP23W7c2kt4FK9TmXOkz1UM2F20' }
      return response.uuid;
    } catch (e) {
      log.error(e);
      if (e.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj.type,
        });
      }
      throw e;
    }
  };
}

export function updateSmartTransaction(uuid, txData) {
  return async (dispatch) => {
    try {
      await promisifiedBackground.updateSmartTransaction({
        uuid,
        ...txData,
      });
    } catch (e) {
      log.error(e);
      if (e.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj.type,
        });
      }
      throw e;
    }
  };
}

export function setSmartTransactionsRefreshInterval(refreshInterval) {
  return async () => {
    try {
      await promisifiedBackground.setStatusRefreshInterval(refreshInterval);
    } catch (e) {
      log.error(e);
    }
  };
}

export function cancelSmartTransaction(uuid) {
  return async (dispatch) => {
    try {
      await promisifiedBackground.cancelSmartTransaction(uuid);
    } catch (e) {
      log.error(e);
      if (e.message.startsWith('Fetch error:')) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch({
          type: actionConstants.SET_SMART_TRANSACTIONS_ERROR,
          payload: errorObj.type,
        });
      }
      throw e;
    }
  };
}

export function fetchSmartTransactionsLiveness() {
  return async () => {
    try {
      await promisifiedBackground.fetchSmartTransactionsLiveness();
    } catch (e) {
      log.error(e);
    }
  };
}

export function dismissSmartTransactionsErrorMessage() {
  return {
    type: actionConstants.DISMISS_SMART_TRANSACTIONS_ERROR_MESSAGE,
  };
}

// DetectTokenController
export async function detectNewTokens() {
  return promisifiedBackground.detectNewTokens();
}

// App state
export function hideTestNetMessage() {
  return promisifiedBackground.setShowTestnetMessageInDropdown(false);
}

export function setCollectiblesDetectionNoticeDismissed() {
  return promisifiedBackground.setCollectiblesDetectionNoticeDismissed(true);
}

export function setEnableEIP1559V2NoticeDismissed() {
  return promisifiedBackground.setEnableEIP1559V2NoticeDismissed(true);
}

// QR Hardware Wallets
export async function submitQRHardwareCryptoHDKey(cbor) {
  await promisifiedBackground.submitQRHardwareCryptoHDKey(cbor);
}

export async function submitQRHardwareCryptoAccount(cbor) {
  await promisifiedBackground.submitQRHardwareCryptoAccount(cbor);
}

export function cancelSyncQRHardware() {
  return async (dispatch) => {
    dispatch(hideLoadingIndication());
    await promisifiedBackground.cancelSyncQRHardware();
  };
}

export async function submitQRHardwareSignature(requestId, cbor) {
  await promisifiedBackground.submitQRHardwareSignature(requestId, cbor);
}

export function cancelQRHardwareSignRequest() {
  return async (dispatch) => {
    dispatch(hideLoadingIndication());
    await promisifiedBackground.cancelQRHardwareSignRequest();
  };
}
