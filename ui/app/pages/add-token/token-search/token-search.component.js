import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Fuse from 'fuse.js'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '../../../components/ui/text-field'

let fuse

const mapStateToProps = ({ metamask }) => {
  const contractMap = metamask.trustedTokenMap || {}
  const contractList = Object.entries(contractMap)
    .map(([_, tokenData]) => tokenData)
    .filter((tokenData) => Boolean(tokenData.erc20))

  return {
    contractList,
  }
}

class TokenSearch extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    error: null,
  }

  static propTypes = {
    onSearch: PropTypes.func,
    error: PropTypes.string,
    contractList: PropTypes.array,
  }

  state = {
    searchQuery: '',
  }

  componentWillUnmount () {
    fuse = null
  }

  handleSearch (searchQuery) {
    const { contractList } = this.props
    this.setState({ searchQuery })
    const fuseSearchResult = fuse.search(searchQuery)
    const addressSearchResult = contractList.filter((token) => {
      return token.address.toLowerCase() === searchQuery.toLowerCase()
    })
    const results = [...addressSearchResult, ...fuseSearchResult]
    this.props.onSearch({ searchQuery, results })
  }

  renderAdornment () {
    return (
      <InputAdornment position="start" style={{ marginRight: '12px' }}>
        <img src="images/search.svg" />
      </InputAdornment>
    )
  }

  render () {
    const { error, contractList } = this.props
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

    const { searchQuery } = this.state

    return (
      <TextField
        id="search-tokens"
        placeholder={this.context.t('searchTokens')}
        type="text"
        value={searchQuery}
        onChange={(e) => this.handleSearch(e.target.value)}
        error={error}
        fullWidth
        startAdornment={this.renderAdornment()}
      />
    )
  }
}

export default connect(mapStateToProps)(TokenSearch)
