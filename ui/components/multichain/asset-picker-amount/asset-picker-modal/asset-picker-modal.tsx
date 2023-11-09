import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  TextFieldSearch,
  Box,
} from '../../../component-library';
import {
  BlockSize,
  Size,
  BorderRadius,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getSelectedAddress,
  getShouldHideZeroBalanceTokens,
} from '../../../../selectors';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';

import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import {
  getNativeCurrency,
  getTokens,
} from '../../../../ducks/metamask/metamask';
import {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { updateSendAsset, Asset } from '../../../../ducks/send';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import TokenCell from '../../../app/token-cell';
import { TokenListItem } from '../../token-list-item';

type AssetPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
};

export function AssetPickerModal({
  isOpen,
  onClose,
  asset,
}: AssetPickerModalProps) {
  const t = useI18nContext();
  const selectedAddress = useSelector(getSelectedAddress);
  const dispatch = useDispatch();
  const history = useHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState(
    asset.details?.address || null,
  );

  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
  const nativeCurrency = useSelector(getNativeCurrency);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const balanceValue = useSelector(getSelectedAccountCachedBalance);
  const tokens = useSelector(getTokens, isEqual);
  const { tokensWithBalances } = useTokenTracker({
    tokens,
    address: selectedAddress,
    hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
  });

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });

  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(balanceValue, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(balanceValue, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
    });

  const tokenList = tokensWithBalances.map(
    (token: {
      address: string | null;
      symbol: string;
      decimals: number;
      image: string;
      balance: string;
      string: string;
      type: AssetType;
      isSelected: boolean;
    }) => {
      token.isSelected =
        token.address?.toLowerCase() === selectedToken?.toLowerCase();
      return token;
    },
  );

  tokenList.push({
    address: null,
    symbol: nativeCurrency,
    decimals: 18,
    image: nativeCurrencyImage,
    balance: balanceValue,
    string: primaryCurrencyProperties.value,
    type: AssetType.native,
    isSelected: selectedToken === null,
  });

  const tokensData = tokenList.filter((item) =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectToken = async (token: any) => {
    setSelectedToken(token.address);
    if (token.type === AssetType.native) {
      await dispatch(
        updateSendAsset({
          type: token.type ?? AssetType.native,
          details: token,
          skipComputeEstimatedGasLimit: true,
        }),
      );
      history.push(SEND_ROUTE);
      onClose();
    }
    await dispatch(
      updateSendAsset({
        type: token.type ?? AssetType.token,
        details: { ...token, standard: TokenStandard.ERC20 },
        skipComputeEstimatedGasLimit: true,
      }),
    );
    history.push(SEND_ROUTE);
    onClose();
  };

  return (
    <Modal
      className="asset-picker-modal"
      isOpen={isOpen}
      onClose={onClose}
      data-testid="asset-picker-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('selectAToken')}</ModalHeader>
        <div>
          <TextFieldSearch
            placeholder={t('searchTokenOrNFT')}
            value={searchQuery}
            onChange={(e: any) => handleSearch(e.target.value)}
            error={false}
            autoFocus
            autoComplete={false}
            width={BlockSize.Full}
            clearButtonOnClick={() => setSearchQuery('')}
            clearButtonProps={{
              size: Size.SM,
            }}
            showClearButton={true}
            className={'asset-picker-modal__search-list'}
            inputProps={{
              'data-testid': 'asset-picker-modal-search-input',
            }}
            endAccessory={null}
          />
          {tokensData.map((token) => {
            return (
              <Box
                padding={4}
                gap={2}
                key={token.symbol}
                backgroundColor={
                  token.isSelected
                    ? BackgroundColor.primaryMuted
                    : BackgroundColor.transparent
                }
                className={classnames('multichain-asset-picker-list-item', {
                  'multichain-asset-picker-list-item--selected':
                    token.isSelected,
                })}
                onClick={() => handleSelectToken(token)}
              >
                {token.isSelected && (
                  <Box
                    className="multichain-asset-picker-list-item__selected-indicator"
                    borderRadius={BorderRadius.pill}
                    backgroundColor={BackgroundColor.primaryDefault}
                  />
                )}
                <div key={token.address} className="multichain-token-list">
                  <div className="multichain-token-list__data">
                    {token.type === AssetType.native ? (
                      <TokenListItem
                        title={nativeCurrency}
                        primary={
                          primaryCurrencyProperties.value ??
                          secondaryCurrencyProperties.value
                        }
                        tokenSymbol={primaryCurrencyProperties.suffix}
                        secondary={secondaryCurrencyDisplay}
                        tokenImage={token.image}
                      />
                    ) : (
                      <div>
                        <TokenCell
                          key={token.address}
                          {...token}
                          onClick={() => handleSelectToken(token)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Box>
            );
          })}
        </div>
      </ModalContent>
    </Modal>
  );
}
