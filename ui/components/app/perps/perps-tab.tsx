import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getUseExternalServices } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import ErrorBoundary from '../error-boundary/error-boundary';
import { PerpsView } from './perps-view';
import { PerpsViewStreamBoundary } from './perps-view-stream-boundary';
import { PerpsToastProvider } from './perps-toast';

/**
 * Perps tab content for the account overview.
 *
 * When Basic Functionality (useExternalServices) is off, renders an
 * informational empty state instead of mounting the stream boundary,
 * which prevents the background WebSocket connection from opening.
 *
 * If the user toggles Basic Functionality off while the Perps tab is
 * mounted, we also call perpsDisconnect to tear down the background
 * WebSocket so it doesn't linger until the next page reload.
 */
export function PerpsTab() {
  const useExternalServices = useSelector(getUseExternalServices);
  const navigate = useNavigate();
  const t = useI18nContext();

  useEffect(() => {
    if (!useExternalServices) {
      submitRequestToBackground('perpsDisconnect').catch((err: unknown) => {
        console.debug('[PerpsTab] perpsDisconnect failed:', err);
      });
    }
  }, [useExternalServices]);

  if (!useExternalServices) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={4}
        paddingTop={10}
        paddingBottom={10}
        data-testid="perps-basic-functionality-off"
      >
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
          className="max-w-64"
        >
          {t('perpsBasicFunctionalityOff')}
        </Text>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={() => navigate(PRIVACY_ROUTE)}
        >
          {t('basicFunctionalityRequired_reviewInSettings')}
        </Button>
      </Box>
    );
  }

  return (
    <PerpsToastProvider>
      <ErrorBoundary key="perps">
        <PerpsViewStreamBoundary>
          <PerpsView />
        </PerpsViewStreamBoundary>
      </ErrorBoundary>
    </PerpsToastProvider>
  );
}
