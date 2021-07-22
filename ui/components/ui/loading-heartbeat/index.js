import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

export default function LoadingHeartBeat({ active }) {
  const heartNode = useRef(null);

  const LOADING_CLASS = 'loading-heartbeat--active';

  // When the loading animation completes, remove the className to disappear again
  useEffect(() => {
    const eventName = 'animationend';
    const node = heartNode?.current;
    const eventHandler = () => {
      node?.classList.remove(LOADING_CLASS);
    };

    node?.addEventListener(eventName, eventHandler);
    return () => {
      node?.removeEventListener(eventName, eventHandler);
    };
  }, [heartNode]);

  return (
    <div
      className={classNames('loading-heartbeat', {
        [LOADING_CLASS]: active,
      })}
      ref={heartNode}
    ></div>
  );
}

LoadingHeartBeat.propTypes = {
  active: PropTypes.bool,
};
