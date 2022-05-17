import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import { TEXT_ALIGN } from '../../../helpers/constants/design-system';
import { detectNewTokens } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT } from '../../../../shared/constants/metametrics';
import { getIsMainnet, getIsTokenDetectionSupported } from '../../../selectors';

export default function ImportTokenLink() {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const history = useHistory();

  const isMainnet = useSelector(getIsMainnet);
  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);

  const isTokenDetectionsupported =
    isMainnet ||
    (process.env.TOKEN_DETECTION_V2 && isTokenDetectionSupported) ||
    Boolean(process.env.IN_TEST);

  return (
    <Box className="import-token-link" textAlign={TEXT_ALIGN.CENTER}>
      {isTokenDetectionsupported && (
        <>
          <Button
            className="import-token-link__link"
            type="link"
            onClick={() => detectNewTokens()}
          >
            {t('refreshList')}
          </Button>
          {t('or')}
        </>
      )}
      <Button
        className="import-token-link__link"
        type="link"
        onClick={() => {
          history.push(IMPORT_TOKEN_ROUTE);
          trackEvent({
            event: 'Clicked "Add Token"',
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              action: 'Token Menu',
              legacy_event: true,
            },
          });
        }}
      >
        {isTokenDetectionsupported
          ? t('importTokens')
          : t('importTokens').charAt(0).toUpperCase() +
            t('importTokens').slice(1)}
      </Button>
    </Box>
  );
}
