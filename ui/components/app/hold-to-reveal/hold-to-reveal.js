import React, { useCallback, useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import { I18nContext } from '../../../contexts/i18n';

const radius = 14;
const strokeWidth = 2;
const radiusWithStroke = radius - strokeWidth / 2;

export default function HoldToReveal({ buttonText, onLongPressed }) {
  const t = useContext(I18nContext);
  const isLongPressing = useRef(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [hasTriggeredUnlock, setHasTriggeredUnlock] = useState(false);

  /**
   * Prevent animation events from propogating up
   *
   * @param e Native animation event - React.AnimationEvent<HTMLDivElement>
   */
  const preventPropogation = (e) => {
    e.stopPropagation();
  };

  /**
   * Event for mouse click down
   */
  const onMouseDown = () => {
    isLongPressing.current = true;
  };

  /**
   * Event for mouse click up
   */
  const onMouseUp = () => {
    isLongPressing.current = false;
  };

  /**
   * 1. Progress cirle completed. Begin next animation phase (Shrink halo and show check mark)
   */
  const onProgressComplete = () => {
    isLongPressing.current && setIsUnlocking(true);
  };

  /**
   * 2. Trigger onLongPressed callback. Begin next animation phase (Shrink check mark and fade in original content)
   *
   * @param e Native animation event - React.AnimationEvent<HTMLDivElement>
   */
  const triggerOnLongPressed = (e) => {
    onLongPressed();
    setHasTriggeredUnlock(true);
    preventPropogation(e);
  };

  /**
   * 3. Reset animation states
   */
  const resetAnimationStates = () => {
    setIsUnlocking(false);
    setHasTriggeredUnlock(false);
  };

  const renderPreCompleteContent = useCallback(() => {
    return (
      <div
        className={`absolute-fill ${isUnlocking ? 'invisible' : null} ${
          hasTriggeredUnlock ? 'main-icon-show' : null
        }`}
      >
        <div className="absolute-fill">
          <svg className="circle-svg">
            <circle
              className="circle-background"
              cx={radius}
              cy={radius}
              r={radiusWithStroke}
            />
          </svg>
        </div>
        <div className="absolute-fill">
          <svg className="circle-svg">
            <circle
              onTransitionEnd={onProgressComplete}
              className="circle-foreground"
              cx={radius}
              cy={radius}
              r={radiusWithStroke}
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
    );
  }, [isUnlocking, hasTriggeredUnlock]);

  const renderPostCompleteContent = useCallback(() => {
    return isUnlocking ? (
      <div
        className={`absolute-fill ${
          hasTriggeredUnlock ? 'check-icon-hide' : null
        }`}
        onAnimationEnd={resetAnimationStates}
      >
        <div
          onAnimationEnd={preventPropogation}
          className="absolute-fill circle-static-outer-container"
        >
          <svg className="circle-svg">
            <circle className="circle-static-outer" cx={14} cy={14} r={14} />
          </svg>
        </div>
        <div
          onAnimationEnd={preventPropogation}
          className="absolute-fill circle-static-inner-container"
        >
          <svg className="circle-svg">
            <circle className="circle-static-inner" cx={14} cy={14} r={12} />
          </svg>
        </div>
        <div
          className="check-icon-container"
          onAnimationEnd={triggerOnLongPressed}
        >
          <img
            src={'images/check-white.svg'}
            alt={t('padlock')}
            className="check-icon"
          />
        </div>
      </div>
    ) : null;
  }, [isUnlocking, hasTriggeredUnlock]);

  return (
    <Button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      type="primary"
      icon={
        <div className="icon-container">
          {renderPreCompleteContent()}
          {renderPostCompleteContent()}
        </div>
      }
    >
      {buttonText}
    </Button>
  );
}

HoldToReveal.propTypes = {
  buttonText: PropTypes.string.isRequired,
  onLongPressed: PropTypes.func.isRequired,
};
