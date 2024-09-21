import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { checkExistingAddresses } from '../../../../helpers/utils/util';
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
    currentNetwork: PropTypes.object,
    testNetworkBackgroundColor: PropTypes.object,
  };

  render() {
    const {
      results = [],
      selectedTokens = {},

      onToggleToken,
      tokens = [],
      currentNetwork,
      testNetworkBackgroundColor,
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
            {Array(12)
              .fill(undefined)
              .map((_, i) => {
                const { symbol, name, address } = results[i] || {};
                const tokenAlreadyAdded = checkExistingAddresses(
                  address,
                  tokens,
                );
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
                          marginRight={2}
                          onClick={onClick}
                        />

                        <Box>
                          <BadgeWrapper
                            badge={
                              <AvatarNetwork
                                size={AvatarNetworkSize.Xs}
                                name={currentNetwork?.nickname}
                                src={currentNetwork?.rpcPrefs?.imageUrl}
                                backgroundColor={testNetworkBackgroundColor}
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
