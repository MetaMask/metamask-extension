import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../components/ui/text-field';

export default class TokenSearch extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static defaultProps = {
    error: null,
  };

  static propTypes = {
    onSearch: PropTypes.func,
    error: PropTypes.string,
    tokenList: PropTypes.object,
  };

  state = {
    searchQuery: '',
  };

  constructor(props) {
    super(props);
    const { tokenList } = this.props;
    this.tokenList = Object.values(tokenList);
    this.tokenSearchFuse = new Fuse(this.tokenList, {
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
    });
  }

  handleSearch(searchQuery) {
    this.setState({ searchQuery });
    const fuseSearchResult = this.tokenSearchFuse.search(searchQuery);
    const addressSearchResult = this.tokenList.filter((token) => {
      return token.address.toLowerCase() === searchQuery.toLowerCase();
    });
    const results = [...addressSearchResult, ...fuseSearchResult];
    this.props.onSearch({ searchQuery, results });
  }

  renderAdornment() {
    return (
      <InputAdornment position="start" style={{ marginRight: '12px' }}>
        <img src="images/search.svg" width="17" height="17" alt="" />
      </InputAdornment>
    );
  }

  render() {
    const { error } = this.props;
    const { searchQuery } = this.state;

    return (
      <TextField
        id="search-tokens"
        placeholder={this.context.t('searchTokens')}
        type="text"
        value={searchQuery}
        onChange={(e) => this.handleSearch(e.target.value)}
        error={error}
        fullWidth
        autoFocus
        autoComplete="off"
        startAdornment={this.renderAdornment()}
      />
    );
  }
}
