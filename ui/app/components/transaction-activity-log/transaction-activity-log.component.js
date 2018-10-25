import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { getActivities } from './transaction-activity-log.util'
import Card from '../card'
import { getEthConversionFromWeiHex, getValueFromWeiHex } from '../../helpers/conversions.util'
import { formatDate } from '../../util'

export default class TransactionActivityLog extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    transaction: PropTypes.object,
    className: PropTypes.string,
    conversionRate: PropTypes.number,
    nativeCurrency: PropTypes.string,
  }

  state = {
    activities: [],
  }

  componentDidMount () {
    this.setActivites()
  }

  componentDidUpdate (prevProps) {
    const { transaction: { history: prevHistory = [] } = {} } = prevProps
    const { transaction: { history = [] } = {} } = this.props

    if (prevHistory.length !== history.length) {
      this.setActivites()
    }
  }

  setActivites () {
    const activities = getActivities(this.props.transaction)
    this.setState({ activities })
  }

  renderActivity (activity, index) {
    const { conversionRate, nativeCurrency } = this.props
    const { eventKey, value, timestamp } = activity
    const ethValue = index === 0
      ? `${getValueFromWeiHex({
        value,
        nativeCurrency,
        toCurrency: nativeCurrency,
        conversionRate,
        numberOfDecimals: 6,
      })} ${nativeCurrency}`
      : getEthConversionFromWeiHex({ value, nativeCurrency, toCurrency: nativeCurrency, conversionRate })
    const formattedTimestamp = formatDate(timestamp)
    const activityText = this.context.t(eventKey, [ethValue, formattedTimestamp])

    return (
      <div
        key={index}
        className="transaction-activity-log__activity"
      >
        <div className="transaction-activity-log__activity-icon" />
        <div
          className="transaction-activity-log__activity-text"
          title={activityText}
        >
          { activityText }
        </div>
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { className } = this.props
    const { activities } = this.state

    return (
      <div className={classnames('transaction-activity-log', className)}>
        <Card
          title={t('activityLog')}
          className="transaction-activity-log__card"
        >
          <div className="transaction-activity-log__activities-container">
            { activities.map((activity, index) => this.renderActivity(activity, index)) }
          </div>
        </Card>
      </div>
    )
  }
}
