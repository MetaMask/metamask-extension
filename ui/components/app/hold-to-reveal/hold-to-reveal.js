import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import BuyIcon from '../../ui/icon/overview-buy-icon.component';
import { I18nContext } from '../../../contexts/i18n';
import { CircularProgress } from '@material-ui/core';
import { DISPLAY } from '../../../helpers/constants/design-system';
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
          setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 10));
        }, 100 * timeToHold);
    
        return () => {
          clearInterval(timer);
        };
      }
    }, [holdButton, progress]);

    useEffect(() => {
      if (progress === 100) {
        revealFinished(true);
      }
    }, [progress])

    return (
      <Button onMouseDown={() => setHoldButton(true)}  onMouseUp={() => { setHoldButton(false); progress === 100 ? null : setProgress(0); }} type='primary' icon={
        <Box className="main-box">
          <CircularProgress className="main-box__circular-progress-secondary" variant="determinate" value={progress} color='inherit' size={28}/>
          <CircularProgress className="main-box__image-box main-box__circular-progress-primary" variant="determinate" value={100} color='inherit' size={28} />
          <Box className="main-box__image-box">
            <img src={progress === 100 ? 'images/unlock-icon.svg' : 'images/lock-icon.svg'}  className="main-box__icon" />
          </Box>
        </Box>
      }>
        {t(`${buttonText}`)}
      </Button>
    )
}

HoldToReveal.propTypes = {
    buttonText: PropTypes.string,
    timeToHold: PropTypes.number,
    revealFinished: PropTypes.func,
};
