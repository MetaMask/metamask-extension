const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')

class ConnectScreen extends Component {
    constructor (props, context) {
        super(props)
    }

    renderUnsupportedBrowser () {
        return (
            h('div.new-account-connect-form.unsupported-browser', {}, [
                h('div.hw-connect', [
                    h('h3.hw-connect__title', {}, this.context.t('browserNotSupported')),
                    h('p.hw-connect__msg', {}, this.context.t('chromeRequiredForHardwareWallets')),
                ]),
                h(
                    'button.btn-primary.btn--large',
                    {
                      onClick: () => global.platform.openWindow({
                        url: 'https://google.com/chrome',
                      }),
                    },
                    this.context.t('downloadGoogleChrome')
                ),
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

    renderTrezorAffiliateLink () {
        return h('div.hw-connect__get-trezor', {}, [
            h('p.hw-connect__get-trezor__msg', {}, this.context.t(`dontHaveATrezorWallet`)),
            h('a.hw-connect__get-trezor__link', {
              href: 'https://shop.trezor.io/?a=metamask',
              target: '_blank',
            }, this.context.t('orderOneHere')),
          ])
    }

    renderConnectToTrezorButton () {
        return h(
            'button.btn-primary.btn--large',
            { onClick: this.props.connectToHardwareWallet.bind(this, 'trezor') },
            this.context.t('connectToTrezor')
        )
    }

    renderConnectToLedgerButton () {
        return h(
            'button.btn-primary.btn--large',
            { onClick: this.props.connectToHardwareWallet.bind(this, 'ledger') },
            this.context.t('connectToLedger')
        )
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
                this.renderConnectToTrezorButton(),
                this.renderConnectToLedgerButton(),
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
                this.renderConnectToLedgerButton(),
                this.renderConnectToTrezorButton(),
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

