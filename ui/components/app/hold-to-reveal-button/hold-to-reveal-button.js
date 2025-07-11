import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useRef, useState } from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  AlignItems,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, Button } from '../../component-library';

const radius = 14;
const strokeWidth = 2;
const radiusWithStroke = radius - strokeWidth / 2;

export default function HoldToRevealButton({ buttonText, onLongPressed }) {
  const t = useContext(I18nContext);
  const isLongPressing = useRef(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [hasTriggeredUnlock, setHasTriggeredUnlock] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

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
    trackEvent({
      category: MetaMetricsEventCategory.Keys,
      event: MetaMetricsEventName.SrpHoldToRevealClickStarted,
      properties: {
        key_type: MetaMetricsEventKeyType.Srp,
      },
    });
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
  const triggerOnLongPressed = useCallback(
    (e) => {
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpHoldToRevealCompleted,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      trackEvent({
        category: MetaMetricsEventCategory.Keys,
        event: MetaMetricsEventName.SrpRevealViewed,
        properties: {
          key_type: MetaMetricsEventKeyType.Srp,
        },
      });
      onLongPressed();
      setHasTriggeredUnlock(true);
      preventPropogation(e);
    },
    [onLongPressed, trackEvent],
  );

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
        className={classnames('hold-to-reveal-button__absolute-fill', {
          'hold-to-reveal-button__absolute-fill': isUnlocking,
          'hold-to-reveal-button__main-icon-show': hasTriggeredUnlock,
        })}
      >
        <Box className="hold-to-reveal-button__absolute-fill">
          <svg className="hold-to-reveal-button__circle-svg">
            <circle
              className="hold-to-reveal-button__circle-background"
              cx={radius}
              cy={radius}
              r={radiusWithStroke}
            />
          </svg>
        </Box>
        <Box className="hold-to-reveal-button__absolute-fill">
          <svg className="hold-to-reveal-button__circle-svg">
            <circle
              aria-label={t('holdToRevealLockedLabel')}
              onTransitionEnd={onProgressComplete}
              className="hold-to-reveal-button__circle-foreground"
              cx={radius}
              cy={radius}
              r={radiusWithStroke}
            />
          </svg>
        </Box>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          className="hold-to-reveal-button__lock-icon-container"
        >
          <img
            src="images/lock-icon.svg"
            alt={t('padlock')}
            className="hold-to-reveal-button__lock-icon"
          />
        </Box>
      </Box>
    );
  }, [isUnlocking, hasTriggeredUnlock, t]);

  const renderPostCompleteContent = useCallback(() => {
    return isUnlocking ? (
      <div
        className={classnames('hold-to-reveal-button__absolute-fill', {
          'hold-to-reveal-button__unlock-icon-hide': hasTriggeredUnlock,
        })}
        onAnimationEnd={resetAnimationStates}
      >
        <div
          onAnimationEnd={preventPropogation}
          className="hold-to-reveal-button__absolute-fill hold-to-reveal-button__circle-static-outer-container"
        >
          <svg className="hold-to-reveal-button__circle-svg">
            <circle
              className="hold-to-reveal-button__circle-static-outer"
              cx={14}
              cy={14}
              r={14}
            />
          </svg>
        </div>
        <div
          onAnimationEnd={preventPropogation}
          className="hold-to-reveal-button__absolute-fill hold-to-reveal-button__circle-static-inner-container"
        >
          <svg className="hold-to-reveal-button__circle-svg">
            <circle
              className="hold-to-reveal-button__circle-static-inner"
              cx={14}
              cy={14}
              r={12}
            />
          </svg>
        </div>
        <div
          aria-label={t('holdToRevealUnlockedLabel')}
          className="hold-to-reveal-button__unlock-icon-container"
          onAnimationEnd={triggerOnLongPressed}
        >
          <img
            src="images/unlock-icon.svg"
            alt={t('padlock')}
            className="hold-to-reveal-button__unlock-icon"
          />
        </div>
      </div>
    ) : null;
  }, [isUnlocking, hasTriggeredUnlock, triggerOnLongPressed, t]);

  return (
    <Button
      width={BlockSize.Full}
      onPointerDown={onMouseDown} // allows for touch and mouse events
      onPointerUp={onMouseUp} // allows for touch and mouse events
      className="hold-to-reveal-button__button-hold"
      textProps={{ display: Display.Flex, alignItems: AlignItems.center }}
    >
      <Box className="hold-to-reveal-button__icon-container" marginRight={2}>
        {renderPreCompleteContent()}
        {renderPostCompleteContent()}
      </Box>
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
