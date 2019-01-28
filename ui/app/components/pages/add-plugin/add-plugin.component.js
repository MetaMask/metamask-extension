import React, { Component } from 'react'
import { DEFAULT_ROUTE } from '../../../routes'
import TextField from '../../text-field'
import PageContainerContent from '../../page-container/page-container-content.component'
import Button from '../../button'

const { addPlugin } = require('../../../actions')

const CUSTOM_PLUGIN_TAB = 'CUSTOM_PLUGIN'

class AddPlugin extends Component {

  constructor (props) {
    super(props)
    this.state = {
      pluginAuthorAddress: '',
      pluginName: '',
      pluginScriptUrl: '',
      displayedTab: CUSTOM_PLUGIN_TAB,
    }
  }

  handleNext () {
    const { history } = this.props
    const {
      pluginAuthorAddress,
      pluginName,
      pluginScriptUrl,
    } = this.state

    const customPlugin = {
      authorAddress : pluginAuthorAddress,
      name : pluginName,
      scriptUrl : pluginScriptUrl
    }
    
    console.log("DEBUG NEXT ADD PLUGIN COMPONENT", customPlugin)

    addPlugin(customPlugin.authorAddress, customPlugin.name, customPlugin.scriptUrl)
    
    history.push(DEFAULT_ROUTE)
  }

  handlePluginAuthorAddressChange (value) {
    const pluginAuthorAddress = value.trim()
    this.setState({
      pluginAuthorAddress,
      pluginAuthorAddressError: null,
      autoFilled: false,
    })

  }

  handlePluginNameChange (value) {
    const pluginName = value.trim()
    this.setState({
      pluginName,
      pluginNameError: null,
      autoFilled: false,
    })

  }

  handlePluginScriptUrlChange (value) {
    const pluginScriptUrl = value.trim()
    this.setState({
      pluginScriptUrl,
      pluginScriptUrlError: null,
      autoFilled: false,
    })
  }
  
  renderCustomPluginForm () {
    const {
      pluginAuthorAddress,
      pluginAuthorAddressError,
      pluginName,
      pluginNameError,
      pluginScriptUrl,
      pluginScriptUrlError,
      autoFilled,
    } = this.state


    // For now all value have a field
    // We will implement the plugin registrar afterwards
    // Will resolve all from the first field (author address)
    return (
      <div className="add-plugin__custom-plugin-form">
        <TextField
          id="plugin-author-address"
          label={'pluginAuthorAddress'}
          type="text"
          value={pluginAuthorAddress}
          onChange={e => this.handlePluginAuthorAddressChange(e.target.value)}
          error={pluginAuthorAddressError}
          fullWidth
          margin="normal"
        />
        <TextField
          id="plugin-name"
          label={'pluginName'}
          type="text"
          value={pluginName}
          onChange={e => this.handlePluginNameChange(e.target.value)}
          error={pluginNameError}
          fullWidth
          margin="normal"
        />
        <TextField
          id="plugin-script-url"
          label={'pluginScriptUrl'}
          type="text"
          value={pluginScriptUrl}
          onChange={e => this.handlePluginScriptUrlChange(e.target.value)}
          error={pluginScriptUrlError}
          fullWidth
          margin="normal"
        />
      </div>
    )
  }


  render () {
    const { history } = this.props
    return (
	<PageContainerContent>
	<div>
	<br/>
	<br/>	
	Custom Form - Add plugin:
	</div>
	{ this.renderCustomPluginForm() }
	<div>
	<Button
      type="primary"
      className="pluginApp-view__button"
      onClick={() => this.handleNext()}
        >
	Add Plugin
	</Button>
	</div>      
      </PageContainerContent>	
    )
  }
}

export default AddPlugin
