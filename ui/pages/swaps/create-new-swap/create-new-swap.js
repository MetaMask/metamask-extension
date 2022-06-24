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
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getSwapsDefaultToken } from '../../../selectors';

export default function CreateNewSwap({ sensitiveTrackingProperties }) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);

  return (
    <Box marginBottom={3} className="create-new-swap">
      <button
        onClick={async () => {
          trackEvent({
            event: 'Make Another Swap',
            category: EVENT.CATEGORIES.SWAPS,
            sensitiveProperties: sensitiveTrackingProperties,
          });
          history.push(DEFAULT_ROUTE); // It cleans up Swaps state.
          await dispatch(navigateBackToBuildQuote(history));
          dispatch(setSwapsFromToken(defaultSwapsToken));
        }}
      >
        {t('makeAnotherSwap')}
      </button>
    </Box>
  );
}

CreateNewSwap.propTypes = {
  sensitiveTrackingProperties: PropTypes.object.isRequired,
};
