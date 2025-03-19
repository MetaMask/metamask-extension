import { omit, pick } from 'lodash';
import { ApprovalType } from '@metamask/controller-utils';
import {
  deleteInterface,
  rejectPendingApproval,
  resolvePendingApproval,
  setNewNetworkAdded,
  addNetwork,
} from '../../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../../shared/constants/app';
import smartTransactionStatusPage from './smart-transaction-status-page';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import createSnapAccount from './create-snap-account';
import removeSnapAccount from './remove-snap-account';
import snapAccountRedirect from './snap-account-redirect';
import createNamedSnapAccount from './create-named-snap-account';
///: END:ONLY_INCLUDE_IF
import addEthereumChain from './add-ethereum-chain';
import switchEthereumChain from './switch-ethereum-chain';
import success from './success';
import error from './error';
import snapAlert from './snaps/snap-alert/snap-alert';
import snapConfirmation from './snaps/snap-confirmation/snap-confirmation';
import snapPrompt from './snaps/snap-prompt/snap-prompt';
import snapDefault from './snaps/snap-default/snap-default';

/**
 * Approval templates that will be prioritized ahead of transaction and signature confirmations.
 */
export const PRIORITY_APPROVAL_TEMPLATE_TYPES = [
  SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
];

const APPROVAL_TEMPLATES = {
  [ApprovalType.AddEthereumChain]: addEthereumChain,
  [ApprovalType.SwitchEthereumChain]: switchEthereumChain,
  // Use ApprovalType from utils controller
  [ApprovalType.ResultSuccess]: success,
  [ApprovalType.ResultError]: error,
  [SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage]:
    smartTransactionStatusPage,
  [ApprovalType.SnapDialogAlert]: snapAlert,
  [ApprovalType.SnapDialogConfirmation]: snapConfirmation,
  [ApprovalType.SnapDialogPrompt]: snapPrompt,
  [ApprovalType.SnapDialogDefault]: snapDefault,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation]:
    createSnapAccount,
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval]:
    removeSnapAccount,
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount]:
    createNamedSnapAccount,
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect]:
    snapAccountRedirect,
  ///: END:ONLY_INCLUDE_IF
};

export const TEMPLATED_CONFIRMATION_APPROVAL_TYPES =
  Object.keys(APPROVAL_TEMPLATES);

const ALLOWED_TEMPLATE_KEYS = [
  'cancelText',
  'content',
  'onLoad',
  'onCancel',
  'onSubmit',
  'networkDisplay',
  'submitText',
  'loadingText',
  'hideSubmitButton',
];

/**
 * @typedef {object} PendingApproval
 * @property {string} id - The randomly generated id of the approval
 * @property {string} origin - The origin of the site requesting this approval
 * @property {number} time - The time the approval was requested
 * @property {string} type - The type of approval being requested
 * @property {object} requestData - The data submitted with the request
 */

/**
 * getTemplateAlerts calls the getAlerts function exported by the template if
 * it exists, and then returns the result of that function. In the confirmation
 * page the alerts returned from the getAlerts method will be set into the
 * alertState state object.
 *
 * @param {object} pendingApproval - the object representing the confirmation
 * @param {object} state - The state object consist of required info to determine alerts.
 */
export async function getTemplateAlerts(pendingApproval, state) {
  const fn = APPROVAL_TEMPLATES[pendingApproval.type]?.getAlerts;

  const results = fn ? await fn(pendingApproval, state) : [];
  if (!Array.isArray(results)) {
    throw new Error(`Template alerts must be an array, received: ${results}`);
  }
  if (results.some((result) => result?.id === undefined)) {
    throw new Error(
      `Template alert entries must be objects with an id key. Received: ${results}`,
    );
  }
  return results;
}

/**
 * The function call to return state must be a promise returning function
 * this "NOOP" is here to conform to the requirements for templates without
 * state.
 */
async function emptyState() {
  return {};
}

/**
 * getTemplateState calls the getState function exported by the template if
 * it exists, and then returns the result of that function. In the confirmation
 * page the object returned from the getState method will be set into the
 * confirmationState state object. Note, this state is not consumed by the page
 * itself.
 *
 * @param {object} pendingApproval - the object representing the confirmation
 */
export async function getTemplateState(pendingApproval) {
  const fn = APPROVAL_TEMPLATES[pendingApproval.type]?.getState ?? emptyState;
  const result = await fn(pendingApproval);
  if (typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(`Template state must be an object, received: ${result}`);
  } else if (result === null || result === undefined) {
    return {};
  }
  return result;
}

/**
 * We do not want to pass the entire dispatch function to the template.
 * This function should return an object of actions that we generally consider
 * to be safe for templates to invoke. In the future we could put these behind
 * permission sets so that snaps that wish to manipulate state must ask for
 * explicit permission to do so.
 *
 * @param {Function} dispatch - Redux dispatch function
 */
function getAttenuatedDispatch(dispatch) {
  return {
    rejectPendingApproval: (...args) =>
      dispatch(rejectPendingApproval(...args)),
    resolvePendingApproval: (...args) =>
      dispatch(resolvePendingApproval(...args)),
    addNetwork: (...args) => dispatch(addNetwork(...args)),
    setNewNetworkAdded: (...args) => dispatch(setNewNetworkAdded(...args)),
    deleteInterface: (...args) => dispatch(deleteInterface(...args)),
  };
}

/**
 * Returns the templated values to be consumed in the confirmation page
 *
 * @param {object} pendingApproval - The pending confirmation object.
 * @param {Function} t - Translation function.
 * @param {Function} dispatch - Redux dispatch function.
 * @param {object} history - The application's history object.
 * @param {object} data - The data object passed into the template from the confirmation page.
 * @param {object} contexts - Contexts objects passed into the template from the confirmation page.
 */
export function getTemplateValues(
  pendingApproval,
  t,
  dispatch,
  history,
  data,
  contexts,
) {
  const fn = APPROVAL_TEMPLATES[pendingApproval.type]?.getValues;
  if (!fn) {
    throw new Error(
      `MESSAGE_TYPE: '${pendingApproval.type}' is not specified in approval templates`,
    );
  }

  const safeActions = getAttenuatedDispatch(dispatch);
  const values = fn(pendingApproval, t, safeActions, history, data, contexts);
  const extraneousKeys = omit(values, ALLOWED_TEMPLATE_KEYS);
  const safeValues = pick(values, ALLOWED_TEMPLATE_KEYS);
  if (extraneousKeys.length > 0) {
    throw new Error(
      `Received extraneous keys from ${
        pendingApproval.type
      }.getValues. These keys are not passed to the confirmation page: ${Object.keys(
        extraneousKeys,
      )}`,
    );
  }
  return safeValues;
}
