import classNames from 'classnames';
import React from 'react';
import { useSelector } from 'react-redux';
import { getIsGasEstimatesLoading } from '../../../ducks/metamask/metamask';

const BASE_CLASS = 'loading-heartbeat';
const LOADING_CLASS = `${BASE_CLASS}--active`;

export default function LoadingHeartBeat() {
  const active = useSelector(getIsGasEstimatesLoading);
  return (
    <div
      className={classNames('loading-heartbeat', {
        [LOADING_CLASS]: active,
      })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    ></div>
  );
}
