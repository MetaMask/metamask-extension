import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { TOKEN_MANAGEMENT_ROUTE } from '../../../../../helpers/constants/routes';
import { useAssetControls } from './asset-controls';

/**
 * Opens token management and records the import click. Closes any open asset
 * control menu first.
 */
export const useOpenTokenManagement = () => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const navigate = useNavigate();
  const { close } = useAssetControls();

  return useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.TokenImportButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'HOME',
        })
        .build(),
    );
    close();
    navigate(TOKEN_MANAGEMENT_ROUTE, {
      state: {
        globalMenuTransition: 'forward',
      },
    });
  }, [close, createEventBuilder, navigate, trackEvent]);
};
