import React, { PureComponent } from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

export default class MultipleNotifications extends PureComponent {
  static defaultProps = {
    children: [],
    classNames: [],
  }

  static propTypes = {
    children: PropTypes.array,
    classNames: PropTypes.array,
  }

  state = {
    showAll: false,
  }

  render() {
    const { showAll } = this.state
    const { children, classNames } = this.props

    const childrenToRender = children.filter((child) => child)
    if (childrenToRender.length === 0) {
      return null
    }

    return (
      <div
        className={classnames(...classNames, {
          'home-notification-wrapper--show-all': showAll,
          'home-notification-wrapper--show-first': !showAll,
        })}
      >
        {childrenToRender}
        <div
          className="home-notification-wrapper__i-container"
          onClick={() => this.setState({ showAll: !showAll })}
        >
          {childrenToRender.length > 1 ? (
            <i
              className={classnames('fa fa-sm fa-sort-amount-asc', {
                flipped: !showAll,
              })}
            />
          ) : null}
        </div>
      </div>
    )
  }
}
