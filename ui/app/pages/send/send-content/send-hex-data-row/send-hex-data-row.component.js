import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { appendProofOfHumanityToData } from '../../send.utils'
import SendRowWrapper from '../send-row-wrapper'

export default class SendHexDataRow extends Component {
  static propTypes = {
    inError: PropTypes.bool,
    updateSendHexData: PropTypes.func.isRequired,
    updateGas: PropTypes.func.isRequired,
    isUserVerifiedByCaptcha: PropTypes.bool,
    isReceiverContractAccount: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  onInput = (event) => {
    const {
      updateSendHexData,
      updateGas,
      isUserVerifiedByCaptcha,
      isReceiverContractAccount,
    } = this.props
    const data = event.target.value.replace(/\n/gu, '') || null
    const hexData = isReceiverContractAccount
      ? data
      : appendProofOfHumanityToData(data, isUserVerifiedByCaptcha)
    updateSendHexData(hexData)
    updateGas({ data: hexData })
  }

  render() {
    const { inError } = this.props
    const { t } = this.context

    return (
      <SendRowWrapper
        label={`${t('hexData')}:`}
        showError={inError}
        errorType="amount"
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
