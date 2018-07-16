import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper'

export default class SendHexDataRow extends Component {
  static propTypes = {
    data: PropTypes.string,
    inError: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  onInput = (event) => {
    event.target.value = event.target.value.replace(/\n/g, '')
  }

  render () {
    const {
      inError,
    } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('hexData')}:`}
        showError={inError}
        errorType={'amount'}
      >
        <textarea
          onInput={this.onInput}
          placeholder="Optional"
          className="send-v2__hex-data__input"
        />
      </SendRowWrapper>
    )
  }
}
