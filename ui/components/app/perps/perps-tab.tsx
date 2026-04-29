import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUseExternalServices } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import ErrorBoundary from '../error-boundary/error-boundary';
import { TabEmptyState } from '../../ui/tab-empty-state';
import { PerpsView } from './perps-view';
import { PerpsViewStreamBoundary } from './perps-view-stream-boundary';
import { PerpsToastProvider } from './perps-toast';

/**
 * Perps tab content for the account overview.
 *
 * When Basic Functionality (useExternalServices) is off, renders an
 * informational empty state instead of mounting the stream boundary,
 * which prevents the background WebSocket connection from opening.
 */
export function PerpsTab() {
  const useExternalServices = useSelector(getUseExternalServices);
  const navigate = useNavigate();
  const t = useI18nContext();

  if (!useExternalServices) {
    return (
      <TabEmptyState
        icon={
          <img
            alt="MetaMask logo"
            src="./images/logo/metamask-fox.svg"
            style={{ width: 64, height: 64 }}
          />
        }
        description={t('basicFunctionalityRequired_description')}
        actionButtonText={t('basicFunctionalityRequired_reviewInSettings')}
        onAction={() => navigate(SETTINGS_ROUTE)}
        className="mx-auto mt-5 mb-6"
        data-testid="perps-basic-functionality-off"
      />
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
