import React, { Component } from 'react'
import PropTypes from 'prop-types'


export default class SeedImportSubview extends Component {

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    return (
      <div className={'new-account-import-form__seed'}>
        <p>{this.context.t('pasteSeed')}</p>
        <textarea />
        <div className={'new-account-import-form__buttons'}>
          <button
            className={'btn-default btn--large.new-account-import-form__button'}
            onClick={() => {
            }}
          >
            {this.context.t('cancel')}
          </button>
          <button
            className={'btn-primary btn--large.new-account-import-form__button'}
            onClick={() => {
            }}
          >
            {this.context.t('import')}
          </button>
        </div>
      </div>
    )
  }

}
