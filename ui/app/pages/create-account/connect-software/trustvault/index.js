const { PureComponent } = require('react')
const { Switch, Route } = require('react-router-dom')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../../../store/actions')
const { getCurrentViewContext } = require('../../../../selectors/selectors')
const ConnectTrustVaultEmailForm = require('./email')
const ConnectTrustVaultPinForm = require('./pin')
const {
  TRUSTVAULT_EMAIL_ROUTE,
  TRUSTVAULT_PIN_ROUTE,
  DEFAULT_ROUTE
} = require("../../../../helpers/constants/routes")

class ConnectTrustVaultForm extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      browserSupported: true,
      pinChallenge: null,
      email: null,
    }
  }

  getTrustVaultPinChallenge = async email => {
    // TODO: email not found error
    const { pinChallenge, error } = await this.props.getTrustVaultPinChallenge(email)
    this.setState({
      pinChallenge,
      email,
      error: error && error.message
    })
  }

  goToHomePage () {
    this.props.history.push(DEFAULT_ROUTE)
  }

  onCancelLogin = () => {
    this.setState({ pinChallenge: null })
  }

  renderError () {
    return this.state.error
      ? h(
          "span.error",
          {
            style: {
              margin: "20px 20px 10px",
              display: "block",
              textAlign: "center"
            }
          },
          this.state.error,
        )
      : null
  }

  goToHomePage = () => {
    this.props.history.push(DEFAULT_ROUTE)
  }

  onCancelLogin = () => {
    this.setState({ pinChallenge: null, error: null })
  }

  onNewPinChallenge = (pinChallenge, error) => {
    this.setState({ pinChallenge, error })
  }

  renderEmailForm = () => {
    return h(ConnectTrustVaultEmailForm, {
      history: this.props.history,
      getTrustVaultPinChallenge: this.getTrustVaultPinChallenge,
    })
  }

  renderPinForm = () => {
    return h(ConnectTrustVaultPinForm, {
      browserSupported: this.state.browserSupported,
      history: this.props.history,
      pinChallenge: this.state.pinChallenge,
      email: this.state.email,
      onCancelLogin: this.onCancelLogin,
      goToHomePage: this.goToHomePage,
      onNewPinChallenge: this.onNewPinChallenge,
    });
  }

  render = () => {
    return h("div.new-account__header", [
      h("div.trustvault-connect", [
        this.renderError(),
        !this.state.pinChallenge ? this.renderEmailForm() : this.renderPinForm(),
        h(Switch, [
          h(Route, {
            exact: true,
            path: TRUSTVAULT_EMAIL_ROUTE,
            component: ConnectTrustVaultEmailForm,
          }),
          h(Route, {
            exact: true,
            path: TRUSTVAULT_PIN_ROUTE,
            component: ConnectTrustVaultPinForm,
          }),
        ])
      ])
    ])
  }
}

ConnectTrustVaultForm.propTypes = {
  history: PropTypes.object,
  t: PropTypes.func,
}

ConnectTrustVaultForm.contextTypes = {
  t: PropTypes.func,
}

const mapStateToProps = state => ({
  displayedForm: getCurrentViewContext(state),
})

const mapDispatchToProps = dispatch => ({
  getTrustVaultPinChallenge: email => dispatch(actions.getTrustVaultPinChallenge(email)),
})

module.exports = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectTrustVaultForm)
