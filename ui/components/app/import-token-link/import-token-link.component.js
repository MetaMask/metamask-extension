import React from 'react';
import { useHistory } from 'react-router-dom';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import { TEXT_ALIGN } from '../../../helpers/constants/design-system';

export default function ImportTokenLink() {
  const addTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked "Add Token"',
    },
  });
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="import-token-link" textAlign={TEXT_ALIGN.CENTER}>
      <Button
        className="import-token-link__link"
        type="link"
        onClick={() => {
          history.push(ADD_TOKEN_ROUTE);
          addTokenEvent();
        }}
      >
        {t('importTokens')}
      </Button>
    </Box>
  );
}
