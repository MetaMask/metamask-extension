import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { checkExistingAddresses } from '../../../helpers/utils/util';
import TokenListPlaceholder from './token-list-placeholder';

export default class TokenList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    tokens: PropTypes.array,
    results: PropTypes.array,
    selectedTokens: PropTypes.object,
    onToggleToken: PropTypes.func,
    useTokenDetection: PropTypes.bool,
  };

  render() {
    const {
      results = [],
      selectedTokens = {},
      onToggleToken,
      tokens = [],
      useTokenDetection,
    } = this.props;

    return results.length === 0 ? (
      <TokenListPlaceholder />
    ) : (
      <div className="token-list">
        <div className="token-list__title">
          {this.context.t('searchResults')}
        </div>
        <div className="token-list__tokens-container">
          {Array(6)
            .fill(undefined)
            .map((_, i) => {
              const { iconUrl, symbol, name, address } = results[i] || {};
              let iconPath = iconUrl;
              if (!process.env.TOKEN_DETECTION_V2) {
                /** TODO: Remove during TOKEN_DETECTION_V2 feature flag clean up */
                // token from dynamic api list is fetched when useTokenDetection is true
                iconPath = useTokenDetection
                  ? iconUrl
                  : `images/contract/${iconUrl}`;
              }
              const tokenAlreadyAdded = checkExistingAddresses(address, tokens);
              const onClick = () =>
                !tokenAlreadyAdded && onToggleToken(results[i]);

              return (
                Boolean(iconUrl || symbol || name) && (
                  <div
                    className={classnames('token-list__token', {
                      'token-list__token--selected': selectedTokens[address],
                      'token-list__token--disabled': tokenAlreadyAdded,
                    })}
                    onClick={onClick}
                    onKeyPress={(event) => event.key === 'Enter' && onClick()}
                    key={i}
                    tabIndex="0"
                  >
                    <div
                      className="token-list__token-icon"
                      style={{
                        backgroundImage: iconUrl && `url(${iconPath})`,
                      }}
                    />
                    <div className="token-list__token-data">
                      <span className="token-list__token-name">{`${name} (${symbol})`}</span>
                    </div>
                  </div>
                )
              );
            })}
        </div>
      </div>
    );
  }
}
