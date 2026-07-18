import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
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
  const animationEventEmitterRef = useRef(animationEventEmitter);
  animationEventEmitterRef.current = animationEventEmitter;
  const prevFollowMouseRef = useRef(followMouse);
  // Capture the sizing/follow props at first render so we don't make them reactive dependencies of the mount effect.
  const initialLogoOptionsRef = useRef({ followMouse, width, height });

  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const mascotContainer = mascotContainerRef.current;
    if (!mascotContainer) {
      return undefined;
    }

    const {
      followMouse: initialFollowMouse,
      width: initialWidth,
      height: initialHeight,
    } = initialLogoOptionsRef.current;
    const logoViewer = MetaMaskLogo({
      followMouse: initialFollowMouse,
      pxNotRatio: true,
      width: initialWidth,
      height: initialHeight,
      meshJson: getFoxMeshJson(),
      verticalFieldOfView: Math.PI / 37.5,
      near: 100,
      far: 340,
    });
    setLogo(logoViewer);

    mascotContainer.appendChild(logoViewer.container);
    directionTargetMapRef.current = directionTargetGenerator(
      mascotContainer.getBoundingClientRect(),
    );

    const refollowMouse = debounce(
      logoViewer.setFollowMouse.bind(logoViewer, true),
      1000,
    );
    const unfollowMouse = logoViewer.setFollowMouse.bind(logoViewer, false);

    const lookAt = (target) => {
      unfollowMouse();
      logoViewer.lookAtAndRender(target);
      refollowMouse();
    };

    const emitter = animationEventEmitterRef.current;
    const setFollowMouseHandler = logoViewer.setFollowMouse.bind(logoViewer);

    emitter.on('point', lookAt);
    emitter.on('setFollowMouse', setFollowMouseHandler);

    return () => {
      emitter.removeAllListeners();
      logoViewer.container.remove();
      logoViewer.stopAnimation();
      setLogo(null);
    };
  }, []);

  useEffect(() => {
    const directionTargetMap = directionTargetMapRef.current;
    if (!logo || !directionTargetMap) {
      return;
    }

    if (lookAtDirection) {
      logo.lookAtAndRender(directionTargetMap[lookAtDirection]);
    } else if (lookAtTarget?.x && lookAtTarget?.y) {
      logo.lookAtAndRender(lookAtTarget);
    }
  }, [lookAtDirection, lookAtTarget, logo]);

  useEffect(() => {
    if (!logo) {
      return;
    }

    if (prevFollowMouseRef.current === followMouse) {
      return;
    }

    prevFollowMouseRef.current = followMouse;

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
