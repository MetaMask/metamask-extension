import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import { Box } from '@metamask/design-system-react';
import { I18nContext } from '../../../contexts/i18n';
import { useAnalytics } from '../../../hooks/useAnalytics';
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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);

  return (
    <Box marginBottom={3} className="create-new-swap">
      <button
        onClick={async () => {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.MakeAnotherSwap)
              .addCategory(MetaMetricsEventCategory.Swaps)
              .addSensitiveProperties(sensitiveTrackingProperties)
              .addProperties({
                hd_entropy_index: hdEntropyIndex,
              })
              .build(),
          );
          navigate(DEFAULT_ROUTE); // It cleans up Swaps state.
          await dispatch(navigateBackToPrepareSwap(navigate));
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
