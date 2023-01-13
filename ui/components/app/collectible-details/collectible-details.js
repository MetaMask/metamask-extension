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
import { getCollectibleContracts } from '../../../ducks/metamask/metamask';
import { DEFAULT_ROUTE, SEND_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateSingleNftOwnershipStatus,
  removeAndIgnoreNft,
} from '../../../store/actions';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import CollectibleOptions from '../collectible-options/collectible-options';
import Button from '../../ui/button';
import { startNewDraftTransaction } from '../../../ducks/send';
import InfoTooltip from '../../ui/info-tooltip';
import { usePrevious } from '../../../hooks/usePrevious';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { ASSET_TYPES, ERC721 } from '../../../../shared/constants/transaction';
import CollectibleDefaultImage from '../collectible-default-image';

export default function CollectibleDetails({ collectible }) {
  const {
    image,
    imageOriginal,
    name,
    description,
    address,
    tokenId,
    standard,
    isCurrentlyOwned,
  } = collectible;
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const ipfsGateway = useSelector(getIpfsGateway);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const currentNetwork = useSelector(getCurrentChainId);
  const [sourceCopied, handleSourceCopy] = useCopyToClipboard();
  const [addressCopied, handleAddressCopy] = useCopyToClipboard();

  const collectibleContractName = collectibleContracts.find(
    ({ address: contractAddress }) =>
      isEqualCaseInsensitive(contractAddress, address),
  )?.name;
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const collectibleImageURL = getAssetImageURL(
    imageOriginal ?? image,
    ipfsGateway,
  );
  const isDataURI = collectibleImageURL.startsWith('data:');

  const onRemove = () => {
    dispatch(removeAndIgnoreNft(address, tokenId));
    history.push(DEFAULT_ROUTE);
  };

  const prevCollectible = usePrevious(collectible);
  useEffect(() => {
    if (!isEqual(prevCollectible, collectible)) {
      checkAndUpdateSingleNftOwnershipStatus(collectible);
    }
  }, [collectible, prevCollectible]);

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
        details: collectible,
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
          className="collectible-details__send-button"
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
        assetName={collectibleContractName}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <CollectibleOptions
            onViewOnOpensea={
              openSeaLink
                ? () => global.platform.openTab({ url: openSeaLink })
                : null
            }
            onRemove={onRemove}
          />
        }
      />
      <Box className="collectible-details">
        <div className="collectible-details__top-section">
          <Card
            padding={0}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            className="collectible-details__card"
          >
            {image ? (
              <img className="collectible-details__image" src={image} />
            ) : (
              <CollectibleDefaultImage name={name} tokenId={tokenId} />
            )}
          </Card>
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            className="collectible-details__info"
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
                  className="collectible-details__description"
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
              className="collectible-details__link-title"
            >
              {t('source')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H6}
              boxProps={{
                margin: 0,
                marginBottom: 4,
              }}
              className="collectible-details__image-source"
              color={isDataURI ? COLORS.TEXT_DEFAULT : COLORS.PRIMARY_DEFAULT}
            >
              {isDataURI ? (
                <>{collectibleImageURL}</>
              ) : (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={collectibleImageURL}
                  title={collectibleImageURL}
                >
                  {collectibleImageURL}
                </a>
              )}
            </Typography>
            <button
              className="collectible-details__contract-copy-button"
              onClick={() => {
                handleSourceCopy(collectibleImageURL);
              }}
            >
              {sourceCopied ? (
                t('copiedExclamation')
              ) : (
                <Copy size={15} color="var(--color-icon-alternative)" />
              )}
            </button>
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
              className="collectible-details__link-title"
            >
              {t('contractAddress')}
            </Typography>
            <Box
              display={DISPLAY.FLEX}
              flexDirection={FLEX_DIRECTION.ROW}
              className="collectible-details__contract-wrapper"
            >
              <Typography
                color={COLORS.PRIMARY_DEFAULT}
                variant={TYPOGRAPHY.H6}
                overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
                boxProps={{
                  margin: 0,
                  marginBottom: 4,
                }}
                className="collectible-details__contract-link"
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
                className="collectible-details__contract-copy-button"
                onClick={() => {
                  handleAddressCopy(address);
                }}
              >
                {addressCopied ? (
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

CollectibleDetails.propTypes = {
  collectible: PropTypes.shape({
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
