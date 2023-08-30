import { Action } from 'redux';
import * as actionConstants from '../../../store/actionConstants';

export function showSitePermissionsModal(): Action {
  return {
    type: actionConstants.SHOW_SITE_PERMISSIONS_MODAL,
  };
}

export function hideSitePermissionsModal(): Action {
  return {
    type: actionConstants.HIDE_SITE_PERMISSIONS_MODAL,
  };
}
