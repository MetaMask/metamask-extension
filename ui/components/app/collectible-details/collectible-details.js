import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
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
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAssetImageURL,
  isEqualCaseInsensitive,
  shortenAddress,
} from '../../../helpers/utils/util';
import {
  getCurrentChainId,
  getIpfsGateway,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors';
import AssetNavigation from '../../../pages/asset/components/asset-navigation';
import { getCollectibleContracts } from '../../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { removeAndIgnoreCollectible } from '../../../store/actions';
import {
  GOERLI_CHAIN_ID,
  KOVAN_CHAIN_ID,
  MAINNET_CHAIN_ID,
  POLYGON_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  ROPSTEN_CHAIN_ID,
} from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import CollectibleOptions from '../collectible-options/collectible-options';

export default function CollectibleDetails({ collectible }) {
  const { image, name, description, address, tokenId } = collectible;
  const t = useI18nContext();
  const history = useHistory();
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const ipfsGateway = useSelector(getIpfsGateway);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const currentNetwork = useSelector(getCurrentChainId);

  const collectibleContractName = collectibleContracts.find(
    ({ address: contractAddress }) =>
      isEqualCaseInsensitive(contractAddress, address),
  )?.name;
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const collectibleImageURL = getAssetImageURL(image, ipfsGateway);
  const dispatch = useDispatch();

  const onRemove = () => {
    dispatch(removeAndIgnoreCollectible(address, tokenId));
    history.push(DEFAULT_ROUTE);
  };

  const getOpenSeaLink = () => {
    switch (currentNetwork) {
      case MAINNET_CHAIN_ID:
        return `https://opensea.io/assets/${address}/${tokenId}`;
      case POLYGON_CHAIN_ID:
        return `https://opensea.io/assets/matic/${address}/${tokenId}`;
      case GOERLI_CHAIN_ID:
      case KOVAN_CHAIN_ID:
      case ROPSTEN_CHAIN_ID:
      case RINKEBY_CHAIN_ID:
        return `https://testnets.opensea.io/assets/${address}/${tokenId}`;
      default:
        return null;
    }
  };

  const openSeaLink = getOpenSeaLink();
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
            <img
              className="collectible-details__image"
              src={collectibleImageURL}
            />
          </Card>
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            className="collectible-details__top-section__info"
          >
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H4}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ margin: 0, marginBottom: 4 }}
            >
              {name}
            </Typography>
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H5}
              boxProps={{ margin: 0, marginBottom: 4 }}
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            >
              {`#${tokenId}`}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              className="collectible-details__description"
              boxProps={{ margin: 0, marginBottom: 2 }}
            >
              {t('description')}
            </Typography>
            <Typography
              color={COLORS.UI4}
              variant={TYPOGRAPHY.H6}
              boxProps={{ margin: 0 }}
            >
              {description}
            </Typography>
          </Box>
        </div>
        <Box>
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
            <Typography
              color={COLORS.BLACK}
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
              color={COLORS.PRIMARY1}
              variant={TYPOGRAPHY.H6}
              boxProps={{
                margin: 0,
                marginBottom: 4,
              }}
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            >
              <a
                target="_blank"
                href={collectibleImageURL}
                rel="noopener noreferrer"
                className="collectible-details__image-link"
              >
                {image}
              </a>
            </Typography>
          </Box>
          <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
            <Typography
              color={COLORS.BLACK}
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
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
              boxProps={{
                margin: 0,
                marginBottom: 4,
              }}
            >
              <a
                target="_blank"
                className="collectible-details__contract-link"
                href={getTokenTrackerLink(
                  address,
                  currentNetwork,
                  null,
                  null,
                  rpcPrefs,
                )}
                rel="noopener noreferrer"
              >
                {getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                  ? shortenAddress(address)
                  : address}
              </a>
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

CollectibleDetails.propTypes = {
  collectible: PropTypes.shape({
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
};
