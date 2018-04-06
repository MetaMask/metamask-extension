import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainerFooter extends Component {

  static propTypes = {
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    disabled: PropTypes.bool,
  };

  render () {
    const { onCancel, onSubmit, disabled } = this.props

    return (
      <div className="page-container__footer">

        <button
          className="btn-secondary--lg page-container__footer-button"
          onClick={() => onCancel()}
        >
          {this.context.t('cancel')}
        </button>

        <button
          className="btn-primary--lg page-container__footer-button"
          disabled={disabled}
          onClick={(e) => onSubmit(e)}
        >
          {this.context.t('next')}
        </button>

      </div>
    );
  }

}

PageContainerFooter.contextTypes = {
  t: PropTypes.func,
}
