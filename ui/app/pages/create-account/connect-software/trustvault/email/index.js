const { PureComponent } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../../../../store/actions')
const EmailScreen = require('./email-screen')
const ConnectTrustVaultPinForm = require('../pin')

class ConnectTrustVaultEmailForm extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      browserSupported: true,
    }
  }

  renderError () {
    return this.state.error
      ? h(
          'span.error',
          {
            style: {
              margin: '20px 20px 10px',
              display: 'block',
              textAlign: 'center',
            }
          },
          this.state.error,
        )
      : null
  }

  renderContent () {
    return h(EmailScreen, {
      history: this.props.history,
      browserSupported: this.state.browserSupported,
      getTrustVaultPinChallenge: this.props.getTrustVaultPinChallenge,
    })
  }

  render () {
    return h('div', [this.renderError(), this.renderContent()])
  }
}

ConnectTrustVaultEmailForm.propTypes = {
  t: PropTypes.func,
  network: PropTypes.string,
  getTrustVaultPinChallenge: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
}

const mapStateToProps = ({ metamask: { network } }) => ({ network })

const mapDispatchToProps = dispatch => ({
  showAlert: msg => dispatch(actions.showAlert(msg)),
  hideAlert: () => dispatch(actions.hideAlert()),
})

ConnectTrustVaultEmailForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectTrustVaultEmailForm)
