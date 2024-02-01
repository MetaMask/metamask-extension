import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
  getTokenList,
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
import { getPendingTokens } from '../../../ducks/metamask/metamask';
import TokenBalance from '../../ui/token-balance/token-balance';
import { I18nContext } from '../../../contexts/i18n';

export const ImportTokensModalConfirm = () => {
  const t = useContext(I18nContext);
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const pendingTokens = useSelector(getPendingTokens);
  const tokenList = useSelector(getTokenList);
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
            const { name, symbol, iconUrl } = token;
            const tokenImage =
              iconUrl || tokenList[address.toLowerCase()]?.iconUrl;
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
                        src={currentNetwork?.rpcPrefs?.imageUrl}
                        backgroundColor={testNetworkBackgroundColor}
                      />
                    }
                    marginRight={4}
                    marginTop={1}
                  >
                    <AvatarToken name={symbol} src={tokenImage} showHalo />
                  </BadgeWrapper>
                  <Box>
                    <Text
                      fontWeight={FontWeight.Medium}
                      variant={TextVariant.bodyMd}
                    >
                      {name || symbol}
                    </Text>
                    <Text
                      variant={TextVariant.bodySm}
                      color={TextColor.textAlternative}
                    >
                      <TokenBalance token={token} />
                    </Text>
                  </Box>
                </Box>
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
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
