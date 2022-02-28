import React, { useCallback, useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

const radius = 14;
const strokeWidth = 2;
const radiusWithStroke = radius - strokeWidth / 2;

export default function HoldToRevealButton({ buttonText, onLongPressed }) {
  const t = useContext(I18nContext);
  const isLongPressing = useRef(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [hasTriggeredUnlock, setHasTriggeredUnlock] = useState(false);

  /**
   * Prevent animation events from propogating up
   *
   * @param e - Native animation event - React.AnimationEvent<HTMLDivElement>
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
   * 1. Progress cirle completed. Begin next animation phase (Shrink halo and show unlocked padlock)
   */
  const onProgressComplete = () => {
    isLongPressing.current && setIsUnlocking(true);
  };

  /**
   * 2. Trigger onLongPressed callback. Begin next animation phase (Shrink unlocked padlock and fade in original content)
   *
   * @param e - Native animation event - React.AnimationEvent<HTMLDivElement>
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
      <Box
        className={`absolute-fill ${isUnlocking ? 'invisible' : null} ${
          hasTriggeredUnlock ? 'main-icon-show' : null
        }`}
      >
        <Box className="absolute-fill">
          <svg className="circle-svg">
            <circle
              className="circle-background"
              cx={radius}
              cy={radius}
              r={radiusWithStroke}
            />
          </svg>
        </Box>
        <Box className="absolute-fill">
          <svg className="circle-svg">
            <circle
              onTransitionEnd={onProgressComplete}
              className="circle-foreground"
              cx={radius}
              cy={radius}
              r={radiusWithStroke}
            />
          </svg>
        </Box>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          justifyContent={JUSTIFY_CONTENT.CENTER}
          className="lock-icon-container"
        >
          <img
            src="images/lock-icon.svg"
            alt={t('padlock')}
            className="lock-icon"
          />
        </Box>
      </Box>
    );
    // eslint-disable-next-line
  }, [isUnlocking, hasTriggeredUnlock]);

  const renderPostCompleteContent = useCallback(() => {
    return isUnlocking ? (
      <div
        className={`absolute-fill ${
          hasTriggeredUnlock ? 'unlock-icon-hide' : null
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
          className="unlock-icon-container"
          onAnimationEnd={triggerOnLongPressed}
        >
          <img
            src="images/unlock-icon.svg"
            alt={t('padlock')}
            className="unlock-icon"
          />
        </div>
      </div>
    ) : null;
    // eslint-disable-next-line
  }, [isUnlocking, hasTriggeredUnlock]);

  return (
    <Button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      type="primary"
      icon={
        <Box marginRight={2} className="icon-container">
          {renderPreCompleteContent()}
          {renderPostCompleteContent()}
        </Box>
      }
      className="button-hold"
    >
      {buttonText}
    </Button>
  );
}

HoldToRevealButton.propTypes = {
  /**
   * Text to be displayed on the button
   */
  buttonText: PropTypes.string.isRequired,
  /**
   * Function to be called after the animation is finished
   */
  onLongPressed: PropTypes.func.isRequired,
};
