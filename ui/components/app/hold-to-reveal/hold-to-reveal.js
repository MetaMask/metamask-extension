import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import Button from '../../ui/button';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box/box';

export default function HoldToReveal({
  buttonText,
  timeToHold,
  revealFinished,
}) {
  const t = useContext(I18nContext);

  const [progress, setProgress] = useState(0);
  const [holdButton, setHoldButton] = useState(false);

  useEffect(() => {
    if (holdButton && progress < 100) {
      const timer = setInterval(() => {
        setProgress((prevProgress) =>
          prevProgress >= 100 ? 0 : prevProgress + 10,
        );
      }, 100 * timeToHold);

      return () => {
        clearInterval(timer);
      };
    }

    return undefined;
  }, [holdButton, progress, timeToHold]);

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
        <Box className="main-box">
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
          <Box className="main-box__image-box">
            <img
              src={
                progress === 100
                  ? 'images/unlock-icon.svg'
                  : 'images/lock-icon.svg'
              }
              alt=""
              className="main-box__icon"
            />
          </Box>
        </Box>
      }
    >
      {t(buttonText)}
    </Button>
  );
}

HoldToReveal.propTypes = {
  buttonText: PropTypes.string,
  timeToHold: PropTypes.number,
  revealFinished: PropTypes.func,
};
