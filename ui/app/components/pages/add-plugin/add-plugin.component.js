import React, { Component } from 'react'
import { DEFAULT_ROUTE } from '../../../routes'
import TextField from '../../text-field'
import PageContainerContent from '../../page-container/page-container-content.component'
import Button from '../../button'

const { addPlugin } = require('../../../actions')
const ethUtil = require('ethereumjs-util')

const CUSTOM_PLUGIN_TAB = 'CUSTOM_PLUGIN'

class AddPlugin extends Component {

  constructor (props) {
    super(props)
    this.state = {
      pluginName: '',
      displayedTab: CUSTOM_PLUGIN_TAB,
    }
  }

  handleNext () {
    const { history } = this.props
    const {
      pluginName,
      personaPath
    } = this.state

    // compute plugin's uid based on ens hash of name
    console.log(ethUtil)
    const uid = ethUtil.sha3(pluginName).toString('hex')
    console.log(uid.toString())
    //"0x1111111111111111111111111111111111111111"
    // fetch metadata of plugin from ens
    const pluginAuthorAddress = "0x2"
    const scriptUrl = pluginName
    const customPlugin = {
      name: pluginName,
      uid,
      personaPath: personaPath,
      authorAddress: pluginAuthorAddress,
      scriptUrl,
    }
    addPlugin(customPlugin)
    history.push(DEFAULT_ROUTE)
  }

  handlePluginNameChange (value) {
    const pluginName = value.trim()
    this.setState({
      pluginName,
      pluginNameError: null,
    })

  }
  handlePluginPersonaPathChange (value) {
    const personaPath = value.trim()
    this.setState({
      personaPath,
      personaPathError: null,
    })

  }
  
  renderCustomPluginForm () {
    const {
      pluginName,
      pluginNameError,
      personaPath,
      personaPathError,
    } = this.state


    // Will resolve all from the plugin name through ENS
    return (
      <div className="add-plugin__custom-plugin-form">
        <TextField
          id="plugin-name"
          label={'pluginName ENS'}
          type="text"
          value={pluginName}
          onChange={e => this.handlePluginNameChange(e.target.value)}
          error={pluginNameError}
          fullWidth
          margin="normal"
        />
        <TextField
          id="plugin-persona-path"
          label={'personaPath'}
          type="text"
          value={personaPath}
          onChange={e => this.handlePluginPersonaPathChange(e.target.value)}
          error={personaPathError}
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
