import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Fuse from 'fuse.js'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '../../text-field'

const generateFuseKeys = (keys) => {
  const weight = 1 / keys.length
  return keys.map((key) => ({ name: key, weight }))
}

export default class TokenSearch extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    onSearch: PropTypes.func,
    error: PropTypes.string,
    listToSearch: PropTypes.array.required,
    searchByKeys: PropTypes.arrayOf(PropTypes.string),
    fuseSearchKeys: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    error: null,
    searchByKeys: [{}],
    fuseSearchKeys: null,
  }

  fuse = new Fuse(this.props.listToSearch, {
    shouldSort: true,
    threshold: 0.1,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: this.props.fuseSearchKeys || generateFuseKeys(this.props.searchByKeys),
  })

  state = {
    searchQuery: '',
  }

  handleSearch (searchQuery) {
    this.setState({ searchQuery })
    const fuseSearchResult = this.fuse.search(searchQuery)
    this.props.onSearch({ searchQuery, results: fuseSearchResult })
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
