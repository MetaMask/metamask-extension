import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  checkExistingAllTokens,
  checkExistingAddresses,
} from '../../../../helpers/utils/util';
import {
  Box,
  Text,
  AvatarToken,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
  Checkbox,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  TextColor,
  TextVariant,
  FontWeight,
  FlexDirection,
  FlexWrap,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import TokenListPlaceholder from './token-list-placeholder';

export default class TokenList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    tokens: PropTypes.array,
    allTokens: PropTypes.object,
    results: PropTypes.array,
    selectedTokens: PropTypes.object,
    onToggleToken: PropTypes.func,
    currentNetwork: PropTypes.object,
    testNetworkBackgroundColor: PropTypes.object,
    isTokenNetworkFilterEqualCurrentNetwork: PropTypes.bool,
    accountAddress: PropTypes.string,
  };

  render() {
    const {
      results = [],
      selectedTokens = {},

      onToggleToken,
      tokens = [],
      allTokens = {},
      accountAddress,
      currentNetwork,
      testNetworkBackgroundColor,
      isTokenNetworkFilterEqualCurrentNetwork,
    } = this.props;

    return (
      <Box className="token-list">
        {results.length === 0 ? (
          <Box
            paddingLeft={4}
            paddingRight={4}
            className="token-list__empty-list"
          >
            <TokenListPlaceholder />
          </Box>
        ) : (
          <Box
            className="token-list__tokens-container"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            {Array(Math.min(12, results.length))
              .fill(undefined)
              .map((_, i) => {
                const { symbol, name, address, chainId } = results[i] || {};
                let tokenAlreadyAdded = false;
                if (isTokenNetworkFilterEqualCurrentNetwork) {
                  tokenAlreadyAdded = checkExistingAddresses(address, tokens);
                  results[i].chainId = currentNetwork?.chainId;
                } else {
                  tokenAlreadyAdded = checkExistingAllTokens(
                    address,
                    chainId,
                    accountAddress,
                    allTokens,
                  );
                }

                const onClick = () =>
                  !tokenAlreadyAdded && onToggleToken(results[i]);
                return (
                  Boolean(results[i]?.iconUrl || symbol || name) && (
                    <Box
                      key={address}
                      display={Display.Flex}
                      alignItems={AlignItems.center}
                      flexDirection={FlexDirection.Row}
                      flexWrap={FlexWrap.NoWrap}
                      paddingLeft={4}
                      paddingRight={4}
                      paddingTop={2}
                      paddingBottom={2}
                      backgroundColor={
                        selectedTokens[address]
                          ? BackgroundColor.primaryMuted
                          : BackgroundColor.transparent
                      }
                      className={classnames('token-list__token_component', {
                        'token-list__token_component--disabled':
                          tokenAlreadyAdded,
                      })}
                      onClick={onClick}
                    >
                      <Box
                        display={Display.Flex}
                        alignItems={AlignItems.center}
                      >
                        <Checkbox
                          isChecked={
                            selectedTokens[address] || tokenAlreadyAdded
                          }
                          marginRight={4}
                          onClick={onClick}
                        />

                        <Box>
                          <BadgeWrapper
                            badge={
                              <AvatarNetwork
                                size={AvatarNetworkSize.Xs}
                                name={currentNetwork?.nickname}
                                src={
                                  isTokenNetworkFilterEqualCurrentNetwork
                                    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                                        currentNetwork?.chainId
                                      ]
                                    : CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                                        results[i]?.chainId
                                      ]
                                }
                                backgroundColor={testNetworkBackgroundColor}
                                borderWidth={2}
                                className="token-list__token_component__network-badge"
                              />
                            }
                            marginRight={4}
                            marginTop={1}
                          >
                            <AvatarToken
                              name={symbol}
                              src={results[i]?.iconUrl}
                            />
                          </BadgeWrapper>
                        </Box>
                        <Box>
                          <Text
                            fontWeight={FontWeight.Medium}
                            variant={TextVariant.bodyMd}
                          >
                            {name}
                          </Text>
                          <Text
                            variant={TextVariant.bodySm}
                            color={TextColor.textAlternative}
                          >
                            {symbol}
                          </Text>
                        </Box>
                      </Box>
                    </Box>
                  )
                );
              })}
          </Box>
        )}
      </Box>
    );
  }
}
