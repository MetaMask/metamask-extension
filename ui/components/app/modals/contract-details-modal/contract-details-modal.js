import React from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import Box from '../../../ui/box';
import IconCopy from '../../../ui/icon/icon-copy';
import IconBlockExplorer from '../../../ui/icon/icon-block-explorer';
import Button from '../../../ui/button/button.component';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Identicon from '../../../ui/identicon';
import { ellipsify } from '../../../../pages/send/send.utils';
import Popover from '../../../ui/popover';
import Typography from '../../../ui/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  DISPLAY,
  COLORS,
  JUSTIFY_CONTENT,
  SIZES,
  BORDER_STYLE,
  TEXT_ALIGN,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import UrlIcon from '../../../ui/url-icon/url-icon';
import { getAddressBookEntry, getTokenList } from '../../../../selectors';
import { ERC1155, ERC721 } from '../../../../../shared/constants/transaction';

export default function ContractDetailsModal({
  onClose,
  tokenName,
  tokenAddress,
  toAddress,
  chainId,
  rpcPrefs,
  origin,
  siteImage,
  tokenId,
  assetName,
  assetStandard,
  collections = {},
}) {
  const t = useI18nContext();
  const [copiedTokenAddress, handleCopyTokenAddress] = useCopyToClipboard();
  const [copiedToAddress, handleCopyToAddress] = useCopyToClipboard();

  const addressBookEntry = useSelector((state) => ({
    data: getAddressBookEntry(state, toAddress),
  }));
  const nft =
    assetStandard === ERC721 ||
    assetStandard === ERC1155 ||
    // if we don't have an asset standard but we do have either both an assetname and a tokenID or both a tokenName and tokenId we assume its an NFT
    (assetName && tokenId) ||
    (tokenName && tokenId);

  let contractTitle;
  let contractRequesting;
  if (nft) {
    contractTitle = t('contractNFT');
    contractRequesting = t('contractRequestingAccess');
  } else {
    contractTitle = t('contractToken');
    contractRequesting = t('contractRequestingSpendingCap');
  }

  const tokenList = useSelector(getTokenList);

  const nftTokenListImage = tokenList[tokenAddress.toLowerCase()]?.iconUrl;

  let nftCollectionNameExist;
  let nftCollectionImageExist;

  Object.values(collections).forEach((nftCollections) => {
    if (nftCollections.collectionName === assetName) {
      nftCollectionNameExist = nftCollections.collectionName;
      nftCollectionImageExist = nftCollections.collectionImage;
    }
  });

  const renderCollectionImage = (collectionImage, collectionName, key) => {
    if (collectionImage) {
      return (
        <Identicon
          className="contract-details-modal__content__contract__identicon"
          diameter={24}
          image={collectionImage}
        />
      );
    }
    return (
      <Box
        key={key}
        color={COLORS.OVERLAY_INVERSE}
        textAlign={TEXT_ALIGN.CENTER}
        className="contract-details-modal__content__contract__collection"
      >
        {collectionName?.[0]?.toUpperCase() ?? null}
      </Box>
    );
  };

  return (
    <Popover className="contract-details-modal">
      <Box
        paddingTop={6}
        paddingRight={4}
        paddingBottom={8}
        paddingLeft={4}
        className="contract-details-modal__content"
      >
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TYPOGRAPHY.H5}
          display={DISPLAY.FLEX}
          boxProps={{ marginTop: 0, marginBottom: 0 }}
        >
          {t('contractTitle')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H7}
          display={DISPLAY.FLEX}
          color={COLORS.TEXT_ALTERNATIVE}
          boxProps={{ marginTop: 2, marginBottom: 0 }}
        >
          {t('contractDescription')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H6}
          display={DISPLAY.FLEX}
          marginTop={4}
          marginBottom={2}
        >
          {contractTitle}
        </Typography>
        <Box
          display={DISPLAY.FLEX}
          borderRadius={SIZES.SM}
          borderStyle={BORDER_STYLE.SOLID}
          borderColor={COLORS.BORDER_DEFAULT}
          className="contract-details-modal__content__contract"
        >
          {nft ? (
            <>
              {Object.keys(collections).length > 0 && nftCollectionNameExist
                ? renderCollectionImage(
                    nftCollectionImageExist,
                    nftCollectionNameExist,
                  )
                : renderCollectionImage(nftTokenListImage, assetName)}
            </>
          ) : (
            <Identicon
              className="contract-details-modal__content__contract__identicon"
              address={tokenAddress}
              diameter={24}
            />
          )}
          <Box data-testid="recipient">
            <Typography
              fontWeight={FONT_WEIGHT.BOLD}
              variant={TYPOGRAPHY.H5}
              marginTop={4}
            >
              {tokenName || ellipsify(tokenAddress)}
            </Typography>
            {tokenName && (
              <Typography
                variant={TYPOGRAPHY.H6}
                display={DISPLAY.FLEX}
                color={COLORS.TEXT_ALTERNATIVE}
                marginTop={0}
                marginBottom={4}
              >
                {ellipsify(tokenAddress)}
              </Typography>
            )}
          </Box>
          <Box
            justifyContent={JUSTIFY_CONTENT.FLEX_END}
            className="contract-details-modal__content__contract__buttons"
          >
            <Box marginTop={4} marginRight={5}>
              <Tooltip
                position="top"
                title={
                  copiedTokenAddress
                    ? t('copiedExclamation')
                    : t('copyToClipboard')
                }
              >
                <Button
                  className="contract-details-modal__content__contract__buttons__copy"
                  type="link"
                  onClick={() => {
                    handleCopyTokenAddress(tokenAddress);
                  }}
                >
                  <IconCopy color="var(--color-icon-muted)" />
                </Button>
              </Tooltip>
            </Box>
            <Box marginTop={5} marginRight={5}>
              <Tooltip position="top" title={t('openInBlockExplorer')}>
                <Button
                  className="contract-details-modal__content__contract__buttons__block-explorer"
                  type="link"
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
                >
                  <IconBlockExplorer
                    size={16}
                    color="var(--color-icon-muted)"
                  />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Typography
          variant={TYPOGRAPHY.H6}
          display={DISPLAY.FLEX}
          marginTop={4}
          marginBottom={2}
        >
          {contractRequesting}
        </Typography>
        <Box
          display={DISPLAY.FLEX}
          borderRadius={SIZES.SM}
          borderStyle={BORDER_STYLE.SOLID}
          borderColor={COLORS.BORDER_DEFAULT}
          className="contract-details-modal__content__contract"
        >
          {nft ? (
            <Identicon
              className="contract-details-modal__content__contract__identicon"
              diameter={24}
              address={toAddress}
            />
          ) : (
            <UrlIcon
              className={classnames({
                'contract-details-modal__content__contract__identicon-for-unknown-contact':
                  addressBookEntry?.data?.name === undefined,
                'contract-details-modal__content__contract__identicon':
                  addressBookEntry?.data?.name !== undefined,
              })}
              fallbackClassName={classnames({
                'contract-details-modal__content__contract__identicon-for-unknown-contact':
                  addressBookEntry?.data?.name === undefined,
                'contract-details-modal__content__contract__identicon':
                  addressBookEntry?.data?.name !== undefined,
              })}
              name={origin}
              url={siteImage}
            />
          )}
          <Box data-testid="recipient">
            <Typography
              fontWeight={FONT_WEIGHT.BOLD}
              variant={TYPOGRAPHY.H5}
              marginTop={4}
            >
              {addressBookEntry?.data?.name || ellipsify(toAddress)}
            </Typography>
            {addressBookEntry?.data?.name && (
              <Typography
                variant={TYPOGRAPHY.H6}
                display={DISPLAY.FLEX}
                color={COLORS.TEXT_ALTERNATIVE}
                marginTop={0}
                marginBottom={4}
              >
                {ellipsify(toAddress)}
              </Typography>
            )}
          </Box>
          <Box
            justifyContent={JUSTIFY_CONTENT.FLEX_END}
            className="contract-details-modal__content__contract__buttons"
          >
            <Box marginTop={4} marginRight={5}>
              <Tooltip
                position="top"
                title={
                  copiedToAddress
                    ? t('copiedExclamation')
                    : t('copyToClipboard')
                }
              >
                <Button
                  className="contract-details-modal__content__contract__buttons__copy"
                  type="link"
                  onClick={() => {
                    handleCopyToAddress(toAddress);
                  }}
                >
                  <IconCopy color="var(--color-icon-muted)" />
                </Button>
              </Tooltip>
            </Box>
            <Box marginTop={5} marginRight={5}>
              <Tooltip position="top" title={t('openInBlockExplorer')}>
                <Button
                  className="contract-details-modal__content__contract__buttons__block-explorer"
                  type="link"
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
                >
                  <IconBlockExplorer
                    size={16}
                    color="var(--color-icon-muted)"
                  />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        display={DISPLAY.FLEX}
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
   * Dapp URL
   */
  origin: PropTypes.string,
  /**
   * Dapp image
   */
  siteImage: PropTypes.string,
  /**
   * The token id of the collectible
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
   * NFTs Collection
   */
  collections: PropTypes.shape({
    collectibles: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string.isRequired,
        tokenId: PropTypes.string.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.string,
        standard: PropTypes.string,
        imageThumbnail: PropTypes.string,
        imagePreview: PropTypes.string,
        creator: PropTypes.shape({
          address: PropTypes.string,
          config: PropTypes.string,
          profile_img_url: PropTypes.string,
        }),
      }),
    ),
    collectionImage: PropTypes.string,
    collectionName: PropTypes.string,
  }),
};
