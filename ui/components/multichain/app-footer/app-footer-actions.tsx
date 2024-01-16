import { Action } from 'redux';
import * as actionConstants from '../../../store/actionConstants';

export function showSelectActionModal(): Action {
  return {
    type: actionConstants.SELECT_ACTION_MODAL_OPEN,
  };
}

export function hideSelectActionModal(): Action {
  return {
    type: actionConstants.SELECT_ACTION_MODAL_CLOSE,
  };
}
