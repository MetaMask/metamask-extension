import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import {
  TextColor,
  IconColor,
  TextVariant,
  FontWeight,
  JustifyContent,
  OverflowWrap,
  FlexDirection,
  Display,
  BorderRadius,
  BorderStyle,
  FlexWrap,
  FontStyle,
  TextAlign,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  formatDate,
  getAssetImageURL,
  shortenAddress,
} from '../../../helpers/utils/util';
import { getNftImageAlt } from '../../../helpers/utils/nfts';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getIpfsGateway,
  getSelectedInternalAccount,
} from '../../../selectors';
import AssetNavigation from '../../../pages/asset/components/asset-navigation';
import { getNftContracts } from '../../../ducks/metamask/metamask';
import { DEFAULT_ROUTE, SEND_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateSingleNftOwnershipStatus,
  removeAndIgnoreNft,
  setRemoveNftMessage,
  setNewNftAddedMessage,
} from '../../../store/actions';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import NftOptions from '../nft-options/nft-options';
import Button from '../../ui/button';
import { startNewDraftTransaction } from '../../../ducks/send';
import InfoTooltip from '../../ui/info-tooltip';
import { usePrevious } from '../../../hooks/usePrevious';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  ButtonIcon,
  IconName,
  Text,
  Box,
  ButtonIconSize,
  IconSize,
  ButtonPrimarySize,
  ButtonPrimary,
  Icon,
} from '../../component-library';
import Tooltip from '../../ui/tooltip';
import { NftItem } from '../../multichain/nft-item';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import classnames from 'classnames';
import { Content, Footer, Page } from '../../multichain/pages/page';
import NftDetailInformationRow from './nft-detail-information-row';
import NftDetailInformationFrame from './nft-detail-information-frame';

