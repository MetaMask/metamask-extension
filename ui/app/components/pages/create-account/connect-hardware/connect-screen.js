const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')

export default class ConnectScreen extends Component {
    constructor (props, context) {
        super(props)
    }

    connectToTrezor = () => {
        if (this.props.connectToTrezor) {
            this.props.connectToTrezor()
        }
    }

    renderUnsupportedBrowser () {
        return (
            [
            h('div.hw-unsupported-browser', [
                h('h3.hw-unsupported-browser__title', {}, this.context.t('browserNotSupported')),
                h('p.hw-unsupported-browser__msg', {}, this.context.t('chromeRequiredForTrezor')),
            ]),
            h(
                'button.btn-primary.btn--large',
                { onClick: () => global.platform.openWindow({
                url: 'https://google.com/chrome',
                }), style: { margin: 12 } },
                this.context.t('downloadGoogleChrome')
            )]
        )
    }

    renderConnectButton () {
        return !this.state.accounts.length
          ? h(
              'button.btn-primary.btn--large',
              { onClick: this.connectToTrezor, style: { margin: 12 } },
              this.props.btnText
            )
          : null
      }

    render () {
        const isChrome = window.navigator.userAgent.search('Chrome') !== -1
        if (isChrome) {
            return this.renderConnectButton()
        } else {
            return this.renderUnsupportedBrowser()
        }
    }
}

ConnectScreen.propTypes = {
    connectToTrezor: PropTypes.func.isRequired,
    btnText: PropTypes.string,
}

ConnectScreen.contextTypes = {
    t: PropTypes.func,
}
