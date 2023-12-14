import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { TextFieldSearch } from '../../../component-library/text-field-search/deprecated';
import { BlockSize, Size } from '../../../../helpers/constants/design-system';

export default class TokenSearch extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static defaultProps = {
    error: null,
    searchClassName: undefined,
  };

  static propTypes = {
    onSearch: PropTypes.func,
    error: PropTypes.string,
    tokenList: PropTypes.object,
    searchClassName: PropTypes.string,
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

  clear() {
    this.setState({ searchQuery: '' });
  }

  render() {
    const { error } = this.props;
    const { searchQuery } = this.state;
    const { searchClassName } = this.props;

    return (
      <TextFieldSearch
        className={searchClassName}
        placeholder={this.context.t('searchTokens')}
        value={searchQuery}
        onChange={(e) => this.handleSearch(e.target.value)}
        error={error}
        autoFocus
        autoComplete={false}
        width={BlockSize.Full}
        clearButtonOnClick={() => this.clear()}
        clearButtonProps={{
          size: Size.SM,
        }}
      />
    );
  }
}
