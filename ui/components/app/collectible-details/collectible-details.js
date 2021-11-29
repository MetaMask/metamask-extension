import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  BLOCK_SIZES,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAssetImageURL } from '../../../helpers/utils/util';
import { useSelector } from 'react-redux';
import { getIpfsGateway } from '../../../selectors';
import AssetNavigation from '../../../pages/asset/components/asset-navigation';

export default function CollectibleDetails({ collectible }) {
  const { image, name, standard, description, address, tokenId } = collectible;
  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);

  const collectibleImage = getAssetImageURL(image, ipfsGateway);

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={name}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <AssetOptions
            onRemove={() =>
              dispatch(showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
            }
            isEthNetwork={!rpcPrefs.blockExplorerUrl}
            onClickBlockExplorer={() => {
              blockExplorerLinkClickedEvent();
              global.platform.openTab({ url: tokenTrackerLink });
            }}
            onViewAccountDetails={() => {
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
            }}
            tokenSymbol={token.symbol}
          />
        }
      />
      <Box padding={[4, 2, 4, 2]}>
        <Box marginTop={4} justifyContent={JUSTIFY_CONTENT.CENTER}>
          <img style={{ width: '150px' }} src={collectibleImage} />
        </Box>
        <Box marginTop={4} flexDirection={FLEX_DIRECTION.COLUMN}>
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
          >
            {t('description')}
          </Typography>
          <Typography color={COLORS.UI3} variant={TYPOGRAPHY.H6}>
            {description}
          </Typography>
        </Box>
        <Box marginTop={4} alignItems={ALIGN_ITEMS.FLEX_START}>
          <Box width={BLOCK_SIZES.ONE_THIRD}>
            <Typography
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
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginBottom: 3 }}
            >
              {t('source')}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginBottom: 3 }}
            >
              {t('link')}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('contractAddress')}
            </Typography>
          </Box>
          <Box width={BLOCK_SIZES.TWO_THIRDS}>
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {/* {lastSold} */}
            </Typography>
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {/* {lastPriceSold} */}
            </Typography>
            <Typography
              color={COLORS.PRIMARY1}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {collectibleImage}
            </Typography>
            <Typography
              color={COLORS.PRIMARY1}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 3 }}
            >
              {/* {link} */}
            </Typography>
            <Typography color={COLORS.UI3} variant={TYPOGRAPHY.H6}>
              {address}
            </Typography>
          </Box>
        </Box>
        <Box marginTop={6} justifyContent={JUSTIFY_CONTENT.CENTER}>
          {/* <Button type="primary" onClick={onSendNFT}>
          {t('send')}
        </Button> */}
        </Box>
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
