import React from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import Box from '../../../ui/box';
import Button from '../../../ui/button/button.component';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Identicon from '../../../ui/identicon';
import { ellipsify } from '../../../../pages/send/send.utils';
import Popover from '../../../ui/popover';
import {
  FontWeight,
  TextVariant,
  Display,
  Size,
  BorderStyle,
  BorderColor,
  TextColor,
  Color,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { getAddressBookEntry } from '../../../../selectors';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import NftCollectionImage from '../../../ui/nft-collection-image/nft-collection-image';
import { ButtonIcon, IconName, Text } from '../../../component-library';
import Name from '../../name/name';
import { usePetnamesEnabled } from '../../../../hooks/usePetnamesEnabled';

export default function ContractDetailsModal({
  onClose,
  tokenName,
  tokenAddress,
  toAddress,
  chainId,
  rpcPrefs,
  tokenId,
  assetName,
  assetStandard,
  isContractRequestingSignature,
}) {
  const t = useI18nContext();
  const [copiedTokenAddress, handleCopyTokenAddress] = useCopyToClipboard();
  const [copiedToAddress, handleCopyToAddress] = useCopyToClipboard();
  const petnamesEnabled = usePetnamesEnabled();

  const addressBookEntry = useSelector((state) => ({
    data: getAddressBookEntry(state, toAddress),
  }));

  const nft =
    assetStandard === TokenStandard.ERC721 ||
    assetStandard === TokenStandard.ERC1155 ||
    // if we don't have an asset standard but we do have either both an assetname and a tokenID or both a tokenName and tokenId we assume its an NFT
    (assetName && tokenId) ||
    (tokenName && tokenId);

  return (
    <Popover className="contract-details-modal">
      <Box
        paddingTop={6}
        paddingRight={4}
        paddingBottom={8}
        paddingLeft={4}
        className="contract-details-modal__content"
      >
        <Text
          fontWeight={FontWeight.Bold}
          variant={TextVariant.bodyMd}
          as="h5"
          display={Display.Flex}
        >
          {t('contractTitle')}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          display={Display.Flex}
          color={TextColor.textAlternative}
          marginTop={2}
        >
          {t('contractDescription')}
        </Text>
        {!isContractRequestingSignature && (
          <>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              display={Display.Flex}
              marginTop={4}
              marginBottom={2}
            >
              {nft ? t('contractNFT') : t('contractToken')}
            </Text>
            <Box
              display={Display.Flex}
              borderRadius={Size.SM}
              borderStyle={BorderStyle.solid}
              borderColor={BorderColor.borderDefault}
              className="contract-details-modal__content__contract"
            >
              {nft ? (
                <Box margin={4}>
                  <NftCollectionImage
                    assetName={assetName}
                    tokenAddress={tokenAddress}
                  />
                </Box>
              ) : (
                <Identicon
                  className="contract-details-modal__content__contract__identicon"
                  address={tokenAddress}
                  diameter={24}
                />
              )}
              <Box data-testid="recipient">
                <Text
                  fontWeight={FontWeight.Bold}
                  variant={TextVariant.bodyMd}
                  as="h5"
                  marginTop={4}
                >
                  {tokenName || ellipsify(tokenAddress)}
                </Text>
                {tokenName && (
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    display={Display.Flex}
                    color={TextColor.textAlternative}
                    marginBottom={4}
                  >
                    {ellipsify(tokenAddress)}
                  </Text>
                )}
              </Box>
              <Box
                alignItems={AlignItems.center}
                marginLeft="auto"
                marginRight={4}
                gap={2}
              >
                <Tooltip
                  position="top"
                  title={
                    copiedTokenAddress
                      ? t('copiedExclamation')
                      : t('copyToClipboard')
                  }
                >
                  <ButtonIcon
                    display={Display.Flex}
                    iconName={
                      copiedTokenAddress ? IconName.CopySuccess : IconName.Copy
                    }
                    onClick={() => handleCopyTokenAddress(tokenAddress)}
                    color={Color.iconMuted}
                    ariaLabel={
                      copiedTokenAddress
                        ? t('copiedExclamation')
                        : t('copyToClipboard')
                    }
                  />
                </Tooltip>
                <Tooltip position="top" title={t('openInBlockExplorer')}>
                  <ButtonIcon
                    display={Display.Flex}
                    iconName={IconName.Export}
                    color={Color.iconMuted}
                    onClick={() => {
                      const blockExplorerTokenLink = getAccountLink(
                        tokenAddress,
                        chainId,
                        {
                          blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
                        },
                        null,
                      );
                      global.platform.openTab({
                        url: blockExplorerTokenLink,
                      });
                    }}
                    ariaLabel={t('openInBlockExplorer')}
                  />
                </Tooltip>
              </Box>
            </Box>
          </>
        )}
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          display={Display.Flex}
          marginTop={4}
          marginBottom={2}
        >
          {nft && t('contractRequestingAccess')}
          {isContractRequestingSignature && t('contractRequestingSignature')}
          {!nft &&
            !isContractRequestingSignature &&
            t('contractRequestingSpendingCap')}
        </Text>
        <Box
          display={Display.Flex}
          borderRadius={Size.SM}
          borderStyle={BorderStyle.solid}
          borderColor={BorderColor.borderDefault}
          alignItems={AlignItems.center}
          className="contract-details-modal__content__contract"
        >
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            diameter={24}
            address={toAddress}
          />
          <Box data-testid="recipient">
            {petnamesEnabled ? (
              <Text variant={TextVariant.bodyMd} as="h5">
                <Name value={toAddress} type={NameType.ETHEREUM_ADDRESS} />
              </Text>
            ) : (
              <Text
                fontWeight={FontWeight.Bold}
                variant={TextVariant.bodyMd}
                as="h5"
              >
                {addressBookEntry?.data?.name || ellipsify(toAddress)}
              </Text>
            )}
            {!petnamesEnabled && addressBookEntry?.data?.name && (
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                display={Display.Flex}
                color={TextColor.textAlternative}
                marginBottom={4}
              >
                {ellipsify(toAddress)}
              </Text>
            )}
          </Box>
          <Box
            alignItems={AlignItems.center}
            marginLeft="auto"
            marginRight={4}
            gap={2}
          >
            <Tooltip
              position="top"
              title={
                copiedToAddress ? t('copiedExclamation') : t('copyToClipboard')
              }
            >
              <ButtonIcon
                display={Display.Flex}
                iconName={
                  copiedToAddress ? IconName.CopySuccess : IconName.Copy
                }
                onClick={() => handleCopyToAddress(toAddress)}
                color={Color.iconMuted}
                ariaLabel={
                  copiedTokenAddress
                    ? t('copiedExclamation')
                    : t('copyToClipboard')
                }
              />
            </Tooltip>
            <Tooltip position="top" title={t('openInBlockExplorer')}>
              <ButtonIcon
                display={Display.Flex}
                iconName={IconName.Export}
                color={Color.iconMuted}
                onClick={() => {
                  const blockExplorerTokenLink = getAccountLink(
                    toAddress,
                    chainId,
                    {
                      blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
                    },
                    null,
                  );
                  global.platform.openTab({
                    url: blockExplorerTokenLink,
                  });
                }}
                ariaLabel={t('openInBlockExplorer')}
              />
            </Tooltip>
          </Box>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        paddingTop={6}
        paddingRight={4}
        paddingBottom={6}
        paddingLeft={4}
      >
        <Button type="primary" onClick={() => onClose()}>
          {t('recoveryPhraseReminderConfirm')}
        </Button>
      </Box>
    </Popover>
  );
}

ContractDetailsModal.propTypes = {
  /**
   * Function that should close the modal
   */
  onClose: PropTypes.func,
  /**
   * Name of the token that is waiting to be allowed
   */
  tokenName: PropTypes.string,
  /**
   * Address of the token that is waiting to be allowed
   */
  tokenAddress: PropTypes.string,
  /**
   * Contract address requesting spending cap
   */
  toAddress: PropTypes.string,
  /**
   * Current network chainId
   */
  chainId: PropTypes.string,
  /**
   * RPC prefs of the current network
   */
  rpcPrefs: PropTypes.object,
  /**
   * The token id of the NFT
   */
  tokenId: PropTypes.string,
  /**
   * Token Standard
   */
  assetStandard: PropTypes.string,
  /**
   * The name of the collection
   */
  assetName: PropTypes.string,
  /**
   * Whether contract requesting signature flow has started
   */
  isContractRequestingSignature: PropTypes.bool,
};
