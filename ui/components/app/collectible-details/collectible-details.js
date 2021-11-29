import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  BLOCK_SIZES,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
  DISPLAY,
  OVERFLOW_WRAP,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAssetImageURL, shortenAddress } from '../../../helpers/utils/util';
import {
  getIpfsGateway,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors';
import AssetNavigation from '../../../pages/asset/components/asset-navigation';
import { getCollectibleContracts } from '../../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import CollectibleOptions from './collectible-options';

export default function CollectibleDetails({ collectible }) {
  const { image, name, standard, description, address, tokenId } = collectible;
  const t = useI18nContext();
  const history = useHistory();
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const ipfsGateway = useSelector(getIpfsGateway);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const collectibleContractName = collectibleContracts.find(
    ({ address }) => address === collectible.address,
  )?.name;
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const collectibleImageURL = getAssetImageURL(image, ipfsGateway);
  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={collectibleContractName}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <CollectibleOptions
            onRemove={() => {}}
            onReportAsScam={() => {}}
            onViewOnOpensea={() => {}}
          />
        }
      />
      <Box padding={[4, 2, 4, 2]}>
        <div
          // flexDirection={FLEX_DIRECTION.ROW} display={DISPLAY.FLEX}
          className="collectible-details"
        >
          <Box margin={3} padding={2} justifyContent={JUSTIFY_CONTENT.CENTER}>
            <img style={{ width: '14rem' }} src={collectibleImageURL} />
          </Box>
          <Box margin={3} flexDirection={FLEX_DIRECTION.COLUMN}>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H4}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {name}
            </Typography>
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H5}
              boxProps={{ marginTop: 2, marginBottom: 3 }}
            >
              {`#${tokenId}`}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              className="collectible-details__description"
            >
              {t('description')}
            </Typography>
            <Typography color={COLORS.UI3} variant={TYPOGRAPHY.H6}>
              {description}
            </Typography>
          </Box>
        </div>
        <Box margin={4} alignItems={ALIGN_ITEMS.FLEX_START}>
          <Box width={BLOCK_SIZES.ONE_THIRD}>
            {/* <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginBottom: 3 }}
            >
              {t('lastSold')}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginBottom: 3 }}
            >
              {t('lastPriceSold')}
            </Typography> */}
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginBottom: 3 }}
            >
              {t('source')}
            </Typography>
            {/* <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginBottom: 3 }}
            >
              {t('link')}
            </Typography> */}
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('contractAddress')}
            </Typography>
          </Box>
          <Box width={BLOCK_SIZES.TWO_THIRDS}>
            {/* <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {lastSold}
            </Typography>
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {lastPriceSold}
            </Typography>  */}
            <Typography
              color={COLORS.PRIMARY1}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
              // className="collectible-details__source"
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            >
              <a
                target="_blank"
                href={collectibleImageURL}
                rel="noopener noreferrer"
              >
                {image}
              </a>
            </Typography>
            {/* <Typography
              color={COLORS.PRIMARY1}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {link}
            </Typography> */}
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
              // className="collectible-details__address"
            >
              <a
                target="_blank"
                href={rpcPrefs.blockExplorerUrl}
                rel="noopener noreferrer"
              >
                {shortenAddress(address)}
              </a>
            </Typography>
          </Box>
        </Box>
        {/* <Box marginTop={6} justifyContent={JUSTIFY_CONTENT.CENTER}> */}
        {/* <Button type="primary" onClick={onSendNFT}>
          {t('send')}
        </Button> */}
        {/* </Box> */}
      </Box>
    </>
  );
}

CollectibleDetails.propTypes = {
  name: PropTypes.string,
  address: PropTypes.string,
  tokenId: PropTypes.string,
  imageURL: PropTypes.string,
  description: PropTypes.string,
  lastSold: PropTypes.string,
  lastPriceSold: PropTypes.string,
  link: PropTypes.string,
  // onSendNFT: PropTypes.func.isRequired,
};
