import { PureComponent } from 'react'
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
import Button from '../../../../../components/ui/button'
import TextField from '../../../../../components/ui/text-field'
const ENTER_KEY = 13
class EmailScreen extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      email: null,
      error: null
    }
  }

  renderNextButton () {
    const style = {
      width: '80%',
      'marginTop': '50px',
    }
    return h(
      Button,
      {
        style,
        type: 'primary',
        className: 'sw-connect__connect-btn',
        onClick: _ => this.props.getTrustVaultPinChallenge(this.state.email),
        disabled: !this.state.email,
      },
      this.context.t('next'),
    )
  }

  renderEmailInputBox () {
    return h(
      'div.sw-connect-email-field',
      { style: { width: "80%" } },
      [
        h(TextField, {
          autoFocus: true,
          type: 'text',
          placeholder: 'Email address',
          largeLabel: true,
          fullWidth: true,
          onChange: event => this.setState({ email: event.target.value }),
          onKeyDown: event => {
            if (event.keyCode === ENTER_KEY) {
              this.props.getTrustVaultPinChallenge(this.state.email)
            }
          }
        }),
        h('span', {style: {
          fontSize: '12px',
          color: 'red',

        }}, this.context.t('trustVaultGetStarted')),
        h('span', {
          style: {
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'underline',
            color: 'red',
          },
          onClick: () => {
            global.platform.openWindow({
              url: 'https://trustology.io/get-started/',
            })
          },
        }, this.context.t('here'))
      ]
    )
  }

  renderLearnMoreLink () {
    return h(
      'div.lear-more-link', {}, [
        h('span', {style: {
          fontSize: '12px',
          color: 'red',

        }}, this.context.t('trustVaultLearnMore')),
        h('span', {
          style: {
            cursor: 'pointer',  
            textDecoration: 'underline',
            fontSize: '12px',
            color: 'red',
          },
          onClick: () => {
            global.platform.openWindow({
              url: 'https://app.intercom.io/a/apps/jbjnxu3c/articles/articles/3350608/show',
            })
          },
        }, this.context.t('FAQ'))
      ])
  }

  renderUnsupportedBrowser () {
    return h('div.new-account-connect-form.unsupported-browser', {}, [
      h('div.hw-connect', [
        h('h3.hw-connect__title', {}, this.context.t('browserNotSupported')),
        h(
          'p.hw-connect__msg',
          {},
          this.context.t('chromeRequiredForHardwareWallets')
        )
      ]),
      h(
        Button,
        {
          type: 'primary',
          large: true,
          onClick: () =>
            global.platform.openWindow({
              url: 'https://google.com/chrome'
            })
        },
        this.context.t('downloadGoogleChrome')
      )
    ])
  }

  renderHeader () {
    return h('div.sw-connect__header', {}, [
      h(
        'h3.hw-connect__header__title',
        {},
        this.context.t(`trustVaultWelcome`)
      ),
      h('p.hw-connect__header__msg', {}, this.context.t(`trustVaultEnterEmail`))
    ])
  }

  renderTrustVaultLogo () {
    return h(
      'div.trustvault-log',
      {
        style: { margin: '30px' }
      },
      [
        h('img.sw-connect__btn__img', {
          src: 'images/trustvault-logo.png',
          style: { width: 100, height: 100 }
        })
      ]
    );
  }

  renderEmailScreen () {
    return h('div.new-account-connect-form', {}, [
      this.renderTrustVaultLogo(),
      this.renderHeader(),
      this.renderEmailInputBox(),
      this.renderNextButton(),
      this.renderLearnMoreLink()
      
      
    ])
  }

  render () {
    if (this.props.browserSupported) {
      return this.renderEmailScreen()
    }
    return this.renderUnsupportedBrowser()
  }
}

EmailScreen.propTypes = {
  browserSupported: PropTypes.bool.isRequired,
  getTrustVaultPinChallenge: PropTypes.func.isRequired,
}

EmailScreen.contextTypes = {
  t: PropTypes.func,
}

module.exports = EmailScreen
