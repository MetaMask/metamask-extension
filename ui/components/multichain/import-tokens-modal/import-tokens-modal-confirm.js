import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  getCurrentNetwork,
  getPendingTokens,
  getTestNetworkBackgroundColor,
  selectERC20TokensByChain,
} from '../../../selectors';
import {
  Text,
  Box,
  AvatarToken,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../component-library';
import {
  TextVariant,
  TextAlign,
  TextColor,
  FontWeight,
  Display,
  AlignItems,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import TokenBalance from '../../ui/token-balance/token-balance';
import { I18nContext } from '../../../contexts/i18n';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';

export const ImportTokensModalConfirm = ({ networkFilter }) => {
  const t = useContext(I18nContext);
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const pendingTokens = useSelector(getPendingTokens);
  const tokenListByChain = useSelector(selectERC20TokensByChain);
  const isCurrentNetworkSelected =
    Object.keys(networkFilter).length === 1 &&
    networkFilter[currentNetwork?.chainId];
  return (
    <Box paddingTop={6}>
      <Text textAlign={TextAlign.Center}>
        {Object.keys(pendingTokens).length === 1
          ? t('likeToImportToken')
          : t('likeToImportTokens')}
      </Text>
      <Box paddingTop={6}>
        <Box
          flexDirection={FlexDirection.Column}
          className="import-tokens-modal__confirmation-list"
        >
          {Object.entries(pendingTokens).map(([address, token]) => {
            const { name, symbol, iconUrl, chainId } = token;
            const tokenImage =
              iconUrl ||
              tokenListByChain?.[chainId]?.data[address.toLowerCase()]?.iconUrl;
            return (
              <Box key={address} padding={4} display={Display.Flex}>
                <Box
                  display={Display.Flex}
                  className="import-tokens-modal__confirm-token-list-item-wrapper"
                >
                  <BadgeWrapper
                    badge={
                      <AvatarNetwork
                        size={AvatarNetworkSize.Xs}
                        name={currentNetwork?.nickname}
                        src={
                          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                            pendingTokens[address]?.chainId
                          ]
                        }
                        backgroundColor={testNetworkBackgroundColor}
                        borderWidth={2}
                      />
                    }
                    marginRight={4}
                    marginTop={1}
                  >
                    <AvatarToken name={symbol} src={tokenImage} />
                  </BadgeWrapper>
                  <Box>
                    <Text
                      fontWeight={FontWeight.Medium}
                      variant={TextVariant.bodyMd}
                    >
                      {name || symbol}
                    </Text>
                    {isCurrentNetworkSelected ? (
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                      >
                        <TokenBalance token={token} displayZeroBalance />
                      </Text>
                    ) : null}
                  </Box>
                </Box>
                {isCurrentNetworkSelected ? (
                  <Box alignItems={AlignItems.flexStart}>
                    <TokenBalance
                      textProps={{
                        font: FontWeight.Medium,
                        variant: TextVariant.bodyLgMedium,
                      }}
                      suffixProps={{
                        font: FontWeight.Medium,
                        variant: TextVariant.bodyLgMedium,
                      }}
                      token={token}
                      showFiat
                    />
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

ImportTokensModalConfirm.propTypes = {
  networkFilter: PropTypes.object.isRequired,
};
