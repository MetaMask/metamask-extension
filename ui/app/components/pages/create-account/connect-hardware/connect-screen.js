const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')

class ConnectScreen extends Component {
    constructor (props, context) {
        super(props)
    }

    renderUnsupportedBrowser () {
        return (
            h('div', {}, [
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
                ),
            ])
        )
    }

    renderConnectButton () {
        return h(
                    'button.btn-primary.btn--large',
                    { onClick: this.props.connectToTrezor.bind(this), style: { margin: 12 } },
                    this.props.btnText
                )
      }

    render () {
        const isChrome = window.navigator.userAgent.search('Chrome') !== -1
        if (isChrome) {
            return this.renderConnectButton()
        }
        return this.renderUnsupportedBrowser()
    }
}

ConnectScreen.propTypes = {
    connectToTrezor: PropTypes.func.isRequired,
    btnText: PropTypes.string,
}

ConnectScreen.contextTypes = {
    t: PropTypes.func,
}

module.exports = ConnectScreen

