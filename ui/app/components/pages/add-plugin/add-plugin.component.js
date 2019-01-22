import React, { Component } from 'react'
import ethUtil from 'ethereumjs-util'
import { DEFAULT_ROUTE } from '../../../routes'
import TextField from '../../text-field'
import PageContainer from '../../page-container'
import { Tabs, Tab } from '../../tabs'

const { addPlugin } = require('../../../actions')

const CUSTOM_PLUGIN_TAB = 'CUSTOM_PLUGIN'

class AddPlugin extends Component {

  constructor (props) {
    super(props)

    this.state = {
      customAuthorAddress: '',
      displayedTab: CUSTOM_PLUGIN_TAB,
    }
  }

  handleNext () {
    const { history } = this.props
    const {
      customAuthorAddress,
    } = this.state

    const customPlugin = {
      authorAddress : customAuthorAddress
    }
    
    console.log("DEBUG NEXT ADD PLUGIN COMPONENT", customPlugin)

    addPlugin(customPlugin.authorAddress)
    
    history.push(DEFAULT_ROUTE)
  }

  handleCustomAuthorAddressChange (value) {
    const customAuthorAddress = value.trim()
    this.setState({
      customAuthorAddress,
      customAddressError: null,
      autoFilled: false,
    })

  }

  renderCustomPluginForm () {
    const {
      customAuthorAddress,
      customAddressError,
      autoFilled,
    } = this.state

    return (
      <div className="add-layer2App__custom-layer2App-form">
        <TextField
          id="custom-address"
          label={'pluginAuthorAddress'}
          type="text"
          value={customAuthorAddress}
          onChange={e => this.handleCustomAuthorAddressChange(e.target.value)}
          error={customAddressError}
          fullWidth
          margin="normal"
        />
      </div>
    )
  }


  renderTabs () {
    return (
      <Tabs>
        <Tab name={'customPlugin'}>
          { this.renderCustomPluginForm() }
        </Tab>
      </Tabs>
    )
  }

  render () {
    const { history } = this.props
    return (
      <PageContainer
        title={'addPlugin'}
        tabsComponent={this.renderTabs()}
      onSubmit={() => {
	this.handleNext()
      }}
      onCancel={() => {
          history.push(DEFAULT_ROUTE)
        }}
      />
    )
  }
}

export default AddPlugin
