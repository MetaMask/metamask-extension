import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import isEqual from 'lodash/isEqual';

import Box from '../../../components/ui/box';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  navigateBackToPrepareSwap,
  setSwapsFromToken,
} from '../../../ducks/swaps/swaps';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getSwapsDefaultToken } from '../../../selectors';
import { getHDEntropyIndex } from '../../../selectors/selectors';

export default function CreateNewSwap({ sensitiveTrackingProperties }) {
  const t = useContext(I18nContext);
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const dispatch = useDispatch();
  const history = useHistory();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);

  return (
    <Box marginBottom={3} className="create-new-swap">
      <button
        onClick={async () => {
          trackEvent({
            event: MetaMetricsEventName.MakeAnotherSwap,
            category: MetaMetricsEventCategory.Swaps,
            sensitiveProperties: sensitiveTrackingProperties,
            properties: {
              hd_entropy_index: hdEntropyIndex,
            },
          });
          history.push(DEFAULT_ROUTE); // It cleans up Swaps state.
          await dispatch(navigateBackToPrepareSwap(history));
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
