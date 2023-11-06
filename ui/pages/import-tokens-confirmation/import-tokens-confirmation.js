import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { I18nContext } from '../../contexts/i18n';

import {
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
} from '../../selectors';
import {
  Text,
  Box,
  AvatarToken,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../components/component-library';
import {
  TextVariant,
  TextAlign,
  TextColor,
  FontWeight,
  Display,
  AlignItems,
} from '../../helpers/constants/design-system';
import { getPendingTokens } from '../../ducks/metamask/metamask';
import TokenBalance from '../../components/ui/token-balance/token-balance';

const ImportTokensConfirmation = () => {
  const t = useContext(I18nContext);
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const pendingTokens = useSelector(getPendingTokens);

  return (
    <Box paddingTop={4}>
      <Text textAlign={TextAlign.Center}>
        {Object.keys(pendingTokens).length === 1
          ? t('likeToImportToken')
          : t('likeToImportTokens')}
      </Text>
      <Box marginTop={12} className="scrollable">
        <Box display={Display.Flex} className="tokens-container banner">
          {Object.entries(pendingTokens).map(([address, token]) => {
            const { name, symbol, iconUrl } = token;
            return (
              <Box key={address} marginBottom={4} display={Display.Flex}>
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
                    marginRight={3}
                    marginTop={1}
                  >
                    <AvatarToken name={symbol} src={iconUrl} showHalo />
                  </BadgeWrapper>
                  <Box marginInlineStart={4}>
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
                <Box alignItems={AlignItems.flexStart}>
                  <TokenBalance token={token} />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default ImportTokensConfirmation;
