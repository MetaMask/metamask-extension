const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
import Button from '../../../button'

class ConnectScreen extends Component {
    constructor (props, context) {
        super(props)
        this.state = {
          selectedDevice: null,
        }
    }

    connect = () => {
      if (this.state.selectedDevice) {
        this.props.connectToHardwareWallet(this.state.selectedDevice)
      }
      return null
    }

    renderConnectToTrezorButton () {
        return h(
            `button.hw-connect__btn${this.state.selectedDevice === 'trezor' ? '.selected' : ''}`,
            { onClick: _ => this.setState({selectedDevice: 'trezor'}) },
            h('img.hw-connect__btn__img', {
              src: 'images/trezor-logo.svg',
            })
        )
    }

    renderConnectToLedgerButton () {
        return h(
          `button.hw-connect__btn${this.state.selectedDevice === 'ledger' ? '.selected' : ''}`,
          { onClick: _ => this.setState({selectedDevice: 'ledger'}) },
            h('img.hw-connect__btn__img', {
              src: 'images/ledger-logo.svg',
            })
        )
    }

    renderButtons () {
      return (
        h('div', {}, [
          h('div.hw-connect__btn-wrapper', {}, [
            this.renderConnectToLedgerButton(),
            this.renderConnectToTrezorButton(),
          ]),
          h(Button, {
            type: 'confirm',
            large: true,
            className: 'hw-connect__connect-btn',
            onClick: this.connect,
            disabled: !this.state.selectedDevice,
          }, this.context.t('connect')),
        ])
      )
    }

    renderUnsupportedBrowser () {
        return (
            h('div.new-account-connect-form.unsupported-browser', {}, [
                h('div.hw-connect', [
                    h('h3.hw-connect__title', {}, this.context.t('browserNotSupported')),
                    h('p.hw-connect__msg', {}, this.context.t('chromeRequiredForHardwareWallets')),
                ]),
                h(Button, {
                  type: 'primary',
                  large: true,
                  onClick: () => global.platform.openWindow({
                    url: 'https://google.com/chrome',
                  }),
                }, this.context.t('downloadGoogleChrome')),
            ])
        )
    }

    renderHeader () {
        return (
            h('div.hw-connect__header', {}, [
                h('h3.hw-connect__header__title', {}, this.context.t(`hardwareWallets`)),
                h('p.hw-connect__header__msg', {}, this.context.t(`hardwareWalletsMsg`)),
            ])
        )
    }

    getAffiliateLinks () {
      const links = {
        trezor: `<a class='hw-connect__get-hw__link' href='https://shop.trezor.io/?a=metamask' target='_blank'>Trezor</a>`,
        ledger: `<a class='hw-connect__get-hw__link' href='https://www.ledger.com/products/ledger-nano-s?r=17c4991a03fa&tracker=MY_TRACKER' target='_blank'>Ledger</a>`,
      }

      const text = this.context.t('orderOneHere')
      const response = text.replace('Trezor', links.trezor).replace('Ledger', links.ledger)

      return h('div.hw-connect__get-hw__msg', { dangerouslySetInnerHTML: {__html: response }})
    }

    renderTrezorAffiliateLink () {
        return h('div.hw-connect__get-hw', {}, [
            h('p.hw-connect__get-hw__msg', {}, this.context.t(`dontHaveAHardwareWallet`)),
            this.getAffiliateLinks(),
          ])
    }


    scrollToTutorial = (e) => {
      if (this.referenceNode) this.referenceNode.scrollIntoView({behavior: 'smooth'})
    }

    renderLearnMore () {
        return (
            h('p.hw-connect__learn-more', {
                onClick: this.scrollToTutorial,
            }, [
                this.context.t('learnMore'),
                h('img.hw-connect__learn-more__arrow', { src: 'images/caret-right.svg'}),
            ])
        )
    }

    renderTutorialSteps () {
        const steps = [
            {
                asset: 'hardware-wallet-step-1',
                dimensions: {width: '225px', height: '75px'},
             },
             {
                asset: 'hardware-wallet-step-2',
                dimensions: {width: '300px', height: '100px'},
             },
             {
                asset: 'hardware-wallet-step-3',
                dimensions: {width: '120px', height: '90px'},
             },
        ]

        return h('.hw-tutorial', {
          ref: node => { this.referenceNode = node },
        },
            steps.map((step, i) => (
            h('div.hw-connect', {}, [
                h('h3.hw-connect__title', {}, this.context.t(`step${i + 1}HardwareWallet`)),
                h('p.hw-connect__msg', {}, this.context.t(`step${i + 1}HardwareWalletMsg`)),
                h('img.hw-connect__step-asset', { src: `images/${step.asset}.svg`, ...step.dimensions }),
            ])
            ))
        )
    }

    renderFooter () {
        return (
            h('div.hw-connect__footer', {}, [
                h('h3.hw-connect__footer__title', {}, this.context.t(`readyToConnect`)),
                this.renderButtons(),
                h('p.hw-connect__footer__msg', {}, [
                    this.context.t(`havingTroubleConnecting`),
                    h('a.hw-connect__footer__link', {
                        href: 'https://support.metamask.io/',
                        target: '_blank',
                      }, this.context.t('getHelp')),
                ]),
            ])
        )
    }

    renderConnectScreen () {
        return (
            h('div.new-account-connect-form', {}, [
                this.renderHeader(),
                this.renderButtons(),
                this.renderTrezorAffiliateLink(),
                this.renderLearnMore(),
                this.renderTutorialSteps(),
                this.renderFooter(),
            ])
        )
    }

    render () {
        if (this.props.browserSupported) {
            return this.renderConnectScreen()
        }
        return this.renderUnsupportedBrowser()
    }
}

ConnectScreen.propTypes = {
    connectToHardwareWallet: PropTypes.func.isRequired,
    browserSupported: PropTypes.bool.isRequired,
}

ConnectScreen.contextTypes = {
    t: PropTypes.func,
}

module.exports = ConnectScreen

