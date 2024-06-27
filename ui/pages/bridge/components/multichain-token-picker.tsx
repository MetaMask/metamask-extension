import React, { useState } from 'react';
import { ProviderConfig } from '@metamask/network-controller';
import {
  Box,
  Button,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextFieldSearch,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import ItemList from '../../swaps/searchable-item-list/item-list/item-list.component';
import { useTokensWithFiltering } from '../../../hooks/useTokensWithFiltering';
import { RPCDefinition } from '../../../../shared/constants/network';
import {
  SwapsTokenObject,
  TokenBucketPriority,
} from '../../../../shared/constants/swaps';

export const MultiChainTokenPicker = function ({
  selectedNetwork,
  selectedToken,
  networks,
  onTokenChange,
  onNetworkChange,
  tokens,
  topAssets,
  sortOrder,
}: {
  selectedToken?: SwapsTokenObject;
  onTokenChange: (token: SwapsTokenObject) => void;
  networks: (ProviderConfig | RPCDefinition)[];
  selectedNetwork: ProviderConfig | RPCDefinition | null;
  onNetworkChange: (networkConfig: ProviderConfig | RPCDefinition) => void;
  tokens: Record<string, SwapsTokenObject>;
  topAssets: { address: string }[];
  sortOrder: TokenBucketPriority;
}) {
  const t = useI18nContext();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useTokensWithFiltering<SwapsTokenObject>(
    searchQuery,
    tokens,
    topAssets,
    selectedNetwork?.chainId,
    sortOrder,
  );

  const onModalClose = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <Box className="multichain-asset-picker">
      <div className="multichain-asset-picker__asset">
        <Modal isOpen={isOpen} onClose={onModalClose}>
          <ModalOverlay />
          <ModalContent modalDialogProps={{ padding: 0 }}>
            <ModalHeader onClose={onModalClose}>
              <Text
                variant={TextVariant.headingSm}
                textAlign={TextAlign.Center}
              >
                {t('bridge')}
              </Text>
            </ModalHeader>
            <Box className="network-list" width={BlockSize.Full}>
              <Box
                style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
              >
                <Text>Select Network</Text>
                {networks.map((networkConfig) => {
                  const { nickname } = networkConfig;
                  return (
                    <Button
                      onClick={() => onNetworkChange(networkConfig)}
                      key={networkConfig.chainId}
                      variant={
                        selectedNetwork?.chainId === networkConfig.chainId
                          ? ButtonVariant.Primary
                          : ButtonVariant.Secondary
                      }
                    >
                      {nickname}
                    </Button>
                  );
                })}
              </Box>
            </Box>
            <Box className="list-with-search" width={BlockSize.Full}>
              <Box
                style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
              >
                <TextFieldSearch
                  id="multichain-asset-picker__asset-search"
                  marginBottom={4}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  clearButtonOnClick={() => setSearchQuery('')}
                  value={searchQuery}
                  placeholder={t('enterTokenNameOrAddress')}
                  inputProps={{ marginRight: 0 }}
                  className="list-with-search__text-search"
                  autoFocus
                />
              </Box>
              {filteredTokens?.length > 0 && (
                <ItemList
                  searchQuery={searchQuery}
                  results={filteredTokens}
                  onClickItem={(item) => {
                    onTokenChange(item);
                    setIsOpen(false);
                  }}
                />
              )}
            </Box>
          </ModalContent>
        </Modal>

        <Button onClick={() => setIsOpen(true)}>
          {selectedToken?.symbol ?? 'Select token'}
        </Button>
      </div>
      <div className="multichain-asset-picker__amount"></div>
    </Box>
  );
};
