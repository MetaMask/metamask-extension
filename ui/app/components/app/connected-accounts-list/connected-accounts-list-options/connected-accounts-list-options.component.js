import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Tooltip } from 'react-tippy'

export default class ConnectedAccountsListOptions extends PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  render () {
    return (
      <Tooltip
        arrow={false}
        animation="none"
        animateFill={false}
        transitionFlip={false}
        hideDuration={0}
        duration={0}
        trigger="click"
        interactive
        theme="none"
        position="bottom-end"
        unmountHTMLWhenHide
        html={(
          <div className="connected-accounts-options">
            {this.props.children}
          </div>
        )}
      >
        <i className="fas fa-ellipsis-v" />
      </Tooltip>
    )
  }
}
