import React, { Component } from 'react'
import PropTypes from 'prop-types'
import contractMapETH from 'eth-contract-metadata'
import contractMapPOA from 'poa-contract-metadata'
import Fuse from 'fuse.js'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '../../../../../ui/app/components/text-field'

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
    clearPendingTokens: PropTypes.func,
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
    const contractMap = newNetworkID === 1 ? contractMapETH : contractMapPOA
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
}
