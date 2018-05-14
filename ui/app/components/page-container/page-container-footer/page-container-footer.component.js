import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from './components/button'

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

        <Button
          type="secondary"
          large={true}
          className="page-container__footer-button"
          onClick={() => onCancel()}
        >
          { this.context.t('cancel') || cancelText }
        </Button>

        <Button
          type="primary"
          large={true}
          className="page-container__footer-button"
          disabled={disabled}
          onClick={e => onSubmit(e)}
        >
          { this.context.t('next') || submitText }
        </Button>

      </div>
    )
  }

}
