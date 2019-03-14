import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
} from '../../../../../../app/scripts/lib/enums'
import NetworkDisplay from '../../network-display'

export default class ConfirmPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    showEdit: PropTypes.bool,
    onEdit: PropTypes.func,
    children: PropTypes.node,
  }

  renderTop () {
    const { onEdit, showEdit } = this.props
    const windowType = window.METAMASK_UI_TYPE
    const isFullScreen = windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
      windowType !== ENVIRONMENT_TYPE_POPUP

    if (!showEdit && isFullScreen) {
      return null
    }

    return (
      <div className="confirm-page-container-header__row">
        <div
          className="confirm-page-container-header__back-button-container"
          style={{
            visibility: showEdit ? 'initial' : 'hidden',
          }}
        >
          <img
            src="/images/caret-left.svg"
          />
          <span
            className="confirm-page-container-header__back-button"
            onClick={() => onEdit()}
          >
            { this.context.t('edit') }
          </span>
        </div>
        { !isFullScreen && <NetworkDisplay /> }
      </div>
    )
  }

  render () {
    const { children } = this.props

    return (
      <div className="confirm-page-container-header">
        { this.renderTop() }
        { children }
      </div>
    )
  }
}
