import { formatTimeEstimate } from '../../../helpers/utils/gas-time-estimates.util'

export function calcTransactionTimeRemaining (initialTimeEstimate, submittedTime) {
  const currentTime = (new Date()).getTime()
  const timeElapsedSinceSubmission = (currentTime - submittedTime) / 1000
  const timeRemainingOnEstimate = initialTimeEstimate - timeElapsedSinceSubmission

  const renderingTimeRemainingEstimate = timeRemainingOnEstimate < 30
    ? '< 30 s'
    : formatTimeEstimate(timeRemainingOnEstimate)

  return renderingTimeRemainingEstimate
}
