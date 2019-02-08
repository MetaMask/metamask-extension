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
    } = this.state

    const pluginUid = "0x1"
    const pluginAuthorAddress = "0x2"
    
    const customPlugin = {
      name : pluginName,
      uid: pluginUid,
      authorAddress: pluginAuthorAddress,
    }
    addPlugin(customPlugin)
    history.push(DEFAULT_ROUTE)
  }

  handlePluginNameChange (value) {
    const pluginName = value.trim()
    this.setState({
      pluginName,
      pluginNameError: null,
      autoFilled: false,
    })

  }
  
  renderCustomPluginForm () {
    const {
      pluginName,
      pluginNameError,
      autoFilled,
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
