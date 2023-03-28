import { useParams, useHistory } from 'react-router-dom';
import { useContext } from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  downloadDesktopApp,
  downloadExtension,
  restartExtension,
} from '../../../shared/lib/error-utils';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { renderDesktopError } from './render-desktop-error';

export default function DesktopError({ forceDisableDesktop }) {
  const t = useI18nContext();
  const { errorType } = useParams();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  return renderDesktopError({
    type: errorType,
    t,
    isHtmlError: false,
    history,
    disableDesktop: () => {
      forceDisableDesktop();
      history.push(DEFAULT_ROUTE);
    },
    downloadDesktopApp,
    downloadExtension,
    restartExtension,
    trackEvent,
  });
}
