import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { getTimeBreakdown } from './time-remaining.utils'

export default class TimeRemaining extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    milliseconds: PropTypes.number,
  }

  render () {
    const {
      milliseconds,
    } = this.props

    const {
      minutes,
      seconds,
    } = getTimeBreakdown(milliseconds)

    return (
      <div className="time-remaining">
        <span className="minutes-num">{minutes}</span>
        <span className="minutes-label">{this.context.t('minutesShorthand')}</span>
        <span className="seconds-num">{seconds}</span>
        <span className="seconds-label">{this.context.t('secondsShorthand')}</span>
      </div>
    )
  }
}
