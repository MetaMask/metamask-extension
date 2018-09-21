import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'

export default class PageContainerFooter extends Component {

  static defaultProps = {
    alternateText: null,
    onAlternate: null,
  }

  static propTypes = {
    alternateText: PropTypes.string,
    onAlternate: PropTypes.func,
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    submitButtonType: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  nextBtnRef = null

  setNextBtnRef = (e) => {
    this.nextBtnRef = e
  }

  componentDidUpdate () {
    if (this.nextBtnRef) {
      this.nextBtnRef.scrollIntoView()
    }
  }

  render () {
    const {
      alternateText,
      onAlternate,
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
      submitButtonType,
    } = this.props

    return (
      <div className="page-container__footer">
        <div>
          {
            alternateText && onAlternate && (
              <Button
                type="default"
                large
                className="page-container__footer-button"
                onClick={onAlternate}
              >
                { alternateText }
              </Button>
            )
          }
          <Button
            type="default"
            large
            className="page-container__footer-button"
            onClick={onCancel}
          >
            { cancelText || this.context.t('cancel') }
          </Button>
          <Button
            buttonRef={this.setNextBtnRef}
            type={submitButtonType || 'primary'}
            large
            className="page-container__footer-button"
            disabled={disabled}
            onClick={onSubmit}
          >
            { submitText || this.context.t('next') }
          </Button>
        </div>
      </div>
    )
  }

}
