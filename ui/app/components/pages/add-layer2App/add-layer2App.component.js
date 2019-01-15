import React, { Component } from 'react'
import ethUtil from 'ethereumjs-util'
import { DEFAULT_ROUTE, CONFIRM_ADD_LAYER2APP_ROUTE } from '../../../routes'
import TextField from '../../text-field'
import Layer2AppList from './layer2App-list'
import Layer2AppSearch from './layer2App-search'
import PageContainer from '../../page-container'
import { Tabs, Tab } from '../../tabs'

const { addPlugin } = require('../../../actions')

const SEARCH_TAB = 'SEARCH'
const CUSTOM_LAYER2APP_TAB = 'CUSTOM_LAYER2APP'

class AddLayer2App extends Component {

  constructor (props) {
    super(props)

    this.state = {
      customAuthorAddress: '',
      layer2AppSelectorError: null,
      displayedTab: CUSTOM_LAYER2APP_TAB,
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
      layer2AppSelectorError: null,
      autoFilled: false,
    })

  }

  renderCustomLayer2AppForm () {
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

  renderSearchLayer2App () {
    return (
      <div className="add-layer2App__search-layer2App">
        <Layer2AppSearch
        />
        <div className="add-layer2App__layer2App-list">
          <Layer2AppList
          />
        </div>
      </div>
    )
  }

  renderTabs () {
    return (
      <Tabs>
        <Tab name={'customPlugin'}>
          { this.renderCustomLayer2AppForm() }
        </Tab>
        <Tab name={'searchPlugins'}>
          { this.renderSearchLayer2App() }
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

export default AddLayer2App
