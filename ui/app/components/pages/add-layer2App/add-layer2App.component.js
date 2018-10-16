import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import { checkExistingAddresses } from './util'
import { layer2AppInfoGetter } from '../../../layer2App-util'
import { DEFAULT_ROUTE, CONFIRM_ADD_LAYER2APP_ROUTE } from '../../../routes'
import TextField from '../../text-field'
import Layer2AppList from './layer2App-list'
import Layer2AppSearch from './layer2App-search'
import PageContainer from '../../page-container'
import { Tabs, Tab } from '../../tabs'

const emptyAddr = '0x0000000000000000000000000000000000000000'
const SEARCH_TAB = 'SEARCH'
const CUSTOM_LAYER2APP_TAB = 'CUSTOM_LAYER2APP'

class AddLayer2App extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    setPendingLayer2Apps: PropTypes.func,
    pendingLayer2Apps: PropTypes.object,
    clearPendingLayer2Apps: PropTypes.func,
    layer2Apps: PropTypes.array,
    identities: PropTypes.object,
  }

  constructor (props) {
    super(props)

    this.state = {
      customAddress: '',
      customSymbol: '',
      customDecimals: 0,
      searchResults: [],
      selectedLayer2Apps: {},
      layer2AppSelectorError: null,
      customAddressError: null,
      customSymbolError: null,
      customDecimalsError: null,
      autoFilled: false,
      displayedTab: SEARCH_TAB,
    }
  }

  componentDidMount () {
    this.layer2AppInfoGetter = layer2AppInfoGetter()
    const { pendingLayer2Apps = {} } = this.props
    const pendingLayer2AppsKeys = Object.keys(pendingLayer2Apps)

    if (pendingLayer2AppsKeys.length > 0) {
      let selectedLayer2Apps = {}
      let customLayer2App = {}

      pendingLayer2AppsKeys.forEach(layer2AppAddress => {
        const layer2App = pendingLayer2Apps[layer2AppAddress]
        const { isCustom } = layer2App

        if (isCustom) {
          customLayer2App = { ...layer2App }
        } else {
          selectedLayer2Apps = { ...selectedLayer2Apps, [layer2AppAddress]: { ...layer2App } }
        }
      })

      const {
        address: customAddress = '',
        symbol: customSymbol = '',
        decimals: customDecimals = 0,
      } = customLayer2App

      const displayedTab = Object.keys(selectedLayer2Apps).length > 0 ? SEARCH_TAB : CUSTOM_LAYER2APP_TAB
      this.setState({ selectedLayer2Apps, customAddress, customSymbol, customDecimals, displayedTab })
    }
  }

  handleToggleLayer2App (layer2App) {
    const { address } = layer2App
    const { selectedLayer2Apps = {} } = this.state
    const selectedLayer2AppsCopy = { ...selectedLayer2Apps }

    if (address in selectedLayer2Apps) {
      delete selectedLayer2Apps[address]
    } else {
      selectedLayer2AppsCopy[address] = layer2App
    }

    this.setState({
      selectedLayer2Apps: selectedLayer2Apps,
      layer2AppSelectorError: null,
    })
  }

  hasError () {
    const {
      layer2AppSelectorError,
      customAddressError,
      customSymbolError,
      customDecimalsError,
    } = this.state

    return layer2AppSelectorError || customAddressError || customSymbolError || customDecimalsError
  }

  hasSelected () {
    const { customAddress = '', selectedLayer2Apps = {} } = this.state
    return customAddress || Object.keys(selectedLayer2Apps).length > 0
  }

  handleNext () {
    
    if (this.hasError()) {
      return
    }

    if (!this.hasSelected()) {
      this.setState({ layer2AppSelectorError: this.context.t('mustSelectOne') })
      return
    }

    const { setPendingLayer2Apps, history } = this.props
    const {
      customAddress: address,
      customSymbol: symbol,
      customDecimals: decimals,
      selectedLayer2Apps,
    } = this.state

    const customLayer2App = {
      address,
      symbol,
      decimals,
    }

    setPendingLayer2Apps({ customLayer2App, selectedLayer2Apps })
    console.log("HEREHEREHEREHEREHERHEREH")
    history.push(CONFIRM_ADD_LAYER2APP_ROUTE)
  }

  async attemptToAutoFillLayer2AppParams (address) {
    const { symbol = '', decimals = 0 } = await this.layer2AppInfoGetter(address)

    const autoFilled = Boolean(symbol && decimals)
    this.setState({ autoFilled })
    this.handleCustomSymbolChange(symbol || '')
    this.handleCustomDecimalsChange(decimals)
  }

  handleCustomAddressChange (value) {
    const customAddress = value.trim()
    this.setState({
      customAddress,
      customAddressError: null,
      layer2AppSelectorError: null,
      autoFilled: false,
    })

    const isValidAddress = ethUtil.isValidAddress(customAddress)
    const standardAddress = ethUtil.addHexPrefix(customAddress).toLowerCase()

    switch (true) {
      case !isValidAddress:
        this.setState({
          customAddressError: this.context.t('invalidAddress'),
          customSymbol: '',
          customDecimals: 0,
          customSymbolError: null,
          customDecimalsError: null,
        })

        break
      case Boolean(this.props.identities[standardAddress]):
        this.setState({
          customAddressError: this.context.t('personalAddressDetected'),
        })

        break
      case checkExistingAddresses(customAddress, this.props.layer2Apps):
        this.setState({
          customAddressError: this.context.t('layer2AppAlreadyAdded'),
        })

        break
      default:
        if (customAddress !== emptyAddr) {
          this.attemptToAutoFillLayer2AppParams(customAddress)
        }
    }
  }

  handleCustomSymbolChange (value) {
    const customSymbol = value.trim()
    const symbolLength = customSymbol.length
    let customSymbolError = null

    if (symbolLength <= 0 || symbolLength >= 10) {
      customSymbolError = this.context.t('symbolBetweenZeroTen')
    }

    this.setState({ customSymbol, customSymbolError })
  }

  handleCustomDecimalsChange (value) {
    const customDecimals = value.trim()
    const validDecimals = customDecimals !== null &&
      customDecimals !== '' &&
      customDecimals >= 0 &&
      customDecimals <= 36
    let customDecimalsError = null

    if (!validDecimals) {
      customDecimalsError = this.context.t('decimalsMustZerotoTen')
    }

    this.setState({ customDecimals, customDecimalsError })
  }

  renderCustomLayer2AppForm () {
    const {
      customAddress,
      customSymbol,
      customDecimals,
      customAddressError,
      customSymbolError,
      customDecimalsError,
      autoFilled,
    } = this.state

    return (
      <div className="add-layer2App__custom-layer2App-form">
        <TextField
          id="custom-address"
          label={this.context.t('layer2AppAddress')}
          type="text"
          value={customAddress}
          onChange={e => this.handleCustomAddressChange(e.target.value)}
          error={customAddressError}
          fullWidth
          margin="normal"
        />
        <TextField
          id="custom-symbol"
          label={this.context.t('layer2AppSymbol')}
          type="text"
          value={customSymbol}
          onChange={e => this.handleCustomSymbolChange(e.target.value)}
          error={customSymbolError}
          fullWidth
          margin="normal"
          disabled={autoFilled}
        />
        <TextField
          id="custom-decimals"
          label={this.context.t('decimal')}
          type="number"
          value={customDecimals}
          onChange={e => this.handleCustomDecimalsChange(e.target.value)}
          error={customDecimalsError}
          fullWidth
          margin="normal"
          disabled={autoFilled}
        />
      </div>
    )
  }

  renderSearchLayer2App () {
    const { layer2AppSelectorError, selectedLayer2Apps, searchResults } = this.state

    return (
      <div className="add-layer2App__search-layer2App">
        <Layer2AppSearch
          onSearch={({ results = [] }) => this.setState({ searchResults: results })}
          error={layer2AppSelectorError}
        />
        <div className="add-layer2App__layer2App-list">
          <Layer2AppList
            results={searchResults}
            selectedLayer2Apps={selectedLayer2Apps}
            onToggleLayer2App={layer2App => this.handleToggleLayer2App(layer2App)}
          />
        </div>
      </div>
    )
  }

  renderTabs () {
    return (
      <Tabs>
        <Tab name={this.context.t('search')}>
          { this.renderSearchLayer2App() }
        </Tab>
        <Tab name={this.context.t('customLayer2App')}>
          { this.renderCustomLayer2AppForm() }
        </Tab>
      </Tabs>
    )
  }

  render () {
    const { history, clearPendingLayer2Apps } = this.props
    return (
      <PageContainer
        title={this.context.t('addLayer2App')}
        tabsComponent={this.renderTabs()}
      onSubmit={() => {console.log("DEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUGDEBUG")
		       this.handleNext()}}
        disabled={this.hasError() || !this.hasSelected()}
        onCancel={() => {
          clearPendingLayer2Apps()
          history.push(DEFAULT_ROUTE)
        }}
      />
    )
  }
}

export default AddLayer2App
