import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import { TEXT_ALIGN } from '../../../helpers/constants/design-system';
import { detectNewTokens } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function ImportTokenLink({ isMainnet }) {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="import-token-link" textAlign={TEXT_ALIGN.CENTER}>
      {isMainnet && (
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
            category: 'Navigation',
            properties: {
              action: 'Token Menu',
              legacy_event: true,
            },
          });
        }}
      >
        {isMainnet
          ? t('importTokens')
          : t('importTokens').charAt(0).toUpperCase() +
            t('importTokens').slice(1)}
      </Button>
    </Box>
  );
}

ImportTokenLink.propTypes = {
  isMainnet: PropTypes.bool,
};
