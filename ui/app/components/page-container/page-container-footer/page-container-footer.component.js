import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainerFooter extends Component {

  static propTypes = {
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const {
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
    } = this.props

    return (
      <div className="page-container__footer">

        <button
          className="btn-secondary--lg page-container__footer-button"
          onClick={() => onCancel()}
        >
          { this.context.t('cancel') || cancelText }
        </button>

        <button
          className="btn-primary--lg page-container__footer-button"
          disabled={disabled}
          onClick={e => onSubmit(e)}
        >
          { this.context.t('next') || submitText }
        </button>

      </div>
    )
  }

}
