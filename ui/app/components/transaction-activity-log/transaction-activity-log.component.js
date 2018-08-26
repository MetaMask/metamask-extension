import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { getActivities } from './transaction-activity-log.util'
import Card from '../card'

export default class TransactionActivityLog extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    transaction: PropTypes.object,
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
    return (
      <div
        key={index}
        className="transaction-activity-log__activity"
      >
        <div className="transaction-activity-log__activity-icon" />
        { this.renderActivityText(activity) }
      </div>
    )
  }

  renderActivityText (activity) {
    const { eventKey, value, valueDescriptionKey } = activity

    return (
      <div className="transaction-activity-log__activity-text">
        { `Transaction ` }
        <b>{ `${eventKey}` }</b>
        {
          valueDescriptionKey && value
            ? (
              <span>
                { ` with a ${valueDescriptionKey} of ` }
                <b>{ value }</b>
                .
              </span>
            ) : '.'
        }
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { activities } = this.state

    return (
      <div className="transaction-activity-log">
        <Card
          title={t('activityLog')}
          className="transaction-activity-log__card"
        >
          <div className="transaction-activity-log__activities-container">
            {
              activities.map((activity, index) => (
                this.renderActivity(activity, index)
              ))
            }
          </div>
        </Card>
      </div>
    )
  }
}
