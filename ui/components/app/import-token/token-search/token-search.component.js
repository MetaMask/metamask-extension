import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { TextFieldSearch } from '../../../component-library';
import { BlockSize } from '../../../../helpers/constants/design-system';

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
      return (
        token.address &&
        searchQuery &&
        isEqualCaseInsensitive(token.address, searchQuery)
      );
    });
    const results = [...addressSearchResult, ...fuseSearchResult];
    this.props.onSearch({ searchQuery, results });
  }

  render() {
    const { error } = this.props;
    const { searchQuery } = this.state;

    return (
      <TextFieldSearch
        placeholder={this.context.t('search')}
        value={searchQuery}
        onChange={(e) => this.handleSearch(e.target.value)}
        error={error}
        autoFocus
        autoComplete={false}
        width={BlockSize.Full}
      />
    );
  }
}
