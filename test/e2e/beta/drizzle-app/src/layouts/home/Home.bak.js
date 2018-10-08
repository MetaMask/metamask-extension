import React, { Component } from 'react'
import PropTypes from 'prop-types'

class Home extends Component {
  constructor(props, context) {
    super(props)

    this.contracts = context.drizzle.contracts
    this.handleSetButton = this.handleSetButton.bind(this)
    this.handleSendTokens = this.handleSendTokens.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)

    this.state = {
      storageAmount: 0,
      tokenRecipientAddress: '',
      tokenTransferAmount: 0
    }
  }

  handleSetButton() {
    this.contracts.SimpleStorage.methods.set(this.state.storageAmount).send()
  }

  handleSendTokens() {
    this.contracts.TutorialToken.methods.transfer(this.state.tokenRecipientAddress, this.state.tokenTransferAmount).send()
  }

  handleInputChange(event) {
    this.setState({ [event.target.name]: event.target.value })
  }

  render() {
    // SimpleStorage Vars
    var storedData = this.props.drizzleStatus.initialized ? this.contracts.SimpleStorage.methods.storedData.data() : 'Loading...'

    // TutorialToken Vars
    var tokenSymbol = this.props.drizzleStatus.initialized ? this.contracts.TutorialToken.methods.symbol.data() : ''
    var tokenSupply = this.props.drizzleStatus.initialized ? this.contracts.TutorialToken.methods.totalSupply.data() : 'Loading...'
    var tokenBalance = this.props.drizzleStatus.initialized ? this.contracts.TutorialToken.methods.balanceOf.data(this.props.accounts[0]) : 'Loading...'

    return(
      <main className="container">
        <div className="pure-g">
          <div className="pure-u-1-1">
            <h1>Drizzle Examples</h1>
            <p>Here you'll find two example contract front-ends.</p>
          </div>

          <div className="pure-u-1-1">
            <h2>SimpleStorage</h2>
            <p><strong>Stored Value</strong>: {storedData}</p>
            <form className="pure-form pure-form-stacked">
              <input name="storageAmount" type="number" value={this.state.storageAmount} onChange={this.handleInputChange} />
              <button className="pure-button" type="button" onClick={this.handleSetButton}>Store Value of {this.state.storageAmount}</button>
            </form>

            <br/><br/>
          </div>

          <div className="pure-u-1-1">
            <h2>TutorialToken</h2>
            <p><strong>Total Supply</strong>: {tokenSupply} {tokenSymbol}</p>
            <p><strong>My Balance</strong>: {tokenBalance}</p>
            <h3>Send Tokens</h3>
            <form className="pure-form pure-form-stacked">
              <input name="tokenRecipientAddress" type="text" value={this.state.tokenRecipientAddress} onChange={this.handleInputChange} placeholder="Address" />
              <input name="tokenTransferAmount" type="number" value={this.state.tokenTransferAmount} onChange={this.handleInputChange} placeholder="Amount" />
              <button className="pure-button" type="button" onClick={this.handleSendTokens}>Send Tokens to {this.state.tokenRecipientAddress}</button>
            </form>
          </div>
        </div>
      </main>
    )
  }
}

Home.contextTypes = {
  drizzle: PropTypes.object
}

export default Home
