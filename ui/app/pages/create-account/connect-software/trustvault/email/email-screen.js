import { PureComponent } from 'react'
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
import Button from '../../../../../components/ui/button'
import TextField from '../../../../../components/ui/text-field'
import { CONNECT_HARDWARE_ROUTE } from '../../../../../helpers/constants/routes'
const ENTER_KEY = 13
class EmailScreen extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      email: null,
    }
    this.history = this.props.history
  }

  renderBackButton () {
    return h('div.sw-connect__back', { onClick: _ => this.history.push(CONNECT_HARDWARE_ROUTE)}, [
      h('div.sw-connect__list__back-caret', {},),
      h('div.sw-connect__list__back-caret__back', {}, this.context.t('back')),
    ])
  }

  renderNextButton () {
    return h(
      Button,
      {
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
      'div.sw-connect__email-field',
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
          },
        }),
      ]
    )
  }
  renderTrustVaultInfoBox () {
    return h('div.sw-connect__info-box',
      [
        h(`img.sw-connect__info-box__info-icon`, { src: 'images/tvInfo.png' }),
        h('div.sw-connect__info-box__not-user', this.context.t('trustVaultNotUser')),
        h('div.sw-connect__info-box__ios', this.context.t('trustVaultIos')),
        h('div.sw-connect__info-box__get-started', this.context.t('trustVaultGetStarted')),
        h('div.sw-connect__info-box__link', {
          onClick: () => {
            global.platform.openWindow({
              url: 'https://trustology.io/get-started/',
            })
          },
        }, this.context.t('here')),
      ]
    )
  }


  renderLearnMoreLink () {
    return h(
      'div.sw-connect__learn-more', {}, [
        h('span.sw-connect__learn-more__text', this.context.t('trustVaultLearnMore')),
        h('span.sw-connect__learn-more__link', {
          onClick: () => {
            global.platform.openWindow({
              url: 'https://help.trustology.io/en/',
            })
          },
        }, this.context.t('FAQ')),
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
        ),
      ]),
      h(
        Button,
        {
          type: 'primary',
          large: true,
          onClick: () =>
            global.platform.openWindow({
              url: 'https://google.com/chrome',
            }),
        },
        this.context.t('downloadGoogleChrome')
      ),
    ])
  }

  renderHeader () {
    return h('div.sw-connect__header', {}, [
      h(
        'h3.hw-connect__header__title',
        {},
        this.context.t(`trustVaultWelcome`)
      ),
      h('p.hw-connect__header__msg', {}, this.context.t(`trustVaultEnterEmail`)),
    ])
  }

  renderTrustVaultLogo () {
    return h(
      'div.sw-connect__trustvault-logo',
      [
        h('img.sw-connect__trustvault-logo__img', {
          src: 'images/trustvault-logo.png'
        }),
      ]
    )
  }

  renderEmailScreen () {
    return h('div.new-account-connect-form', {}, [
      this.renderBackButton(),
      this.renderTrustVaultLogo(),
      this.renderHeader(),
      this.renderEmailInputBox(),
      this.renderTrustVaultInfoBox(),
      this.renderNextButton(),
      this.renderLearnMoreLink(),
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
  history: PropTypes.object,
}

EmailScreen.contextTypes = {
  t: PropTypes.func,
}

module.exports = EmailScreen
