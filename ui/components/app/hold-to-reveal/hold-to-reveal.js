import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import { compileScope } from 'squirrelly';

export default function HoldToReveal({ buttonText, onLongPressed }) {
  const t = useContext(I18nContext);

  const isLongPressing = useRef(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [hasTriggeredUnlock, setHasTriggeredUnlock] = useState(false);

  const unlockSRP = () => {
    setIsUnlocking(true);
  };

  const processUnlockSRP = (e) => {
    onLongPressed();
    setHasTriggeredUnlock(true);
    e.stopPropagation();
    e.preventDefault();
  };

  const finishUnlockSRP = () => {
    setIsUnlocking(false);
    setHasTriggeredUnlock(false);
  };

  return (
    <Button
      onMouseDown={() => (isLongPressing.current = true)}
      onMouseUp={() => (isLongPressing.current = false)}
      type="primary"
      icon={
        <div className="icon-container">
          <div
            className={`absolute-fill ${isUnlocking ? 'invisible' : null} ${
              hasTriggeredUnlock ? 'main-icon-show' : null
            }`}
          >
            <div className="absolute-fill">
              <svg className="circle-svg">
                <circle className="circle-background" cx={14} cy={14} r={13} />
              </svg>
            </div>
            <div className="absolute-fill">
              <svg className="circle-svg">
                <circle
                  onTransitionEndCapture={() => {
                    isLongPressing.current && unlockSRP();
                  }}
                  className="circle-foreground"
                  cx={14}
                  cy={14}
                  r={13}
                />
              </svg>
            </div>
            <div className="lock-icon-container">
              <img
                src={'images/lock-icon.svg'}
                alt={t('padlock')}
                className="lock-icon"
              />
            </div>
          </div>
          {isUnlocking ? (
            <div
              className={`absolute-fill ${
                hasTriggeredUnlock ? 'check-icon-hide' : null
              }`}
              onAnimationEnd={finishUnlockSRP}
            >
              <div
                onAnimationEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="absolute-fill circle-static-outer-container"
              >
                <svg className="circle-svg">
                  <circle
                    className="circle-static-outer"
                    cx={14}
                    cy={14}
                    r={14}
                  />
                </svg>
              </div>
              <div
                onAnimationEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="absolute-fill circle-static-inner-container"
              >
                <svg className="circle-svg">
                  <circle
                    className="circle-static-inner"
                    cx={14}
                    cy={14}
                    r={12}
                  />
                </svg>
              </div>
              <div
                className="check-icon-container"
                onAnimationEnd={processUnlockSRP}
              >
                <img
                  src={'images/check-white.svg'}
                  alt={t('padlock')}
                  className="check-icon"
                />
              </div>
            </div>
          ) : null}
        </div>
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
