import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Duration } from 'luxon';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../../components/ui/info-tooltip';
import {
  getSwapsQuoteRefreshTime,
  getSwapsQuotePrefetchingRefreshTime,
} from '../../../ducks/swaps/swaps';
import { SECOND } from '../../../../shared/constants/time';
import TimerIcon from './timer-icon';

// Return the mm:ss start time of the countdown timer.
// If time has elapsed between `timeStarted` the time current time,
// then that elapsed time will be subtracted from the timer before
// rendering
function getNewTimer(currentTime, timeStarted, timeBaseStart) {
  const timeAlreadyElapsed = currentTime - timeStarted;
  return timeBaseStart - timeAlreadyElapsed;
}

function decreaseTimerByOne(timer) {
  return Math.max(timer - SECOND, 0);
}

function timeBelowWarningTime(timer, warningTime) {
  const [warningTimeMinutes, warningTimeSeconds] = warningTime.split(':');
  return (
    timer <=
    (Number(warningTimeMinutes) * 60 + Number(warningTimeSeconds)) * SECOND
  );
}

export default function CountdownTimer({
  timeStarted,
  timeOnly,
  timerBase,
  warningTime,
  labelKey,
  infoTooltipLabelKey,
}) {
  const t = useContext(I18nContext);
  const intervalRef = useRef();
  const initialTimeStartedRef = useRef();

  const swapsQuoteRefreshTime = useSelector(getSwapsQuoteRefreshTime);
  const swapsQuotePrefetchingRefreshTime = useSelector(
    getSwapsQuotePrefetchingRefreshTime,
  );
  const refreshTime = initialTimeStartedRef.current
    ? swapsQuoteRefreshTime
    : swapsQuotePrefetchingRefreshTime;
  const timerStart = Number(timerBase) || refreshTime;

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [timer, setTimer] = useState(() =>
    getNewTimer(currentTime, timeStarted, timerStart),
  );

  useEffect(() => {
    if (intervalRef.current === undefined) {
      intervalRef.current = setInterval(() => {
        setTimer(decreaseTimerByOne);
      }, SECOND);
    }

    return function cleanup() {
      clearInterval(intervalRef.current);
    };
  }, []);

  // Reset the timer that timer has hit '0:00' and the timeStarted prop has changed
  useEffect(() => {
    if (!initialTimeStartedRef.current) {
      initialTimeStartedRef.current = timeStarted || Date.now();
    }

    if (timer === 0 && timeStarted !== initialTimeStartedRef.current) {
      initialTimeStartedRef.current = timeStarted;
      const newCurrentTime = Date.now();
      setCurrentTime(newCurrentTime);
      setTimer(getNewTimer(newCurrentTime, timeStarted, timerStart));

      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimer(decreaseTimerByOne);
      }, SECOND);
    }
  }, [timeStarted, timer, timerStart]);

  const formattedTimer = Duration.fromMillis(timer).toFormat('m:ss');
  let time;
  if (timeOnly) {
    time = <div className="countdown-timer__time">{formattedTimer}</div>;
  } else if (labelKey) {
    time = t(labelKey, [
      <div key="countdown-time-1" className="countdown-timer__time">
        {formattedTimer}
      </div>,
    ]);
  }

  return (
    <div className="countdown-timer">
      <div
        data-testid="countdown-timer__timer-container"
        className={classnames('countdown-timer__timer-container', {
          'countdown-timer__timer-container--warning':
            warningTime && timeBelowWarningTime(timer, warningTime),
        })}
      >
        <TimerIcon />
        {time}
      </div>
      {!timeOnly && infoTooltipLabelKey ? (
        <InfoTooltip position="bottom" contentText={t(infoTooltipLabelKey)} />
      ) : null}
    </div>
  );
}

CountdownTimer.propTypes = {
  /**
   * Unix timestamp that indicates the time at which this timer has started
   * running.
   */
  timeStarted: PropTypes.number,

  /**
   * Boolean indicating whether to display only the time (`true`) or to also
   * display a label (`false`), given by the `labelKey` parameter.
   */
  timeOnly: PropTypes.bool,

  /**
   * The duration of this timer in milliseconds.
   */
  timerBase: PropTypes.number,

  /**
   * The time at which this timer should turn red, indicating it has almost run
   * out of time. Given in the format `mm:ss`.
   */
  warningTime: PropTypes.string,

  /**
   * The key of the label to display next to the timer, defined in
   * `app/_locales/`.
   */
  labelKey: PropTypes.string,

  /**
   * The key of the label to display in the tooltip when hovering over the info
   * icon, defined in `app/_locales/`.
   */
  infoTooltipLabelKey: PropTypes.string,
};
