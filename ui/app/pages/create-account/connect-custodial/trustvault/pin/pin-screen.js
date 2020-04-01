import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../../../components/ui/button'
import CircularInputField from '../components/circular-input-field'
import StarPlaceHolder from '../components/star-placeholder'

export class PinScreen extends PureComponent {
  state = {
    firstPin: null,
    secondPin: null,
  }
  firstPinInput = null

  focusFirstPinInput = () => {
    if (this.firstPinInput) {
      this.firstPinInput.focus()
    }
  }

  componentDidMount () {
    this.focusFirstPinInput()
  }

  renderPinInputField () {
    const { firstPinDigitPosition, secondPinDigitPosition } = this.props.pinChallenge
    const firstPinDigitIndex = this._convertPositionToIndex(firstPinDigitPosition)
    const secondPinDigitIndex = this._convertPositionToIndex(secondPinDigitPosition)

    const pinLength = 6
    const inputField = new Array(pinLength).fill('').map((_, index) => {
      const key = index.toString()
      let component = <StarPlaceHolder key={key}></StarPlaceHolder>
      if (index === firstPinDigitIndex) {
        component = this.getFirstPinInputField(key)
      }
      if (index === secondPinDigitIndex) {
        component = this.getSecondPinInputField(key)
      }
      return component
    })
    return (
      <div className="sw-connect__pin-input">
        {inputField}
      </div>
    )
  }

  getFirstPinInputField = (key) => {
    return (
      <CircularInputField
        autoFocus
        handleChange={(event) => {
          const [firstPin, secondPin] = event.target.value
          this.setState({ firstPin, secondPin })

        }}
        key={key}
        filled={ () => Boolean(this.state.firstPin)}
        maxLength={2}
        setRef={((element) => {
          this.firstPinInput = element
        })}
        keyPress={(e) => {
          if (e.key === 'Enter' && this.state.firstPin && this.state.secondPin) {
            return this.submitPinChallenge()
          }
        }}
      />
    )
  }


  // NOTE: its only used as display feedback all PIN input is handled by firstPinInputField
  getSecondPinInputField = (key) => {
    return (
      <CircularInputField
        key={key}
        filled={() => Boolean(this.state.secondPin)}
        maxLength={0}
      />
    )
  }

  _convertPositionToIndex (positionIntString) {
    if (!this._isIntString(positionIntString)) {
      // throw err? failed to get position?
    }
    return parseInt(positionIntString, 10) - 1
  }

  _isIntString (string) {
    return Number.isInteger(parseFloat(string))
  }

  renderUnsupportedBrowser () {
    return (
      <div className="new-account-connect-form.unsupported-browser">
        <div className="hw-connect">
          <h3 className="hw-connect__title">
            {this.context.t('browserNotSupported')}
          </h3>
          <p className="hw-connect__msg">
            {this.context.t('chromeRequiredForHardwareWallets')}
          </p>

        </div>
        <div>
          <Button
            type="primary"
            large
            onClick={() => {
              global.platform.openWindow({
                url: 'https://google.com/chrome',
              })
            }}
          >
            {this.context.t('downloadGoogleChrome')}
          </Button>
        </div>
      </div>
    )
  }

  renderHeader () {
    const {
      firstPinDigitPosition,
      secondPinDigitPosition,
    } = this.props.pinChallenge
    return (
      <div className="sw-connect__pin-input__header">
        <p className="sw-connect__header__msg">
          Please enter characters
        </p>
        <p className="sw-connect__pin-input__header__msg">
          {`${firstPinDigitPosition} and ${secondPinDigitPosition} of your PIN`}
        </p>

      </div>
    )

  }

  renderFooter () {
    return (
      <div className="sw-connect__pin-input__footer">
        <span
          className="sw-connect__pin-input__footer__msg"
          onClick={ (_) => this.props.onCancelLogin()}
        >
          {`${this.context.t('not')} ${this.props.email}?`}
        </span>
      </div>
    )

  }

  submitPinChallenge = async () => {
    try {
      await this.props.submitTrustVaultPinChallenge(this.state.firstPin, this.state.secondPin)
    } catch (e) {
      if (e && e.data && e.data.pinChallenge) {
        // Remove previous entry if there is a new pin challenge
        this.setState({ firstPin: null, secondPin: null })
      }
    }
  }

  renderConnectToTrustVaultButton () {
    return (
      <div className="sw-connect__pin-input__connect-btn">
        <Button
          type="primary"
          large
          className="sw-connect__connect-btn"
          onClick={this.submitPinChallenge}
          disabled={ !(
            Boolean(this.state.firstPin) && Boolean(this.state.secondPin)
          )}
        >
          {this.context.t('connectToTrustVault')}
        </Button>

      </div>
    )
  }

  renderPinScreen () {
    return (
      <div className="new-account-connect-form">
        {this.renderHeader()}
        {this.renderPinInputField()}
        {this.renderConnectToTrustVaultButton()}
        {this.renderFooter()}
      </div>
    )
  }

  render () {
    if (this.props.browserSupported) {
      return this.renderPinScreen()
    }
    return this.renderUnsupportedBrowser()
  }
}

PinScreen.propTypes = {
  browserSupported: PropTypes.bool.isRequired,
  pinChallenge: PropTypes.object.isRequired,
  submitTrustVaultPinChallenge: PropTypes.func.isRequired,
  onCancelLogin: PropTypes.func.isRequired,
  email: PropTypes.string,
}

PinScreen.contextTypes = {
  t: PropTypes.func,
}

