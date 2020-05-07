import React, { Component } from 'react'
import PropTypes from 'prop-types'
import contractMapETH from 'eth-contract-metadata'
import contractMapPOA from 'poa-contract-metadata'
import contractMapRSK from '@rsksmart/rsk-contract-metadata'
import contractMapRSKTest from '@rsksmart/rsk-testnet-contract-metadata'
import Fuse from 'fuse.js'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '../../../../../ui/app/components/text-field'
import { MAINNET_CODE, POA_CODE, RSK_CODE, RSK_TESTNET_CODE } from '../../../../../app/scripts/controllers/network/enums'

let contractList

let fuse

export default class TokenSearch extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    error: null,
  }

  static propTypes = {
    network: PropTypes.string,
    onSearch: PropTypes.func,
    error: PropTypes.string,
  }

  constructor (props) {
    super(props)

    this.state = {
      searchQuery: '',
    }

    const networkID = parseInt(props.network)
    this.updateContractList(networkID)
  }

  handleSearch (searchQuery) {
    this.setState({ searchQuery })
    const fuseSearchResult = fuse.search(searchQuery)
    const addressSearchResult = contractList.filter(token => {
      return token.address.toLowerCase() === searchQuery.toLowerCase()
    })
    const results = [...addressSearchResult, ...fuseSearchResult]
    this.props.onSearch({ searchQuery, results })
  }

  componentWillUpdate (nextProps) {
    const {
      network: oldNet,
    } = this.props
    const {
      network: newNet,
    } = nextProps

    if (oldNet !== newNet) {
      const newNetworkID = parseInt(newNet)
      this.updateContractList(newNetworkID)
      this.setState({ searchQuery: '' })
      this.props.onSearch({ searchQuery: '', results: [] })
    }
  }

  updateContractList (newNetworkID) {
    const contractMap = this._getContractMap(newNetworkID)
    contractList = Object.entries(contractMap)
      .map(([ _, tokenData]) => tokenData)
      .filter(tokenData => Boolean(tokenData.erc20))

    fuse = new Fuse(contractList, {
      shouldSort: true,
      threshold: 0.45,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'symbol', weight: 0.5 },
      ],
    })
  }

  renderAdornment () {
    return (
      <InputAdornment
        position="start"
        style={{ marginRight: '12px' }}
      >
        <img src="images/search.svg" />
      </InputAdornment>
    )
  }

  render () {
    const { error } = this.props
    const { searchQuery } = this.state

    return (
      <TextField
        id="search-tokens"
        placeholder={'Search Tokens' /* this.context.t('searchTokens')*/}
        type="text"
        value={searchQuery}
        onChange={e => this.handleSearch(e.target.value)}
        error={error}
        fullWidth
        startAdornment={this.renderAdornment()}
      />
    )
  }

  _getContractMap (networkID) {
    switch (networkID) {
      case MAINNET_CODE:
        return contractMapETH
      case POA_CODE:
        return contractMapPOA
      case RSK_CODE:
        return contractMapRSK
      case RSK_TESTNET_CODE:
        return contractMapRSKTest
      default:
        return contractMapPOA
    }
  }
}
