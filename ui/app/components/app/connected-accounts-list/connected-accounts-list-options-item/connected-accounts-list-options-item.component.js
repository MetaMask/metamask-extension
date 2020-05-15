import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export default class ConnectedAccountsListOptionsItem extends PureComponent {
  static propTypes = {
    iconClassNames: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
  }

  static defaultProps = {
    onClick: undefined,
  }

  render () {
    const { children, iconClassNames, onClick } = this.props

    return (
      <button className="connected-accounts-options__row" onClick={onClick}>
        <i className={classnames('connected-accounts-options__row-icon', iconClassNames)} />
        <span>{children}</span>
      </button>
    )
  }
}
