import React from 'react';
import ReactDOMServer from 'react-dom/server';

import IconTimes from '../../components/ui/icon/icon-times';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../shared/constants/desktop';
import {
  TypographyVariant,
  DISPLAY,
  FLEX_DIRECTION,
  AlignItems,
  TEXT_ALIGN,
  FONT_WEIGHT,
} from '../../helpers/constants/design-system';
import { DEFAULT_ROUTE, SETTINGS_ROUTE } from '../../helpers/constants/routes';
import Typography from '../../components/ui/typography';
import Button from '../../components/ui/button';
import Box from '../../components/ui/box';
import { openCustomProtocol } from '../../../shared/lib/deep-linking';
import { EVENT } from '../../../shared/constants/metametrics';

export function renderDesktopError({
  type,
  t,
  isHtmlError,
  history,
  disableDesktop,
  downloadExtension,
  downloadDesktopApp,
  restartExtension,
  openOrDownloadDesktopApp,
  trackEvent,
}) {
  let content;

  const DESKTOP_ERROR_BUTTON_DOWNLOAD_ID = 'desktop-error-button-download-mmd';
  const DESKTOP_ERROR_BUTTON_OPEN_OR_DOWNLOAD_ID =
    'desktop-error-button-open-or-download-mmd';
  const DESKTOP_ERROR_BUTTON_DISABLE_ID = 'desktop-error-button-disable-mmd';
  const DESKTOP_ERROR_BUTTON_UPDATE_ID = 'desktop-error-button-update-mmd';
  const DESKTOP_ERROR_BUTTON_NAVIGATE_SETTINGS_ID =
    'desktop-error-button-navigate-settings';
  const DESKTOP_ERROR_BUTTON_UPDATE_EXTENSION_ID =
    'desktop-error-button-update-extension';
  const DESKTOP_ERROR_BUTTON_RESTART_ID = 'desktop-error-button-restart-mm';

  const noop = () => {
    // do nothing
  };

  const returnExtensionHome = () => {
    history?.push(DEFAULT_ROUTE);
  };

  const navigateSettings = () => {
    history?.push(SETTINGS_ROUTE);
  };

  const renderHeader = (text) => {
    return (
      <Typography
        variant={TypographyVariant.H4}
        fontWeight={FONT_WEIGHT.BOLD}
        marginTop={6}
        marginBottom={6}
      >
        {text}
      </Typography>
    );
  };

  const renderDescription = (text) => {
    return (
      <Typography variant={TypographyVariant.Paragraph}>{text}</Typography>
    );
  };

  const getEventNameById = (id) => {
    let eventName;
    switch (id) {
      case DESKTOP_ERROR_BUTTON_DOWNLOAD_ID:
        eventName = 'Download MetaMask Desktop';
        break;
      case DESKTOP_ERROR_BUTTON_OPEN_OR_DOWNLOAD_ID:
        eventName = 'Open MetaMask Desktop';
        break;
      case DESKTOP_ERROR_BUTTON_DISABLE_ID:
        eventName = 'Disable MetaMask Desktop';
        break;
      case DESKTOP_ERROR_BUTTON_UPDATE_ID:
        eventName = 'Update MetaMask Desktop';
        break;
      case DESKTOP_ERROR_BUTTON_NAVIGATE_SETTINGS_ID:
        eventName = 'Return to Settings Page';
        break;
      case DESKTOP_ERROR_BUTTON_UPDATE_EXTENSION_ID:
        eventName = 'Update MetaMask Extension';
        break;
      case DESKTOP_ERROR_BUTTON_RESTART_ID:
        eventName = 'Restart MetaMask';
        break;
      default:
        eventName = 'Return MetaMask Home';
        break;
    }
    return eventName;
  };

  const renderCTA = (id, text, onClick) => {
    return (
      <Box marginTop={6}>
        <Button
          type="primary"
          onClick={() => {
            if (onClick) {
              onClick();
              if (typeof trackEvent === 'function') {
                trackEvent({
                  category: EVENT.CATEGORIES.DESKTOP,
                  event: `${getEventNameById(id)} Button Clicked`,
                });
              }
            } else {
              noop();
            }
          }}
          id={id}
        >
          {text}
        </Button>
      </Box>
    );
  };

  const openSettingsOrDownloadMMD = () => {
    openCustomProtocol('metamask-desktop://pair').catch(() => {
      window.open('https://metamask.io/download.html', '_blank').focus();
    });
  };

  switch (type) {
    case EXTENSION_ERROR_PAGE_TYPES.NOT_FOUND:
      content = (
        <>
          {renderHeader(t('desktopNotFoundErrorTitle'))}
          {renderDescription(t('desktopNotFoundErrorDescription1'))}
          {renderDescription(t('desktopNotFoundErrorDescription2'))}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_DOWNLOAD_ID,
            t('desktopNotFoundErrorCTA'),
            downloadDesktopApp,
          )}
        </>
      );
      break;

    case EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST:
      content = (
        <>
          {renderHeader(t('desktopConnectionLostErrorTitle'))}
          {renderDescription(t('desktopConnectionLostErrorDescription'))}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_OPEN_OR_DOWNLOAD_ID,
            t('desktopOpenOrDownloadCTA'),
            openOrDownloadDesktopApp,
          )}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_DISABLE_ID,
            t('desktopDisableErrorCTA'),
            disableDesktop,
          )}
        </>
      );
      break;

    case EXTENSION_ERROR_PAGE_TYPES.DESKTOP_OUTDATED:
      content = (
        <>
          {renderHeader(t('desktopOutdatedErrorTitle'))}
          {renderDescription(t('desktopOutdatedErrorDescription'))}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_UPDATE_ID,
            t('desktopOutdatedErrorCTA'),
            downloadDesktopApp,
          )}
        </>
      );
      break;

    case EXTENSION_ERROR_PAGE_TYPES.EXTENSION_OUTDATED:
      content = (
        <>
          {renderHeader(t('desktopOutdatedExtensionErrorTitle'))}
          {renderDescription(t('desktopOutdatedExtensionErrorDescription'))}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_UPDATE_EXTENSION_ID,
            t('desktopOutdatedExtensionErrorCTA'),
            downloadExtension,
          )}
        </>
      );
      break;

    case EXTENSION_ERROR_PAGE_TYPES.CRITICAL_ERROR:
      content = (
        <>
          {renderHeader(t('desktopConnectionCriticalErrorTitle'))}
          {renderDescription(t('desktopConnectionCriticalErrorDescription'))}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_RESTART_ID,
            t('desktopErrorRestartMMCTA'),
            restartExtension,
          )}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_DISABLE_ID,
            t('desktopDisableErrorCTA'),
            disableDesktop,
          )}
        </>
      );
      break;

    ///: BEGIN:ONLY_INCLUDE_IN(desktop)
    // This route only exists on the Desktop App
    case EXTENSION_ERROR_PAGE_TYPES.ROUTE_NOT_FOUND:
      content = (
        <>
          {renderHeader(t('desktopRouteNotFoundErrorTitle'))}
          {renderDescription(t('desktopRouteNotFoundErrorDescription'))}
          {renderCTA(
            DESKTOP_ERROR_BUTTON_NAVIGATE_SETTINGS_ID,
            t('desktopErrorNavigateSettingsCTA'),
            navigateSettings,
          )}
        </>
      );
      break;
    ///: END:ONLY_INCLUDE_IN

    case EXTENSION_ERROR_PAGE_TYPES.PAIRING_KEY_NOT_MATCH:
      content = (
        <>
          {renderHeader(t('desktopPairedWarningTitle'))}
          {renderDescription(t('desktopPairedWarningDescription'))}
          <Button
            type="link"
            onClick={() => {
              openSettingsOrDownloadMMD();
            }}
            className="desktop-pairing-warning__link"
          >
            {t('desktopPairedWarningDeepLink')}
          </Button>
          {renderCTA(
            DESKTOP_ERROR_BUTTON_NAVIGATE_SETTINGS_ID,
            t('desktopErrorNavigateSettingsCTA'),
            navigateSettings,
          )}
        </>
      );
      break;

    default:
      content = (
        <>
          {renderHeader(t('desktopUnexpectedErrorTitle'))}
          {renderDescription(t('desktopUnexpectedErrorDescription'))}
          {renderCTA(
            'desktop-error-button-return-mm-home',
            t('desktopUnexpectedErrorCTA'),
            returnExtensionHome,
          )}
        </>
      );
      break;
  }

  const errorContent = (
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      textAlign={TEXT_ALIGN.CENTER}
      flexDirection={FLEX_DIRECTION.COLUMN}
      marginLeft={6}
      marginRight={6}
      marginTop={isHtmlError ? 8 : 6}
    >
      <IconTimes size={64} color="var(--color-error-default" />
      {content}
    </Box>
  );

  if (isHtmlError) {
    return ReactDOMServer.renderToStaticMarkup(errorContent);
  }

  return errorContent;
}
