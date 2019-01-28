import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../../ui/app/components/button'
import { LEDGER, TREZOR } from './enum'
import { capitalizeFirstLetter } from '../../../../app/scripts/lib/util'

const trezorCap = capitalizeFirstLetter(TREZOR)
const ledgerCap = capitalizeFirstLetter(LEDGER)

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
        return (
            <button
                className={`hw-connect__btn${this.state.selectedDevice === TREZOR ? ' selected' : ''}`}
                onClick={_ => this.setState({selectedDevice: TREZOR})}
            >
                <img className="hw-connect__btn__img" src="images/trezor-logo.svg"/>
            </button>
        )
    }

    renderConnectToLedgerButton () {
        return (
            <button
                className={`hw-connect__btn${this.state.selectedDevice === LEDGER ? ' selected' : ''}`}
                onClick={_ => this.setState({selectedDevice: LEDGER})}
            >
                <img className="hw-connect__btn__img" src="images/ledger-logo.svg"/>
            </button>
        )
    }

    renderButtons () {
        return (
            <div>
                <div className="hw-connect__btn-wrapper">
                    {this.renderConnectToLedgerButton()}
                    {this.renderConnectToTrezorButton()}
                </div>
                <button
                    className={`hw-connect__connect-btn${!this.state.selectedDevice ? ' disabled' : ''}`}
                    onClick={this.connect}
                >Connect</button>
            </div>
        )
    }

    renderUnsupportedBrowser () {
        return (
            <div className="new-account-connect-form unsupported-browser">
                <div className="hw-connect">
                    <h3 className="hw-connect__title">Your Browser is not supported...</h3>
                    <p className="hw-connect__msg">You need to use Nifty Wallet on Google Chrome in order to connect to your Hardware Wallet.</p>
                </div>
                <Button
                    type="primary"
                    large={true}
                    onClick={() => global.platform.openWindow({
                        url: 'https://google.com/chrome',
                    })}
                >Download Google Chrome</Button>
            </div>
        )
    }

    renderHeader () {
        return (
            <div className="hw-connect__header">
                <p className="hw-connect__header__msg">{`Select a hardware wallet you'd like to use with Nifty Wallet`}</p>
            </div>
        )
    }

    getAffiliateLinks () {
        const links = {
            trezor: `<a class='hw-connect__get-hw__link' href='https://shop.trezor.io/?a=niftywallet' target='_blank'>${trezorCap}</a>`,
            ledger: `<a class='hw-connect__get-hw__link' href='https://www.ledger.com/products/ledger-nano-s' target='_blank'>${ledgerCap}</a>`,
        }

        const text = `Order a ${trezorCap} or ${ledgerCap} and keep your funds in cold storage`
        const response = text.replace(trezorCap, links.trezor).replace(ledgerCap, links.ledger)

        return (
            <div className="hw-connect__get-hw__msg" dangerouslySetInnerHTML={{ __html: response }} />
        )
    }

    renderTrezorAffiliateLink () {
        return (
            <div className="hw-connect__get-hw">
                <p className="hw-connect__get-hw__msg">Don’t have a hardware wallet?</p>
                {this.getAffiliateLinks()}
            </div>
        )
    }


    scrollToTutorial = (e) => {
      if (this.referenceNode) this.referenceNode.scrollIntoView({behavior: 'smooth'})
    }

    renderConnectScreen () {
        return (
            <div className="new-account-connect-form">
                {this.renderHeader()}
                {this.renderButtons()}
                {this.renderTrezorAffiliateLink()}
            </div>
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

module.exports = ConnectScreen

