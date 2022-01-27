import { useSelector } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import { isVolatileGasEstimate } from '../../../helpers/utils/gas';
import { getGasLoadingAnimationIsShowing } from '../../../ducks/app/app';
import { useShouldAnimateGasEstimations } from '../../../hooks/useShouldAnimateGasEstimations';

const BASE_CLASS = 'loading-heartbeat';
const LOADING_CLASS = `${BASE_CLASS}--active`;

export default function LoadingHeartBeat({
  estimateUsed,
  backgroundColor = '#fff',
}) {
  useShouldAnimateGasEstimations();
  const active = useSelector(getGasLoadingAnimationIsShowing);

  if (
    process.env.IN_TEST ||
    (estimateUsed && !isVolatileGasEstimate(estimateUsed))
  ) {
    return null;
  }

  return (
    <div
      className={classNames('loading-heartbeat', {
        [LOADING_CLASS]: active,
      })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ backgroundColor }}
    ></div>
  );
}

LoadingHeartBeat.propTypes = {
  backgroundColor: PropTypes.string,
  estimateUsed: PropTypes.string,
};
