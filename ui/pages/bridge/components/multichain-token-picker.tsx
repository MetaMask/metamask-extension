import React, { useState } from 'react';
import { ProviderConfig } from '@metamask/network-controller';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  PickerNetwork,
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
import SelectedToken from '../../swaps/selected-token/selected-token';
import { NetworkListItem } from '../../../components/multichain';

const MAX_TOKEN_LIST_ITEMS = 30;

export const MultiChainTokenPicker = function ({
  dataTestId,
  selectedNetwork,
  selectedToken,
  networks,
  onTokenChange,
  onNetworkChange,
  tokens,
  topAssets,
  sortOrder,
  header,
}: {
  dataTestId?: string;
  selectedToken?: SwapsTokenObject;
  onTokenChange: (token: SwapsTokenObject) => void;
  networks: (ProviderConfig | RPCDefinition)[];
  selectedNetwork: ProviderConfig | RPCDefinition | null;
  onNetworkChange: (networkConfig: ProviderConfig | RPCDefinition) => void;
  tokens: Record<string, SwapsTokenObject>;
  topAssets: { address: string }[];
  sortOrder: TokenBucketPriority;
  header: string;
}) {
  const t = useI18nContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingNetwork, setIsSelectingNetwork] = useState(false);
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
    setIsSelectingNetwork(false);
  };

  return (
    <Box className="multichain-asset-picker">
      <div className="multichain-asset-picker__network">
        <Modal isOpen={isSelectingNetwork} onClose={onModalClose}>
          <ModalOverlay />
          <ModalContent modalDialogProps={{ padding: 0 }}>
            <ModalHeader
              onBack={() => {
                setIsSelectingNetwork(false);
                setIsOpen(true);
              }}
              onClose={onModalClose}
            >
              {t('bridgeSelectNetwork')}
            </ModalHeader>
            <Box className="multichain-asset-picker__network-list">
              <Box
                style={{
                  gridColumnStart: 1,
                  gridColumnEnd: 3,
                }}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                height={BlockSize.Full}
              >
                {networks.map((networkConfig) => {
                  const { nickname } = networkConfig;
                  return (
                    <NetworkListItem
                      name={nickname ?? networkConfig.chainId}
                      selected={
                        selectedNetwork?.chainId === networkConfig.chainId
                      }
                      onClick={() => {
                        onNetworkChange(networkConfig);
                        setIsSelectingNetwork(false);
                        setIsOpen(true);
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </ModalContent>
        </Modal>
      </div>

      <div className="multichain-asset-picker__asset">
        <Modal isOpen={isOpen} onClose={onModalClose}>
          <ModalOverlay />
          <ModalContent modalDialogProps={{ padding: 0 }}>
            <ModalHeader onClose={onModalClose}>
              <Text
                variant={TextVariant.headingSm}
                textAlign={TextAlign.Center}
              >
                {header}
              </Text>
            </ModalHeader>
            <PickerNetwork
              label={selectedNetwork?.nickname ?? 'Select network'}
              src={selectedNetwork?.rpcPrefs?.imageUrl}
              onClick={() => {
                setIsOpen(false);
                setIsSelectingNetwork(true);
              }}
              data-testid="multichain-asset-picker__network"
            />
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
                  placeholder={t('enterToken')}
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
                  maxListItems={MAX_TOKEN_LIST_ITEMS}
                />
              )}
            </Box>
          </ModalContent>
        </Modal>

        <SelectedToken
          onClick={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          selectedToken={selectedToken ?? {}}
          testId={dataTestId}
        />
      </div>
      <div className="multichain-asset-picker__amount"></div>
    </Box>
  );
};
