import React, { useState } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextFieldSearch,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSelector } from 'react-redux';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import ItemList from '../../swaps/searchable-item-list/item-list/item-list.component';
import { getNonTestNetworks, getSwapsDefaultToken } from '../../../selectors';
import { isEqual } from 'lodash';
import { useTokensWithFiltering } from '../../../hooks/useTokensWithFiltering';

// TODO import from token-api
// TODO write type validator for token
type BridgeToken = {};
export const MultiChainTokenPicker = function <T = BridgeToken>({
  selectedNetwork,
  selectedToken,
  networks,
  onTokenChange,
  onNetworkChange,
}: {
  selectedToken: T;
  onTokenChange: (token: T) => void;
  networks: any[];
  selectedNetwork?: any;
  onNetworkChange: (chainId: string, id?: string) => void;
}) {
  const t = useI18nContext();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);

  // TODO use multichain token list - tokensChainsCache ?
  const filteredTokens = useTokensWithFiltering(
    // TODO handle dest chain native token - use generic default token selector instead?
    defaultSwapsToken,
    searchQuery,
    {},
    () => {
      // TODO disable blocked tokens
      return false;
    },
    selectedNetwork?.chainId,
  );

  // TODO does this work for networks the user hasn't added?
  const nonTestNetworks = useSelector(getNonTestNetworks);
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
            <Box className="network-list" width={BlockSize.Full} tabIndex="0">
              <Box
                style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
              >
                {nonTestNetworks
                  ?.filter(({ chainId }) => networks.includes(chainId))
                  .map(({ chainId, id, nickname }) => (
                    <Button onClick={() => onNetworkChange(chainId, id)}>
                      {nickname}
                    </Button>
                  ))}
              </Box>
            </Box>
            <Box
              className="list-with-search"
              width={BlockSize.Full}
              tabIndex="0"
            >
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
                  tabIndex="0"
                />
              </Box>
              {filteredTokens?.length > 0 && (
                <ItemList
                  searchQuery={searchQuery}
                  results={filteredTokens}
                  onClickItem={(t) => {
                    onTokenChange(t);
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
