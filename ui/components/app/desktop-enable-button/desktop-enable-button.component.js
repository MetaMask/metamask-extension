import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import browser from 'webextension-polyfill';
import { PairingKeyStatus } from '@metamask/desktop/dist/types';
import { I18nContext } from '../../../contexts/i18n';
import Button from '../../ui/button';
import {
  DESKTOP_ERROR_ROUTE,
  DESKTOP_PAIRING_ROUTE,
} from '../../../helpers/constants/routes';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../../shared/constants/desktop';
import { getIsDesktopEnabled } from '../../../selectors';
import {
  hideLoadingIndication,
  showLoadingIndication,
  setDesktopEnabled as setDesktopEnabledAction,
  testDesktopConnection,
  disableDesktop,
} from '../../../store/actions';
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';

const DESKTOP_ERROR_DESKTOP_OUTDATED_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.DESKTOP_OUTDATED}`;
const DESKTOP_ERROR_EXTENSION_OUTDATED_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.EXTENSION_OUTDATED}`;
const DESKTOP_ERROR_NOT_FOUND_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.NOT_FOUND}`;
const DESKTOP_ERROR_PAIRING_KEY_NOT_MATCH_ROUTE = `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.PAIRING_KEY_NOT_MATCH}`;
const SKIP_PAIRING_RESTART_DELAY = 2 * SECOND;
const DESKTOP_UPDATE_SETTINGS_EVENT = 'Settings Updated';

export default function DesktopEnableButton() {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const showLoader = () => dispatch(showLoadingIndication());
  const hideLoader = () => dispatch(hideLoadingIndication());
  const desktopEnabled = useSelector(getIsDesktopEnabled);
  const setDesktopEnabled = (val) => dispatch(setDesktopEnabledAction(val));
  const restart = () => dispatch(browser.runtime.reload());

  const onClick = async () => {
    if (desktopEnabled) {
      await disableDesktop();
      setDesktopEnabled(false);
      trackEvent({
        category: MetaMetricsEventCategory.Desktop,
        event: DESKTOP_UPDATE_SETTINGS_EVENT,
        properties: {
          desktop_enabled: false,
        },
      });
      return;
    }

    showLoader();
    const testResult = await testDesktopConnection();
    hideLoader();

    if ([PairingKeyStatus.NO_MATCH].includes(testResult.pairingKeyCheck)) {
      history.push(DESKTOP_ERROR_PAIRING_KEY_NOT_MATCH_ROUTE);
      return;
    }

    if (!testResult.isConnected) {
      history.push(DESKTOP_ERROR_NOT_FOUND_ROUTE);
      return;
    }

    if (!testResult.versionCheck?.isExtensionVersionValid) {
      history.push(DESKTOP_ERROR_EXTENSION_OUTDATED_ROUTE);
      return;
    }

    if (!testResult.versionCheck?.isDesktopVersionValid) {
      history.push(DESKTOP_ERROR_DESKTOP_OUTDATED_ROUTE);
      return;
    }

    if (process.env.SKIP_OTP_PAIRING_FLOW) {
      showLoader();
      setDesktopEnabled(true);

      // Wait for new state to persist before restarting
      setTimeout(() => {
        restart();
      }, SKIP_PAIRING_RESTART_DELAY);
      return;
    }

    trackEvent({
      category: MetaMetricsEventCategory.Desktop,
      event: 'Desktop Button Clicked',
      properties: {
        button_action: 'Enable MetaMask Desktop',
      },
    });
    history.push(DESKTOP_PAIRING_ROUTE);
  };

  const getButtonText = (isDesktopEnabled) =>
    isDesktopEnabled ? t('desktopDisableButton') : t('desktopEnableButton');

  return (
    <Button
      type="primary"
      large
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {getButtonText(desktopEnabled)}
    </Button>
  );
}
