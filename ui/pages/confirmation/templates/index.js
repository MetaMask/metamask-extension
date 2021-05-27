import { omit, pick } from 'lodash';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../store/actions';
import addEthereumChain from './add-ethereum-chain';
import switchEthereumChain from './switch-ethereum-chain';

const APPROVAL_TEMPLATES = {
  [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN]: addEthereumChain,
  [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN]: switchEthereumChain,
};

export const TEMPLATED_CONFIRMATION_MESSAGE_TYPES = Object.keys(
  APPROVAL_TEMPLATES,
);

const ALLOWED_TEMPLATE_KEYS = [
  'content',
  'approvalText',
  'cancelText',
  'onApprove',
  'onCancel',
];

/**
 * @typedef {Object} PendingApproval
 * @property {string} id - The randomly generated id of the approval
 * @property {string} origin - The origin of the site requesting this approval
 * @property {number} time - The time the approval was requested
 * @property {string} type - The type of approval being requested
 * @property {Object} requestData - The data submitted with the request
 */

/**
 * getTemplateAlerts calls the getAlerts function exported by the template if
 * it exists, and then returns the result of that function. In the confirmation
 * page the alerts returned from the getAlerts method will be set into the
 * alertState state object.
 *
 * @param {Object} pendingApproval - the object representing the confirmation
 */
export async function getTemplateAlerts(pendingApproval) {
  const fn = APPROVAL_TEMPLATES[pendingApproval.type]?.getAlerts;
  const results = fn ? await fn(pendingApproval) : undefined;
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
 * @param {Object} pendingApproval - the object representing the confirmation
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
 * @param {Function} dispatch - Redux dispatch function
 */
function getAttenuatedDispatch(dispatch) {
  return {
    rejectPendingApproval: (...args) =>
      dispatch(rejectPendingApproval(...args)),
    resolvePendingApproval: (...args) =>
      dispatch(resolvePendingApproval(...args)),
  };
}

/**
 * Returns the templated values to be consumed in the confirmation page
 * @param {Object} pendingApproval - The pending confirmation object
 * @param {Function} t - Translation function
 * @param {Function} dispatch - Redux dispatch function
 */
export function getTemplateValues(pendingApproval, t, dispatch) {
  const fn = APPROVAL_TEMPLATES[pendingApproval.type]?.getValues;
  if (!fn) {
    throw new Error(
      `MESSAGE_TYPE: '${pendingApproval.type}' is not specified in approval templates`,
    );
  }

  const safeActions = getAttenuatedDispatch(dispatch);
  const values = fn(pendingApproval, t, safeActions);
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
