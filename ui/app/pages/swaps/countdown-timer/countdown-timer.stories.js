import React from 'react'
import { number } from '@storybook/addon-knobs/react'
import CountdownTimer from './countdown-timer'

export default {
  title: 'CountdownTimer',
}

const getTimeStartedFromDecrimentSeconds = (seconds) =>
  Date.now() - seconds * 1000

export const Default = () => {
  const timeStartedSecondDecriment = number(
    'Set timeStarted to curren time minus X seconds',
    10,
  )

  return (
    <CountdownTimer
      timeStarted={getTimeStartedFromDecrimentSeconds(
        timeStartedSecondDecriment,
      )}
      timeOnly
    />
  )
}

export const CustomTimerBase = () => {
  const timeStartedSecondDecriment = number(
    'Set timeStarted to curren time minus X seconds',
    10,
  )

  return (
    <CountdownTimer
      timeStarted={getTimeStartedFromDecrimentSeconds(
        timeStartedSecondDecriment,
      )}
      timerBase={150000}
      timeOnly
    />
  )
}

// Label keys used in below stories are just for demonstration purposes
export const WithLabelInfoTooltipAndWarning = () => {
  const timeStartedSecondDecriment = number(
    'Set timeStarted to curren time minus X seconds',
    0,
  )

  return (
    <CountdownTimer
      timeStarted={getTimeStartedFromDecrimentSeconds(
        timeStartedSecondDecriment,
      )}
      timerBase={20000}
      labelKey="disconnectPrompt"
      infoTooltipLabelKey="disconnectAllAccountsConfirmationDescription"
      warningTime="0:15"
    />
  )
}
