import React, { useState, useEffect, useContext, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { I18nContext } from '../../../contexts/i18n'
import InfoTooltip from '../../../components/ui/info-tooltip'

const TIMER_BASE = 60000

function millisToMinutesAndSeconds (millis) {
  const minutes = Math.floor(millis / 60000)
  let seconds = (Math.floor((millis % 60000)) / 1000).toFixed(0)
  if (seconds === '60') {
    seconds = 59
  }
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

// Return the mm:ss start time of the countdown timer.
// If time has elapsed between `timeStarted` the time current time,
// then that elapsed time will be subtracted from the timer before
// rendering
function getNewTimer (currentTime, timeStarted, timeBaseStart) {
  const timeAlreadyElapsed = currentTime - timeStarted
  const timerStart = timeBaseStart - timeAlreadyElapsed
  const readableTimerStart = millisToMinutesAndSeconds(timerStart)
  return readableTimerStart
}

function decreaseTimerByOne (timer) {
  const [minutes, seconds] = timer.split(':')
  if (timer === '0:00') {
    return '0:00'
  } else if (seconds === '00') {
    return `${Number(minutes) - 1}:59`
  }
  return `${minutes}:${String((Number(seconds) - 1)).padStart(2, '0')}`

}

function timeBelowWarningTime (time, warningTime) {
  const [timeMinutes, timeSeconds] = time.split(':')
  const [warningTimeMinutes, warningTimeSeconds] = warningTime.split(':')

  return (Number(timeMinutes) < Number(warningTimeMinutes)) ||
    (Number(timeMinutes) === Number(warningTimeMinutes) && (Number(timeSeconds) <= Number(warningTimeSeconds)))
}

export default function CountdownTimer ({
  timeStarted,
  timeOnly,
  timerBase = TIMER_BASE,
  warningTime,
  labelKey,
  infoTooltipLabelKey,
}) {
  const intervalRef = useRef()
  const t = useContext(I18nContext)
	  const [initialTimeStarted, setInitialTimeStarted] = useState(() => timeStarted || Date.now())
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const initialTimer = getNewTimer(currentTime, timeStarted, timerBase)
  const [timer, setTimer] = useState(initialTimer)

  useEffect(() => {
    if (intervalRef.current === undefined) {
      intervalRef.current = setInterval(() => {
        setTimer(decreaseTimerByOne)
      }, 1000)
    }
  }, [timer])

  // Reset the timer if a new timeStarted is provided after the timer runs to '0:00'
  useEffect(() => {
    if (timer === '0:00' && timeStarted !== initialTimeStarted) {
      setInitialTimeStarted(timeStarted)
      const newCurrentTime = Date.now()
      setCurrentTime(newCurrentTime)
      setTimer(getNewTimer(newCurrentTime, timeStarted, timerBase))

      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setTimer((_timer) => decreaseTimerByOne(_timer))
      }, 1000)
    }
  }, [timeStarted, timer, initialTimeStarted, timerBase])

  useEffect(() => {
    return function cleanup () {
      clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="countdown-timer">
      <div
        className={classnames('countdown-timer__timer-container', {
          'countdown-timer__timer-container--warning': warningTime && timeBelowWarningTime(timer, warningTime),
        })}
      >
        {!timeOnly && labelKey && t(labelKey, [<div key="countdown-time-1" className="countdown-timer__time">{timer}</div>])}
        {timeOnly && <div className="countdown-timer__time">{timer}</div>}
      </div>
      {!timeOnly && infoTooltipLabelKey && (
        <InfoTooltip
          position="bottom"
          contentText={t(infoTooltipLabelKey)}
        />
      )}
    </div>
  )
}

CountdownTimer.propTypes = {
  timeStarted: PropTypes.number,
  timeOnly: PropTypes.bool,
  timerBase: PropTypes.number,
  warningTime: PropTypes.string,
  labelKey: PropTypes.string,
  infoTooltipLabelKey: PropTypes.string,
}
