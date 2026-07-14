import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import MetaMaskLogo from '@metamask/logo';
import { debounce } from 'lodash';
import { getFoxMeshJson } from '../../../../shared/lib/build-types';

const directionTargetGenerator = ({ top, left, height, width }) => {
  const horizontalMiddle = left + width / 2;
  const verticalMiddle = top + height / 2;
  return {
    up: { x: horizontalMiddle, y: top - height },
    down: { x: horizontalMiddle, y: top + height * 2 },
    left: { x: left - width, y: verticalMiddle },
    right: { x: left + width * 2, y: verticalMiddle },
    middle: { x: horizontalMiddle, y: verticalMiddle },
  };
};

function Mascot({
  animationEventEmitter,
  width = '200',
  height = '200',
  followMouse = true,
  lookAtTarget = {},
  lookAtDirection = null,
}) {
  const mascotContainerRef = useRef(null);
  const directionTargetMapRef = useRef(null);
  const logoRef = useRef(null);
  const animationEventEmitterRef = useRef(animationEventEmitter);
  animationEventEmitterRef.current = animationEventEmitter;

  if (!logoRef.current) {
    logoRef.current = MetaMaskLogo({
      followMouse,
      pxNotRatio: true,
      width,
      height,
      meshJson: getFoxMeshJson(),
      verticalFieldOfView: Math.PI / 37.5,
      near: 100,
      far: 340,
    });
  }

  const logo = logoRef.current;

  useEffect(() => {
    const mascotContainer = mascotContainerRef.current;
    if (!mascotContainer) {
      return undefined;
    }

    mascotContainer.appendChild(logo.container);
    directionTargetMapRef.current = directionTargetGenerator(
      mascotContainer.getBoundingClientRect(),
    );

    const refollowMouse = debounce(logo.setFollowMouse.bind(logo, true), 1000);
    const unfollowMouse = logo.setFollowMouse.bind(logo, false);

    const lookAt = (target) => {
      unfollowMouse();
      logo.lookAtAndRender(target);
      refollowMouse();
    };

    const emitter = animationEventEmitterRef.current;
    const setFollowMouseHandler = logo.setFollowMouse.bind(logo);

    emitter.on('point', lookAt);
    emitter.on('setFollowMouse', setFollowMouseHandler);

    return () => {
      emitter.removeAllListeners();
      logo.container.remove();
      logo.stopAnimation();
    };
  }, [logo]);

  useEffect(() => {
    const directionTargetMap = directionTargetMapRef.current;
    if (!directionTargetMap) {
      return;
    }

    if (lookAtDirection) {
      logo.lookAtAndRender(directionTargetMap[lookAtDirection]);
    } else if (lookAtTarget?.x && lookAtTarget?.y) {
      logo.lookAtAndRender(lookAtTarget);
    }
  }, [lookAtDirection, lookAtTarget, logo]);

  useEffect(() => {
    const refollowMouse = debounce(logo.setFollowMouse.bind(logo, true), 1000);
    logo.setFollowMouse(false);
    if (followMouse) {
      refollowMouse();
    }
  }, [followMouse, logo]);

  return <div ref={mascotContainerRef} style={{ zIndex: 0 }} />;
}

Mascot.propTypes = {
  animationEventEmitter: PropTypes.object.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  followMouse: PropTypes.bool,
  lookAtTarget: PropTypes.object,
  lookAtDirection: PropTypes.oneOf(['up', 'down', 'left', 'right', 'middle']),
};

export default Mascot;
