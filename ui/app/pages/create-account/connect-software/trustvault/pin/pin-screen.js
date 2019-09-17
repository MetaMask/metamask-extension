const { PureComponent } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
import Button from '../../../../../components/ui/button'
import CircularInputField from '../components/circular-input-field'
import StarPlaceholder from '../components/star-placeholder'

class PinScreen extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      selectedDevice: null,
      firstPin: null,
      secondPin: null
    }
    this.firstPinInput = null
  }

  focusFirstPinInput = () => {
    if (this.firstPinInput) {
      this.firstPinInput.focus()
    }
  }

  componentDidMount() {
    this.focusFirstPinInput()
  }

  renderPinInputField() {
    const { firstPinDigitPosition, secondPinDigitPosition } = this.props.pinChallenge
    const firstPinDigitIndex = this._convertPositionToIndex(firstPinDigitPosition)
    const secondPinDigitIndex = this._convertPositionToIndex(secondPinDigitPosition)

    const pinLength = 6
    const inputField = new Array(pinLength).fill("").map((_, index) => {
      const key = index.toString()
      let component = h(StarPlaceholder, { key })
      if (index === firstPinDigitIndex) {
        component = this.getFirstPinInputField(key)
      }
      if (index === secondPinDigitIndex) {
        component = this.getSecondPinInputField(key)
      }
      return component
    })

    const style = {
      display: "grid",
      gridColumnGap: "5px",
      margin: "10px",
      marginBottom: "50px",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr"
    }
    return h("div.pin-input", { style }, inputField)
  }

  getFirstPinInputField = (key) => {
    return h(CircularInputField, {
      autoFocus: true,
      handleChange: (event) => {
        const [firstPin, secondPin] = event.target.value
        this.setState({ firstPin, secondPin })
      },
      key,
      filled: () => Boolean(this.state.firstPin),
      maxLength: 2,
      setRef: (element) => this.firstPinInput = element,
      keyPress: e => {
        if (e.key === "Enter" && this.state.firstPin && this.state.secondPin) {
          this.submitPinChallenge()
        }
      },
    })
  }


  // NOTE: its only used as display feedback all PIN input is handled by firstPinInputField
  getSecondPinInputField = (key) => {
    return h(CircularInputField, {
      key,
      filled: () => Boolean(this.state.secondPin),
      maxLength: 0,
    })
  }

  _convertPositionToIndex(positionIntString) {
    if (!this._isIntString(positionIntString)) {
      // throw err? failed to get position?
    }
    return parseInt(positionIntString, 10) - 1
  }

  _isIntString(string) {
    return Number.isInteger(parseFloat(string))
  }

  renderUnsupportedBrowser() {
    return h("div.new-account-connect-form.unsupported-browser", {}, [
      h("div.hw-connect", [
        h("h3.hw-connect__title", {}, this.context.t("browserNotSupported")),
        h(
          "p.hw-connect__msg",
          {},
          this.context.t("chromeRequiredForHardwareWallets")
        )
      ]),
      h(
        Button,
        {
          type: "primary",
          large: true,
          onClick: () =>
            global.platform.openWindow({
              url: "https://google.com/chrome"
            })
        },
        this.context.t("downloadGoogleChrome")
      )
    ])
  }

  renderHeader() {
    const style = {
      marginTop: "100px",
      marginBottom: "20px"
    }
    const {
      firstPinDigitPosition,
      secondPinDigitPosition
    } = this.props.pinChallenge
    return h("div.sw-connect__header", { style }, [
      h("p.sw-connect__header__msg", {}, "Please enter characters"),
      h(
        "p.sw-connect__header__msg",
        {
          style: {
            margin: "auto",
            textAlign: "center"
          }
        },
        `${firstPinDigitPosition} and ${secondPinDigitPosition} of your PIN`
      )
    ])
  }

  renderFooter() {
    const style = {
      width: "100%",
      padding: "10px",
      display: "flex",
    }
    return h("div.sw-connect__footer", { style }, [
      h(
        "span.sw-connect__footer_msg",
        {
          style: {
            color: "grey",
            fontSize: "80%",
            textAlign: "center",
            margin: "0 auto",
            padding: "10px"
          },
          onClick: _ => this.props.onCancelLogin()
        },
        `${this.context.t("not")} ${this.props.email}?`
      )
    ])
  }

  submitPinChallenge = async () => {
     const { auth, pinChallenge } = await this.props.submitTrustVaultPinChallenge(this.state.firstPin, this.state.secondPin)
     if (!auth && pinChallenge) {
       this.setState({ firstPin: null, secondPin: null })
     }
  }

  renderConnectToTrustVaultButton() {
    const style = {
      width: "80%"
    }
    return h("div.sw-pin-connect-btn", { style }, [
      h(
        Button,
        {
          type: "primary",
          large: true,
          className: "sw-connect__connect-btn",
          onClick: this.submitPinChallenge,
          disabled: !(
            Boolean(this.state.firstPin) && Boolean(this.state.secondPin)
          )
        },
        this.context.t("connectToTrustVault")
      )
    ])
  }

  renderPinScreen() {
    return h("div.new-account-connect-form", {}, [
      this.renderHeader(),
      this.renderPinInputField(),
      this.renderConnectToTrustVaultButton(),
      this.renderFooter()
    ])
  }

  render() {
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

module.exports = PinScreen
