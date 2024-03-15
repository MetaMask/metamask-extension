import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import { Tab, Tabs } from '../../../ui/tabs';
import NftsItems from '../../../app/nfts-items/nfts-items';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  TextFieldSearch,
  Box,
  Text,
  ButtonLink,
  ButtonLinkSize,
  ButtonIconSize,
  TextFieldSearchSize,
} from '../../../component-library';
import {
  BlockSize,
  BorderRadius,
  BackgroundColor,
  TextColor,
  TextVariant,
  TextAlign,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
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
import { useNftsCollections } from '../../../../hooks/useNftsCollections';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

type AssetPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
};

type NFT = {
  address: string;
  description: string | null;
  favorite: boolean;
  image: string | null;
  isCurrentlyOwned: boolean;
  name: string | null;
  standard: TokenStandard;
  tokenId: string;
  tokenURI?: string;
};

type Collection = {
  collectionName: string;
  collectionImage: string | null;
  nfts: NFT[];
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

  const { collections, previouslyOwnedCollection } = useNftsCollections();

  const hasAnyNfts = Object.keys(collections).length > 0;

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

  tokenList.sort((a, b) => {
    if (a.type === AssetType.native) {
      return -1;
    } else if (b.type === AssetType.native) {
      return 1;
    }
    return 0;
  });

  const tokensData = tokenList.filter((token) =>
    token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const collectionsKeys = Object.keys(collections);

  const collectionsData = collectionsKeys.reduce((acc: unknown[], key) => {
    const collection = (collections as any)[key];

    const isMatchingQuery = collection.collectionName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (isMatchingQuery) {
      acc.push(collection);
      return acc;
    }
    return acc;
  }, []);

  // filter and exclude ERC1155
  const collectionDataFiltered = (collectionsData as Collection[])
    .map((collection) => {
      return {
        ...collection,
        nfts: collection.nfts.filter(
          (nft) => nft.standard !== TokenStandard.ERC1155,
        ),
      };
    })
    .filter((collection) => collection.nfts.length > 0);

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

  const defaultActiveTabKey = asset?.type === AssetType.NFT ? 'nfts' : 'tokens';

  return (
    <Modal
      className="asset-picker-modal"
      isOpen={isOpen}
      onClose={onClose}
      data-testid="asset-picker-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader padding={4} onClose={onClose}>
          {t('selectAToken')}
        </ModalHeader>
        <Box style={{ flexGrow: '1' }}>
          <Tabs
            defaultActiveTabKey={defaultActiveTabKey}
            tabsClassName="modal-tab__tabs"
          >
            {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              <Tab
                activeClassName="modal-tab__tab--active"
                className="modal-tab__tab"
                name={t('tokens')}
                tabKey="tokens"
              >
                <Box paddingBottom={4} paddingTop={4} padding={4}>
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
                      size: ButtonIconSize.Sm,
                    }}
                    showClearButton={true}
                    className="asset-picker-modal__search-list"
                    inputProps={{
                      'data-testid': 'asset-picker-modal-search-input',
                    }}
                    endAccessory={null}
                    size={TextFieldSearchSize.Lg}
                  />
                </Box>
                <Box className="tokens-main-view-modal">
                  {tokensData.map((token) => {
                    return (
                      <Box
                        padding={0}
                        gap={0}
                        margin={0}
                        key={token.symbol}
                        backgroundColor={
                          token.isSelected
                            ? BackgroundColor.primaryMuted
                            : BackgroundColor.transparent
                        }
                        className={classnames(
                          'multichain-asset-picker-list-item',
                          {
                            'multichain-asset-picker-list-item--selected':
                              token.isSelected,
                          },
                        )}
                        onClick={() => handleSelectToken(token)}
                      >
                        {token.isSelected ? (
                          <Box
                            className="multichain-asset-picker-list-item__selected-indicator"
                            borderRadius={BorderRadius.pill}
                            backgroundColor={BackgroundColor.primaryDefault}
                          />
                        ) : null}
                        <Box
                          key={token.address}
                          padding={0}
                          display={Display.Block}
                          flexWrap={FlexWrap.NoWrap}
                          alignItems={AlignItems.center}
                          style={{ cursor: 'pointer' }}
                        >
                          <Box marginInlineStart={2}>
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
                              <TokenCell
                                key={token.address}
                                {...token}
                                onClick={() => handleSelectToken(token)}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Tab>
            }

            {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              <Tab
                activeClassName="modal-tab__tab--active"
                className="modal-tab__tab"
                name={t('nfts')}
                tabKey="nfts"
              >
                <Box paddingBottom={4} paddingTop={4} padding={4}>
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
                      size: ButtonIconSize.Sm,
                    }}
                    showClearButton={true}
                    className="asset-picker-modal__search-list"
                    inputProps={{
                      'data-testid': 'asset-picker-modal-search-input',
                    }}
                    endAccessory={null}
                    size={TextFieldSearchSize.Lg}
                  />
                </Box>
                {hasAnyNfts ? (
                  <Box className="modal-tab__main-view">
                    <NftsItems
                      collections={collectionDataFiltered}
                      previouslyOwnedCollection={previouslyOwnedCollection}
                      isModal={true}
                      onCloseModal={() => onClose()}
                      showTokenId={true}
                      displayPreviouslyOwnedCollection={false}
                    />
                  </Box>
                ) : (
                  <Box
                    padding={12}
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    alignItems={AlignItems.center}
                    justifyContent={JustifyContent.center}
                  >
                    <Box justifyContent={JustifyContent.center}>
                      <img src="./images/no-nfts.svg" />
                    </Box>
                    <Box
                      marginTop={4}
                      marginBottom={12}
                      display={Display.Flex}
                      justifyContent={JustifyContent.center}
                      alignItems={AlignItems.center}
                      flexDirection={FlexDirection.Column}
                      className="nfts-tab__link"
                    >
                      <Text
                        color={TextColor.textMuted}
                        variant={TextVariant.headingSm}
                        textAlign={TextAlign.Center}
                        as="h4"
                      >
                        {t('noNFTs')}
                      </Text>
                      <ButtonLink
                        size={ButtonLinkSize.Sm}
                        href={ZENDESK_URLS.NFT_TOKENS}
                        externalLink
                      >
                        {t('learnMoreUpperCase')}
                      </ButtonLink>
                    </Box>
                  </Box>
                )}
              </Tab>
            }
          </Tabs>
        </Box>
      </ModalContent>
    </Modal>
  );
}
