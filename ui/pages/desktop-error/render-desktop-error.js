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
}) {
  let content;

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

  const renderCTA = (id, text, onClick) => {
    return (
      <Box marginTop={6}>
        <Button type="primary" onClick={onClick ?? noop} id={id}>
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
            'desktop-error-button-download-mmd',
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
            'desktop-error-button-open-or-download-mmd',
            t('desktopOpenOrDownloadCTA'),
            openOrDownloadDesktopApp,
          )}
          {renderCTA(
            'desktop-error-button-disable-mmd',
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
            'desktop-error-button-update-mmd',
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
            'desktop-error-button-update-extension',
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
            'desktop-error-button-restart-mm',
            t('desktopErrorRestartMMCTA'),
            restartExtension,
          )}
          {renderCTA(
            'desktop-error-button-disable-mmd',
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
            'desktop-error-button-navigate-settings',
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
            'desktop-error-button-navigate-settings',
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
