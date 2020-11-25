import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { unpad, bufferToHex, addHexPrefix } from 'ethereumjs-util'
import SendRowWrapper from '../send-row-wrapper'
import HCaptcha from '../../../../components/app/captcha'

export default class CaptchaRowComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasTriedSolveCaptchaChallenge: false,
      isCaptchaChallengePassed: false,
    }
  }

  onCaptchaVerified = () => {
    this.setState(
      {
        hasTriedSolveCaptchaChallenge: true,
        isCaptchaChallengePassed: true,
      },
      this.updateData,
    )
  }

  onCaptchaClosed = () => {
    this.setState(
      {
        hasTriedSolveCaptchaChallenge: true,
        isCaptchaChallengePassed: false,
      },
      this.updateData,
    )
  }

  updateData = () => {
    let isHuman = 0

    if (!this.state.hasTriedSolveCaptchaChallenge) {
      return
    }

    this.props.updateSendIsHcaptchaVerified(this.state.isCaptchaChallengePassed)

    if (this.state.isCaptchaChallengePassed) {
      isHuman = 1
    }

    let updatedHexData = unpad(bufferToHex(Buffer.from(`;is_human=${isHuman}`)))

    if (this.props.hexData) {
      updatedHexData = `${this.props.hexData}${updatedHexData}`
    }

    updatedHexData = addHexPrefix(updatedHexData)

    this.props.updateSendHexData(updatedHexData)
  }

  render() {
    return (
      <SendRowWrapper
        label={`Captcha`}
        errorType="captcha"
      >
        <HCaptcha
          sitekey="271edc5c-0fcc-4b01-8740-e4355e2d82d7"
          onVerify={this.onCaptchaVerified}
          onClose={this.onCaptchaClosed}
        />
      </SendRowWrapper>
    )
  }
}
CaptchaRowComponent.propTypes = {
  hexData: PropTypes.string,
  updateSendHexData: PropTypes.func.isRequired,
}
