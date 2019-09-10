import React, { PureComponent } from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

export default class MultipleNotifications extends PureComponent {
  static propTypes = {
    notifications: PropTypes.array,
    classNames: PropTypes.array,
  }

  state = {
    showAll: false,
  }

  render () {
    const { showAll } = this.state
    const { notifications, classNames = [] } = this.props

    const notificationsToBeRendered = notifications.filter(notificationConfig => notificationConfig.shouldBeRendered)

    if (notificationsToBeRendered.length === 0) {
      return null
    }

    return (
      <div
        className={classnames(...classNames, {
          'home-notification-wrapper--show-all': showAll,
          'home-notification-wrapper--show-first': !showAll,
        })}
      >
        { notificationsToBeRendered.map(notificationConfig => notificationConfig.component) }
        <div
          className="home-notification-wrapper__i-container"
          onClick={() => this.setState({ showAll: !showAll })}
        >
          {notificationsToBeRendered.length > 1 ? <i className={classnames('fa fa-sm fa-sort-amount-asc', {
            'flipped': !showAll,
          })} /> : null}
        </div>
      </div>
    )
  }
}