export default function NftDetails({ nft }) {
  const {
    image,
    imageOriginal,
    name,
    description,
    address,
    tokenId,
    standard,
    isCurrentlyOwned,
    lastSale,
  } = nft;
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const ipfsGateway = useSelector(getIpfsGateway);
  const nftContracts = useSelector(getNftContracts);
  const currentNetwork = useSelector(getCurrentChainId);
  const currentChain = useSelector(getCurrentNetwork);
  const trackEvent = useContext(MetaMetricsContext);

  const [addressCopied, handleAddressCopy] = useCopyToClipboard();

  const nftContractName = nftContracts.find(({ address: contractAddress }) =>
    isEqualCaseInsensitive(contractAddress, address),
  )?.name;
  const {
    metadata: { name: selectedAccountName },
  } = useSelector(getSelectedInternalAccount);
  const nftImageAlt = getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? image;
  const nftImageURL = getAssetImageURL(imageOriginal ?? image, ipfsGateway);
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const isImageHosted = image?.startsWith('https:');

  const formattedTimestamp = formatDate(
    new Date(lastSale?.timestamp).getTime(),
    'M/d/y',
  );

  const { chainId } = currentChain;
  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.NftDetailsOpened,
      category: MetaMetricsEventCategory.Tokens,
      properties: {
        chain_id: chainId,
      },
    });
  }, [trackEvent, chainId]);

  const onRemove = async () => {
    let isSuccessfulEvent = false;
    try {
      await dispatch(removeAndIgnoreNft(address, tokenId));
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage('success'));
      isSuccessfulEvent = true;
    } catch (err) {
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage('error'));
    } finally {
      // track event
      trackEvent({
        event: MetaMetricsEventName.NFTRemoved,
        category: 'Wallet',
        properties: {
          token_contract_address: address,
          tokenId: tokenId.toString(),
          asset_type: AssetType.NFT,
          token_standard: standard,
          chain_id: currentNetwork,
          isSuccessful: isSuccessfulEvent,
        },
      });
      history.push(DEFAULT_ROUTE);
    }
  };

  const prevNft = usePrevious(nft);
  useEffect(() => {
    if (!isEqual(prevNft, nft)) {
      checkAndUpdateSingleNftOwnershipStatus(nft);
    }
  }, [nft, prevNft]);

  const getOpenSeaLink = () => {
    switch (currentNetwork) {
      case CHAIN_IDS.MAINNET:
        return `https://opensea.io/assets/ethereum/${address}/${tokenId}`;
      case CHAIN_IDS.POLYGON:
        return `https://opensea.io/assets/matic/${address}/${tokenId}`;
      case CHAIN_IDS.GOERLI:
        return `https://testnets.opensea.io/assets/goerli/${address}/${tokenId}`;
      case CHAIN_IDS.SEPOLIA:
        return `https://testnets.opensea.io/assets/sepolia/${address}/${tokenId}`;
      default:
        return null;
    }
  };

  const openSeaLink = getOpenSeaLink();
  const sendDisabled =
    standard !== TokenStandard.ERC721 && standard !== TokenStandard.ERC1155;
  const inPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const onSend = async () => {
    await dispatch(
      startNewDraftTransaction({
        type: AssetType.NFT,
        details: nft,
      }),
    );
    // We only allow sending one NFT at a time
    history.push(SEND_ROUTE);
  };

  const renderSendButton = () => {
    if (isCurrentlyOwned === false) {
      return <div style={{ height: '30px' }} />;
    }
    return (
      <Box display={Display.Flex} margin={inPopUp ? [4, 0] : null}>
        <Button
          type="primary"
          onClick={onSend}
          disabled={sendDisabled}
          className="nft-details__send-button"
          data-testid="nft-send-button"
        >
          {t('send')}
        </Button>
        {sendDisabled ? (
          <InfoTooltip position="top" contentText={t('sendingDisabled')} />
        ) : null}
      </Box>
    );
  };

  return (
    <Page>
      <Content>
        <Box className="nft-container">
          <ButtonIcon
            color={IconColor.iconAlternative}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
          <Box className="nft-image-responsive">
            <NftItem
              nftImageURL={nftImageURL}
              src={isImageHosted ? image : nftImageURL}
              alt={image ? nftImageAlt : ''}
              name={name}
              tokenId={tokenId}
              networkName={currentChain.nickname}
              networkSrc={currentChain.rpcPrefs?.imageUrl}
              isIpfsURL={isIpfsURL}
              clickable
            />
          </Box>

          <NftOptions
            onViewOnOpensea={
              openSeaLink
                ? () => global.platform.openTab({ url: openSeaLink })
                : null
            }
            onRemove={onRemove}
          />
        </Box>
        <Box marginTop={4}>
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <Text
              variant={TextVariant.headingLg}
              fontWeight={FontWeight.Bold}
              color={TextColor.textDefault}
              fontStyle={FontStyle.Normal}
              style={{ fontSize: '24px' }}
            >
              {name}
            </Text>
            <Icon
              marginLeft={1}
              name={IconName.SecurityTick}
              color={IconColor.primaryDefault}
              width="20"
              height="20"
            />
          </Box>

          <Text
            variant={TextVariant.bodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.textAlternative}
          >
            {description}
          </Text>
          <Box
            marginTop={4}
            display={Display.Flex}
            gap={4}
            flexWrap={FlexWrap.Wrap}
          >
            {/*             <Box className="box-test">
              <Text
                variant={TextVariant.bodyMdMedium}
                textAlign={TextAlign.Center}
                color={TextColor.textAlternative}
                style={{ fontSize: '10px', lineHeight: '16px' }}
              >
                Bought for
              </Text>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
              >
                <Text className="text-value-style">$550.00</Text>
                <ButtonIcon
                  size={IconSize.Sm}
                  padding={2}
                  color={IconColor.iconMuted}
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={IconName.Export}
                />
              </Box>
            </Box> */}

            <NftDetailInformationFrame
              frameClassname="box-test"
              title="Bought for"
              frameTextTitleProps={{
                textAlign: TextAlign.Center,
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '10px',
                lineHeight: '16px',
              }}
              value="$550.00"
              frameTextValueProps={{
                color: TextColor.textDefault,
                variant: TextVariant.headingSm,
              }}
              frameTextValueStyle={{
                fontSize: '16px',
                lineHeight: '24px',
              }}
              icon={
                <ButtonIcon
                  size={IconSize.Sm}
                  padding={2}
                  color={IconColor.iconMuted}
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={IconName.Export}
                />
              }
            />
            {/*             <Box className="box-test">
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMdMedium}
                textAlign={TextAlign.Center}
                style={{ fontSize: '10px', lineHeight: '16px' }}
              >
                Highest floor price
              </Text>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
              >
                <Text className="text-value-style">$450.00</Text>
                <ButtonIcon
                  size={IconSize.Sm}
                  padding={1}
                  color={IconColor.iconMuted}
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={IconName.Export}
                />
              </Box>
            </Box> */}
            <NftDetailInformationFrame
              frameClassname="box-test"
              title="Highest floor price"
              frameTextTitleProps={{
                textAlign: TextAlign.Center,
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '10px',
                lineHeight: '16px',
              }}
              value="$450.00"
              frameTextValueProps={{
                color: TextColor.textDefault,
                variant: TextVariant.headingSm,
              }}
              frameTextValueStyle={{
                fontSize: '16px',
                lineHeight: '24px',
              }}
              icon={
                <ButtonIcon
                  size={IconSize.Sm}
                  padding={2}
                  color={IconColor.iconMuted}
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={IconName.Export}
                />
              }
            />
            {/*            <Box className="box-test">
              <Text
                variant={TextVariant.bodyMdMedium}
                textAlign={TextAlign.Center}
                color={TextColor.textAlternative}
                style={{ fontSize: '10px', lineHeight: '16px' }}
              >
                Rank
              </Text>
              <Text className="text-value-style">#70</Text>
            </Box> */}
            <NftDetailInformationFrame
              frameClassname="box-test"
              title="Rank"
              frameTextTitleProps={{
                textAlign: TextAlign.Center,
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '10px',
                lineHeight: '16px',
              }}
              value="#4"
              frameTextValueProps={{
                color: TextColor.textDefault,
                variant: TextVariant.headingSm,
                textAlign: TextAlign.Center,
              }}
              frameTextValueStyle={{
                fontSize: '16px',
                lineHeight: '24px',
              }}
            />
            {/*             <Box className="box-test">
              <Text
                variant={TextVariant.bodyMdMedium}
                textAlign={TextAlign.Center}
                color={TextColor.textAlternative}
                style={{ fontSize: '10px', lineHeight: '16px' }}
              >
                Contract address
              </Text>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
              >
                <Text
                  color={TextColor.primaryDefault}
                  fontFamily="Euclid Circular B"
                  fontStyle={FontStyle.Normal}
                  variant={TextVariant.bodySmMedium}
                >
                  {shortenAddress(address)}
                </Text>
                <ButtonIcon
                  ariaLabel="copy"
                  size={IconSize.Sm}
                  color={IconColor.primaryDefault}
                  padding={1}
                  data-testid="nft-address-copy"
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={
                    addressCopied ? IconName.CopySuccess : IconName.Copy
                  }
                />
              </Box>
            </Box> */}
            <NftDetailInformationFrame
              frameClassname="box-test"
              title="Contract address"
              frameTextTitleProps={{
                textAlign: TextAlign.Center,
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '10px',
                lineHeight: '16px',
              }}
              value={shortenAddress(address)}
              frameTextValueProps={{
                color: TextColor.primaryDefault,
                fontStyle: FontStyle.Normal,
                variant: TextVariant.bodySmMedium,
              }}
              icon={
                <ButtonIcon
                  ariaLabel="copy"
                  size={IconSize.Sm}
                  color={IconColor.primaryDefault}
                  padding={1}
                  data-testid="nft-address-copy"
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={
                    addressCopied ? IconName.CopySuccess : IconName.Copy
                  }
                />
              }
            />
          </Box>
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Token ID
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              555
            </Text>
          </Box> */}
          <NftDetailInformationRow title="Token ID" value="555" />
          <NftDetailInformationRow title="Token symbol" value="PPS" />
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Token symbol
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              PPS
            </Text>
          </Box> */}
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Number of tokens
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              555
            </Text>
          </Box> */}
          <NftDetailInformationRow title="Number of tokens" value="6778" />
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Token standard
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              ERC1155
            </Text>
          </Box> */}
          <NftDetailInformationRow title="Token standard" value="ERC1155" />
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Date created
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              23 Dec
            </Text>
          </Box> */}
          <NftDetailInformationRow title="Date created" value="23 Dec, 2200" />
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text color={TextColor.textDefault} variant={TextVariant.headingMd}>
              Price
            </Text>
          </Box>
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Last sold
            </Text>
            <Box display={Display.Flex}>
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMdMedium}
              >
                23 Dec
              </Text>
              <ButtonIcon
                size={IconSize.Sm}
                // padding={2}
                color={IconColor.iconMuted}
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={IconName.Export}
              />
            </Box>
          </Box> */}
          <NftDetailInformationRow
            title="Last sold"
            value="23 dec, 1013"
            icon={
              <ButtonIcon
                size={IconSize.Sm}
                color={IconColor.iconMuted}
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={IconName.Export}
                justifyContent={JustifyContent.flexEnd}
              />
            }
          />
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Highest current bid
            </Text>

            <Box display={Display.Flex}>
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMdMedium}
              >
                0.024ETH
              </Text>
              <ButtonIcon
                size={IconSize.Sm}
                padding={2}
                color={IconColor.iconMuted}
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={IconName.Export}
              />
            </Box>
          </Box> */}
          <NftDetailInformationRow
            title="Highest current bid"
            value="0.23ETH"
            icon={
              <ButtonIcon
                size={IconSize.Sm}
                color={IconColor.iconMuted}
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={IconName.Export}
                justifyContent={JustifyContent.flexEnd}
              />
            }
          />
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text color={TextColor.textDefault} variant={TextVariant.headingMd}>
              Collection
            </Text>
          </Box>
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Collection name
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Apes
            </Text>
          </Box> */}
          <NftDetailInformationRow title="Collection name" value="Apes" />
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Tokens in collection
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              56667
            </Text>
          </Box> */}
          <NftDetailInformationRow title="Tokens in collection" value="4566" />
          {/*           <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              Creator address
            </Text>

            <Box display={Display.Flex}>
              <Text
                color={TextColor.primaryDefault}
                variant={TextVariant.bodyMdMedium}
              >
                {shortenAddress(address)}
              </Text>
              <ButtonIcon
                ariaLabel="copy"
                size={IconSize.Sm}
                color={IconColor.primaryDefault}
                padding={1}
                data-testid="nft-address-copy"
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={addressCopied ? IconName.CopySuccess : IconName.Copy}
              />
            </Box>
          </Box> */}
          <NftDetailInformationRow
            title="Creator address"
            value={shortenAddress(address)}
            valueColor={TextColor.primaryDefault}
            icon={
              <ButtonIcon
                ariaLabel="copy"
                size={IconSize.Sm}
                color={IconColor.primaryDefault}
                data-testid="nft-address-copy"
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={addressCopied ? IconName.CopySuccess : IconName.Copy}
                justifyContent={JustifyContent.flexEnd}
              />
            }
          />
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            marginTop={4}
          >
            <Text color={TextColor.textDefault} variant={TextVariant.headingMd}>
              Attributes
            </Text>
          </Box>
          <Box
            marginTop={4}
            display={Display.Flex}
            gap={2}
            flexWrap={FlexWrap.Wrap}
          >
            {/*             <Box className="box-test2">
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternative}
                style={{ fontSize: '14px', lineHeight: '22px' }}
              >
                Background
              </Text>

              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
                style={{ fontSize: '14px' }}
              >
                Purple
              </Text>
            </Box> */}
            <NftDetailInformationFrame
              frameClassname="box-test2"
              title="Background"
              frameTextTitleProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '14px',
                lineHeight: '22px',
              }}
              value="Purple"
              frameTextValueProps={{
                color: TextColor.textDefault,
                variant: TextVariant.bodyMd,
              }}
              frameTextValueStyle={{
                fontSize: '14px',
              }}
            />
            {/*             <Box className="box-test2">
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternative}
                style={{ fontSize: '14px', lineHeight: '22px' }}
              >
                Teeth
              </Text>

              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
                style={{ fontSize: '14px' }}
              >
                White
              </Text>
            </Box> */}
            <NftDetailInformationFrame
              frameClassname="box-test2"
              title="Teeth"
              frameTextTitleProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '14px',
                lineHeight: '22px',
              }}
              value="White"
              frameTextValueProps={{
                color: TextColor.textDefault,
                variant: TextVariant.bodyMd,
              }}
              frameTextValueStyle={{
                fontSize: '14px',
              }}
            />
          </Box>
          <Box marginTop={4}>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
              as="h6"
            >
              {t('nftDisclaimer')}
            </Text>
          </Box>
        </Box>
      </Content>
      <Footer>
        <ButtonPrimary
          onClick={() => console.log('ok')}
          size={ButtonPrimarySize.Lg}
          block
        >
          Send
        </ButtonPrimary>
      </Footer>
    </Page>

    /*     <>
      <Box className="nft-container">
        <ButtonIcon
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Sm}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={() => history.push(DEFAULT_ROUTE)}
        />
        <Box>
          <NftItem
            nftImageURL={nftImageURL}
            src={isImageHosted ? image : nftImageURL}
            alt={image ? nftImageAlt : ''}
            name={name}
            tokenId={tokenId}
            networkName={currentChain.nickname}
            networkSrc={currentChain.rpcPrefs?.imageUrl}
            isIpfsURL={isIpfsURL}
            clickable
          />
        </Box>

        <NftOptions
          onViewOnOpensea={
            openSeaLink
              ? () => global.platform.openTab({ url: openSeaLink })
              : null
          }
          onRemove={onRemove}
        />
      </Box>
      <Box margin={4}>
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          color={TextColor.textDefault}
        >
          {name}
        </Text>

        <Text
          variant={TextVariant.bodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.textAlternative}
        >
          {description}
        </Text>
        <Box
          marginTop={4}
          display={Display.Flex}
          gap={4}
          flexWrap={FlexWrap.Wrap}
        >
          <Box className="box-test">
            <Text className="text-title-style">Bought for</Text>
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
            >
              <Text className="text-value-style">$550.00</Text>
              <ButtonIcon
                size={IconSize.Sm}
                padding={2}
                color={IconColor.iconMuted}
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={IconName.Export}
              />
            </Box>
          </Box>
          <Box className="box-test">
            <Text className="text-title-style">Highest floor price</Text>
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
            >
              <Text className="text-value-style">$450.00</Text>
              <ButtonIcon
                size={IconSize.Sm}
                padding={1}
                color={IconColor.iconMuted}
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={IconName.Export}
              />
            </Box>
          </Box>
          <Box className="box-test">
            <Text
              color={TextColor.textAlternative}
              className="text-title-style"
            >
              Rank
            </Text>
            <Text className="text-value-style">#70</Text>
          </Box>
          <Box className="box-test">
            <Text
              // className="text-title-style"
              className={classnames('text-title-style', 'text-line')}
            >
              Contract address
            </Text>
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
            >
              <Text
                color={TextColor.primaryDefault}
                fontFamily="Euclid Circular B"
                fontStyle={FontStyle.Normal}
                variant={TextVariant.bodySmMedium}
              >
                {shortenAddress(address)}
              </Text>
              <ButtonIcon
                ariaLabel="copy"
                size={IconSize.Sm}
                color={IconColor.primaryDefault}
                padding={1}
                data-testid="nft-address-copy"
                onClick={() => {
                  handleAddressCopy(address);
                }}
                iconName={addressCopied ? IconName.CopySuccess : IconName.Copy}
              />
            </Box>
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Token ID
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            555
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Token symbol
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            PPS
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Number of tokens
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            555
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Token standard
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            ERC1155
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Date created
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            23 Dec
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text color={TextColor.textDefault} variant={TextVariant.headingMd}>
            Price
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Last sold
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            23 Dec
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Highest current bid
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            0.024ETH
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text color={TextColor.textDefault} variant={TextVariant.headingMd}>
            Collection
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Collection name
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Apes
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Tokens in collection
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            56667
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            Creator address
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            {shortenAddress(address)}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
        >
          <Text color={TextColor.textDefault} variant={TextVariant.headingMd}>
            Attributes
          </Text>
        </Box>
        <Box
          marginTop={4}
          display={Display.Flex}
          gap={2}
          flexWrap={FlexWrap.Wrap}
        >
          <Box className="box-test2">
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              Background
            </Text>

            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              Purple
            </Text>
          </Box>
          <Box className="box-test2">
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              Teeth
            </Text>

            <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
              White
            </Text>
          </Box>
        </Box>
        <Box marginTop={4}>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            as="h6"
          >
            {t('nftDisclaimer')}
          </Text>
        </Box>
      </Box>
      <Footer>
        <ButtonPrimary
          onClick={() => console.log('ok')}
          size={ButtonPrimarySize.Lg}
          block
        >
          Send
        </ButtonPrimary>
      </Footer>
    </> */

    /* ========================  OLD code */

    /*     <>
      <AssetNavigation
        //  accountName={selectedAccountName}
        // assetName={nftContractName}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <NftOptions
            onViewOnOpensea={
              openSeaLink
                ? () => global.platform.openTab({ url: openSeaLink })
                : null
            }
            onRemove={onRemove}
          />
        }
      />
      <Box className="nft-details">
        <Box
          className="nft-details__top-section"
          gap={6}
          flexDirection={FlexDirection.Column}
        >
          <Box className="nft-details__nft-item">
            <NftItem
              nftImageURL={nftImageURL}
              src={isImageHosted ? image : nftImageURL}
              alt={image ? nftImageAlt : ''}
              name={name}
              tokenId={tokenId}
              networkName={currentChain.nickname}
              networkSrc={currentChain.rpcPrefs?.imageUrl}
              isIpfsURL={isIpfsURL}
              clickable
            />
          </Box>
          <Box
            flexDirection={FlexDirection.Column}
            className="nft-details__info"
            marginTop={4}
            justifyContent={JustifyContent.spaceBetween}
          >
            <div>
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingSm}
                as="h4"
                fontWeight={FontWeight.Bold}
                marginBottom={2}
              >
                {name}
              </Text>
              <Text
                color={TextColor.textMuted}
                variant={TextVariant.bodyMd}
                as="h5"
                marginBottom={4}
                overflowWrap={OverflowWrap.BreakWord}
              >
                #{tokenId}
              </Text>
            </div>
            {description ? (
              <div>
                <Text
                  color={TextColor.textDefault}
                  variant={TextVariant.bodySmBold}
                  as="h6"
                  marginBottom={2}
                  className="nft-details__description"
                >
                  {t('description')}
                </Text>
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySm}
                  as="h6"
                  overflowWrap={OverflowWrap.BreakWord}
                  marginBottom={4}
                >
                  {description}
                </Text>
              </div>
            ) : null}
            {inPopUp ? null : renderSendButton()}
          </Box>
        </Box>
        <Box marginBottom={2}>
          {lastSale ? (
            <>
              <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
                <Text
                  color={TextColor.textDefault}
                  variant={TextVariant.bodySmBold}
                  as="h6"
                  marginBottom={4}
                  marginRight={2}
                  className="nft-details__link-title"
                >
                  {t('lastSold')}
                </Text>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  className="nft-details__contract-wrapper"
                >
                  <Text
                    color={TextColor.textAlternative}
                    variant={TextVariant.bodySm}
                    as="h6"
                    overflowWrap={OverflowWrap.BreakWord}
                    marginBottom={4}
                  >
                    {formattedTimestamp}
                  </Text>
                </Box>
              </Box>
              <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
                <Text
                  color={TextColor.textDefault}
                  variant={TextVariant.bodySmBold}
                  as="h6"
                  marginBottom={4}
                  marginRight={2}
                  className="nft-details__link-title"
                >
                  {t('lastPriceSold')}
                </Text>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  className="nft-details__contract-wrapper"
                >
                  <Text
                    color={TextColor.textAlternative}
                    variant={TextVariant.bodySm}
                    as="h6"
                    overflowWrap={OverflowWrap.BreakWord}
                    marginBottom={4}
                  >
                    {lastSale?.price?.amount?.decimal}{' '}
                    {lastSale?.price?.currency?.symbol}
                  </Text>
                </Box>
              </Box>
            </>
          ) : null}
          <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
            <Text
              color={TextColor.textDefault}
              variant={TextVariant.bodySmBold}
              as="h6"
              marginBottom={4}
              marginRight={2}
              className="nft-details__link-title"
            >
              {t('contractAddress')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              className="nft-details__contract-wrapper"
            >
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodySm}
                as="h6"
                overflowWrap={OverflowWrap.BreakWord}
                marginBottom={4}
              >
                {shortenAddress(address)}
              </Text>
              <Tooltip
                wrapperClassName="nft-details__tooltip-wrapper"
                position="bottom"
                title={
                  addressCopied ? t('copiedExclamation') : t('copyToClipboard')
                }
              >
                <ButtonIcon
                  ariaLabel="copy"
                  color={IconColor.iconAlternative}
                  className="nft-details__contract-copy-button"
                  data-testid="nft-address-copy"
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={
                    addressCopied ? IconName.CopySuccess : IconName.Copy
                  }
                />
              </Tooltip>
            </Box>
          </Box>
          {inPopUp ? renderSendButton() : null}
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            as="h6"
          >
            {t('nftDisclaimer')}
          </Text>
        </Box>
      </Box>
    </> */
  );
}

NftDetails.propTypes = {
  nft: PropTypes.shape({
    address: PropTypes.string.isRequired,
    tokenId: PropTypes.string.isRequired,
    isCurrentlyOwned: PropTypes.bool,
    name: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    standard: PropTypes.string,
    imageThumbnail: PropTypes.string,
    imagePreview: PropTypes.string,
    imageOriginal: PropTypes.string,
    creator: PropTypes.shape({
      address: PropTypes.string,
      config: PropTypes.string,
      profile_img_url: PropTypes.string,
    }),
    lastSale: PropTypes.shape({
      timestamp: PropTypes.string,
      price: PropTypes.shape({
        amount: PropTypes.shape({
          native: PropTypes.string,
          decimal: PropTypes.string,
        }),
        currency: PropTypes.shape({
          symbol: PropTypes.string,
        }),
      }),
    }),
  }),
};
