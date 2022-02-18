import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

export default function HoldToReveal({
  buttonText,
  secondsToHold = 1,
  revealFinished,
}) {
  const [progress, setProgress] = useState(0);
  const [holdButton, setHoldButton] = useState(false);

  useEffect(() => {
    if (holdButton && progress < 100) {
      const timer = setInterval(() => {
        setProgress((prevProgress) =>
          prevProgress >= 100 ? 0 : prevProgress + 10,
        );
      }, 100 * secondsToHold);

      return () => {
        clearInterval(timer);
      };
    }

    return undefined;
  }, [holdButton, progress, secondsToHold]);

  useEffect(() => {
    if (progress === 100) {
      revealFinished(true);
    }
  }, [progress, revealFinished]);

  return (
    <Button
      onMouseDown={() => setHoldButton(true)}
      onMouseUp={() => {
        setHoldButton(false);
        progress !== 100 && setProgress(0);
      }}
      type="primary"
      icon={
        <Box display={DISPLAY.INLINE_FLEX} className="main-box">
          <CircularProgress
            className="main-box__circular-progress-secondary"
            variant="determinate"
            value={progress}
            color="inherit"
            size={28}
          />
          <CircularProgress
            className="main-box__image-box main-box__circular-progress-primary"
            variant="determinate"
            value={100}
            color="inherit"
            size={28}
          />
          <Box
            display={DISPLAY.FLEX}
            alignItems={ALIGN_ITEMS.CENTER}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            className="main-box__image-box"
          >
            <img
              src={
                progress === 100
                  ? 'images/unlock-icon.svg'
                  : 'images/lock-icon.svg'
              }
              alt="Padlock"
              className="main-box__icon"
            />
          </Box>
        </Box>
      }
    >
      {buttonText}
    </Button>
  );
}

HoldToReveal.propTypes = {
  buttonText: PropTypes.string.isRequired,
  secondsToHold: PropTypes.number,
  revealFinished: PropTypes.func,
};
