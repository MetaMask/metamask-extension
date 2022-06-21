import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import isEqual from 'lodash/isEqual';

import Box from '../../../components/ui/box';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT } from '../../../../shared/constants/metametrics';
import {
  navigateBackToBuildQuote,
  setSwapsFromToken,
} from '../../../ducks/swaps/swaps';
import { getSwapsDefaultToken } from '../../../selectors';

export default function CreateNewSwap({ sensitiveProperties }) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);

  return (
    <Box marginBottom={3} className="create-new-swap">
      <a
        href="#"
        onClick={async () => {
          trackEvent({
            event: 'Make Another Swap',
            category: EVENT.CATEGORIES.SWAPS,
            sensitiveProperties,
          });
          await dispatch(navigateBackToBuildQuote(history));
          dispatch(setSwapsFromToken(defaultSwapsToken));
        }}
      >
        {t('makeAnotherSwap')}
      </a>
    </Box>
  );
}

CreateNewSwap.propTypes = {
  sensitiveProperties: PropTypes.object.isRequired,
};
