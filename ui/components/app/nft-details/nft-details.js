import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { isEqual } from 'lodash';
import Box from '../../ui/box';
import Card from '../../ui/card';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  OVERFLOW_WRAP,
  DISPLAY,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAssetImageURL, shortenAddress } from '../../../helpers/utils/util';
import {
  getCurrentChainId,
  getIpfsGateway,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors';
import AssetNavigation from '../../../pages/asset/components/asset-navigation';
import Copy from '../../ui/icon/copy-icon.component';
import { getNftContracts } from '../../../ducks/metamask/metamask';
import { DEFAULT_ROUTE, SEND_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateSingleNftOwnershipStatus,
  removeAndIgnoreNft,
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
import { ASSET_TYPES, ERC721 } from '../../../../shared/constants/transaction';
import NftDefaultImage from '../nft-default-image';

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
  } = nft;
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const ipfsGateway = useSelector(getIpfsGateway);
  const nftContracts = useSelector(getNftContracts);
  const currentNetwork = useSelector(getCurrentChainId);
  const [copied, handleCopy] = useCopyToClipboard();

  const nftContractName = nftContracts.find(({ address: contractAddress }) =>
    isEqualCaseInsensitive(contractAddress, address),
  )?.name;
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const nftImageURL = getAssetImageURL(imageOriginal ?? image, ipfsGateway);

  const onRemove = () => {
    dispatch(removeAndIgnoreNft(address, tokenId));
    history.push(DEFAULT_ROUTE);
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
        return `https://opensea.io/assets/${address}/${tokenId}`;
      case CHAIN_IDS.POLYGON:
        return `https://opensea.io/assets/matic/${address}/${tokenId}`;
      case CHAIN_IDS.GOERLI:
      case CHAIN_IDS.SEPOLIA:
        return `https://testnets.opensea.io/assets/${address}/${tokenId}`;
      default:
        return null;
    }
  };

  const openSeaLink = getOpenSeaLink();
  const sendDisabled = standard !== ERC721;
  const inPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const onSend = async () => {
    await dispatch(
      startNewDraftTransaction({
        type: ASSET_TYPES.NFT,
        details: nft,
      }),
    );
    history.push(SEND_ROUTE);
  };

  const renderSendButton = () => {
    if (isCurrentlyOwned === false) {
      return <div style={{ height: '30px' }} />;
    }
    return (
      <Box
        display={DISPLAY.FLEX}
        width={inPopUp ? BLOCK_SIZES.FULL : BLOCK_SIZES.HALF}
        margin={inPopUp ? [4, 0] : null}
      >
        <Button
          type="primary"
          onClick={onSend}
          disabled={sendDisabled}
          className="nft-details__send-button"
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
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={nftContractName}
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
        <div className="nft-details__top-section">
          <Card
            padding={0}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            className="nft-details__card"
          >
            {image ? (
              <img className="nft-details__image" src={image} />
            ) : (
              <NftDefaultImage name={name} tokenId={tokenId} />
            )}
          </Card>
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            className="nft-details__info"
            justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
          >
            <div>
              <Typography
                color={COLORS.TEXT_DEFAULT}
                variant={TYPOGRAPHY.H4}
                fontWeight={FONT_WEIGHT.BOLD}
                boxProps={{ margin: 0, marginBottom: 2 }}
              >
                {name}
              </Typography>
              <Typography
                color={COLORS.TEXT_MUTED}
                variant={TYPOGRAPHY.H5}
                boxProps={{ margin: 0, marginBottom: 4 }}
                overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
              >
                #{tokenId}
              </Typography>
            </div>
            {description ? (
              <div>
                <Typography
                  color={COLORS.TEXT_DEFAULT}
                  variant={TYPOGRAPHY.H6}
                  fontWeight={FONT_WEIGHT.BOLD}
                  className="nft-details__description"
                  boxProps={{ margin: 0, marginBottom: 2 }}
                >
                  {t('description')}
                </Typography>
                <Typography
                  color={COLORS.TEXT_ALTERNATIVE}
                  variant={TYPOGRAPHY.H6}
                  overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
                  boxProps={{ margin: 0, marginBottom: 4 }}
                >
                  {description}
                </Typography>
              </div>
            ) : null}
            {inPopUp ? null : renderSendButton()}
          </Box>
        </div>
        <Box marginBottom={2}>
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
            <Typography
              color={COLORS.TEXT_DEFAULT}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{
                margin: 0,
                marginBottom: 4,
                marginRight: 2,
              }}
              className="nft-details__link-title"
            >
              {t('source')}
            </Typography>
            <Typography
              color={COLORS.PRIMARY_DEFAULT}
              variant={TYPOGRAPHY.H6}
              boxProps={{
                margin: 0,
                marginBottom: 4,
              }}
              className="nft-details__image-link"
            >
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={nftImageURL}
                title={nftImageURL}
              >
                {nftImageURL}
              </a>
            </Typography>
          </Box>
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
            <Typography
              color={COLORS.TEXT_DEFAULT}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{
                margin: 0,
                marginBottom: 4,
                marginRight: 2,
              }}
              className="nft-details__link-title"
            >
              {t('contractAddress')}
            </Typography>
            <Box
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.ROW}
              className="nft-details__contract-wrapper"
            >
              <Typography
                color={COLORS.PRIMARY_DEFAULT}
                variant={TYPOGRAPHY.H6}
                overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
                boxProps={{
                  margin: 0,
                  marginBottom: 4,
                }}
                className="nft-details__contract-link"
              >
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={getTokenTrackerLink(
                    address,
                    currentNetwork,
                    null,
                    null,
                    rpcPrefs,
                  )}
                  title={address}
                >
                  {inPopUp ? shortenAddress(address) : address}
                </a>
              </Typography>
              <button
                className="nft-details__contract-copy-button"
                onClick={() => {
                  handleCopy(address);
                }}
              >
                {copied ? (
                  t('copiedExclamation')
                ) : (
                  <Copy size={15} color="var(--color-icon-alternative)" />
                )}
              </button>
            </Box>
          </Box>
          {inPopUp ? renderSendButton() : null}
        </Box>
      </Box>
    </>
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
  }),
};
