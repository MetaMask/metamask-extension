import { Action } from 'redux';
import * as actionConstants from '../../../store/actionConstants';

export function showConnectAccountsModal(): Action {
  return {
    type: actionConstants.CONNECT_ACCOUNTS_MODAL_OPEN,
  };
}

export function hideConnectAccountsModal(): Action {
  return {
    type: actionConstants.CONNECT_ACCOUNTS_MODAL_CLOSE,
  };
}
