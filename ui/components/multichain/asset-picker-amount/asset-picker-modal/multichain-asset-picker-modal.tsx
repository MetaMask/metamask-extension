import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Box,
  AvatarTokenSize,
  AvatarToken,
  Text,
} from '../../../component-library';
import {
  BorderRadius,
  TextVariant,
  TextAlign,
  Display,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { AssetType } from '../../../../../shared/constants/transaction';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getMultichainConversionRate,
  getMultichainCurrentChainId,
  getMultichainCurrentCurrency,
  getMultichainNativeCurrency,
  getMultichainNativeCurrencyImage,
  getMultichainSelectedAccountCachedBalance,
} from '../../../../selectors/multichain';
import { NativeAsset, AssetWithDisplayData } from './types';
import { AssetPickerModalTabs, TabName } from './asset-picker-modal-tabs';
import AssetList from './AssetList';
import { Search } from './asset-picker-modal-search';

type AssetPickerModalProps = {
  header: JSX.Element | string | null;
  isOpen: boolean;
  onClose: () => void;
  asset?: NativeAsset;
  onAssetChange: (asset: AssetWithDisplayData<NativeAsset>) => void;
  /**
   * Sending asset for UI treatments; only for dest component
   */
  sendingAsset?: { image: string; symbol: string } | undefined;
} & Pick<
  React.ComponentProps<typeof AssetPickerModalTabs>,
  'visibleTabs' | 'defaultActiveTabKey'
>;

export function MultichainAssetPickerModal({
  header,
  isOpen,
  onClose,
  asset,
  onAssetChange,
  sendingAsset,
  ...tabProps
}: AssetPickerModalProps) {
  const t = useI18nContext();

  const [searchQuery, setSearchQuery] = useState('');
  const chainId = useMultichainSelector(getMultichainCurrentChainId);
  const nativeCurrencyImage = useMultichainSelector(
    getMultichainNativeCurrencyImage,
  );
  const nativeCurrency = useMultichainSelector(getMultichainNativeCurrency);
  const balanceValue = useMultichainSelector(
    getMultichainSelectedAccountCachedBalance,
  );
  const conversionRate = useMultichainSelector(getMultichainConversionRate);
  const currentCurrency = useMultichainSelector(getMultichainCurrentCurrency);

  const handleAssetChange = () => {
    // TODO: Implement
  };

  const filteredTokenList = useMemo(() => {
    const nativeToken: AssetWithDisplayData<NativeAsset> = {
      address: null,
      symbol: nativeCurrency,
      // TODO: fix decimals
      decimals: 8,
      image: nativeCurrencyImage,
      balance: balanceValue,
      string: undefined,
      type: AssetType.native,
    };

    const filteredTokens: AssetWithDisplayData<NativeAsset>[] = [nativeToken];

    return filteredTokens;
  }, [
    searchQuery,
    nativeCurrency,
    nativeCurrencyImage,
    balanceValue,
    conversionRate,
    currentCurrency,
    chainId,
  ]);

  return (
    <Modal
      className="asset-picker-modal"
      isOpen={isOpen}
      onClose={onClose}
      data-testid="asset-picker-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {header}
          </Text>
        </ModalHeader>
        {sendingAsset?.image && sendingAsset?.symbol && (
          <Box
            display={Display.Flex}
            gap={1}
            alignItems={AlignItems.center}
            marginInline="auto"
          >
            <AvatarToken
              borderRadius={BorderRadius.full}
              src={sendingAsset.image}
              size={AvatarTokenSize.Xs}
            />
            <Text variant={TextVariant.bodySm} textAlign={TextAlign.Center}>
              {t('sendingAsset', [sendingAsset.symbol])}
            </Text>
          </Box>
        )}
        <Box className="modal-tab__wrapper">
          <AssetPickerModalTabs {...tabProps}>
            <React.Fragment key={TabName.TOKENS}>
              <Search
                searchQuery={searchQuery}
                onChange={(value) => setSearchQuery(value)}
              />
              <AssetList
                handleAssetChange={handleAssetChange}
                asset={asset}
                tokenList={filteredTokenList}
              />
            </React.Fragment>
            <></>
          </AssetPickerModalTabs>
        </Box>
      </ModalContent>
    </Modal>
  );
}
