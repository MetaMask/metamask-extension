import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainerHeader extends Component {

  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    onClose: PropTypes.func,
    showBackButton: PropTypes.bool,
    onBackButtonClick: PropTypes.func,
    backButtonStyles: PropTypes.object,
    backButtonString: PropTypes.string,
    children: PropTypes.node,
  };

  renderHeaderRow () {
    const { showBackButton, onBackButtonClick, backButtonStyles, backButtonString } = this.props

    return showBackButton && (
      <div className="page-container__header-row">
        <span
          className="page-container__back-button"
          onClick={onBackButtonClick}
          style={backButtonStyles}
        >
          { backButtonString || 'Back' }
        </span>
      </div>
    )
  }

  render () {
    const { title, subtitle, onClose, children } = this.props

    return (
      <div className="page-container__header">

        { this.renderHeaderRow() }

        { children }

        {
          title && <div className="page-container__title">
            { title }
          </div>
        }

        {
          subtitle && <div className="page-container__subtitle">
            { subtitle }
          </div>
        }

        {
          onClose && <div
            className="page-container__header-close"
            onClick={() => onClose()}
          />
        }

      </div>
    )
  }

}
