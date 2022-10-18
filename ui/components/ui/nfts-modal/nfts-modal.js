import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Popover from '../popover';
import Box from '../box';
import Card from '../card';
import Button from '../button';
import Typography from '../typography';
import {
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
  COLORS,
  BLOCK_SIZES,
  TEXT_ALIGN,
  FLEX_WRAP,
  SIZES,
} from '../../../helpers/constants/design-system';
import { getIpfsGateway } from '../../../selectors';
import Identicon from '../identicon';
import { shortenAddress, getAssetImageURL } from '../../../helpers/utils/util';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import CollectibleDefaultImage from '../../app/collectible-default-image';

export default function NftsModal({
  collections = {},
  senderAddress,
  accountName,
  assetName,
  total,
  isSetApproveForAll,
  onClose,
}) {
  const t = useI18nContext();
  const collectionsKeys = Object.keys(collections);
  const ipfsGateway = useSelector(getIpfsGateway);

  const footer = (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
      width={BLOCK_SIZES.SCREEN}
      className="nfts-modal__footer"
    >
      <Button
        className="nfts-modal__footer__got-it-button"
        type="primary"
        onClick={() => onClose()}
      >
        {t('recoveryPhraseReminderConfirm')}
      </Button>
    </Box>
  );

  const renderCollection = ({ collectibles, collectionName, key }) => {
    return (
      <Box className="nfts-modal__collection" key={`collection-${key}`}>
        {collectionName === assetName ? (
          <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP} gap={4}>
            {collectibles.map((collectible, i) => {
              const { image, tokenId, backgroundColor, name } = collectible;
              const collectibleImage = getAssetImageURL(image, ipfsGateway);

              if (!isSetApproveForAll && i === 0) {
                return (
                  <Box
                    width={BLOCK_SIZES.ONE_THIRD}
                    key={`collectible-${i}`}
                    className="nfts-modal__item-wrapper"
                  >
                    <Card
                      padding={0}
                      justifyContent={JUSTIFY_CONTENT.CENTER}
                      className="nfts-modal__item-wrapper__card"
                    >
                      {collectibleImage ? (
                        <Box
                          borderRadius={SIZES.SM}
                          display={DISPLAY.FLEX}
                          justifyContent={JUSTIFY_CONTENT.CENTER}
                          className="nfts-modal__item"
                          style={{
                            backgroundColor,
                          }}
                        >
                          <img
                            className="nfts-modal__item-image"
                            src={collectibleImage}
                          />
                        </Box>
                      ) : (
                        <CollectibleDefaultImage
                          name={name}
                          tokenId={tokenId}
                        />
                      )}
                    </Card>
                  </Box>
                );
              } else if (isSetApproveForAll) {
                return (
                  <Box
                    width={BLOCK_SIZES.ONE_THIRD}
                    key={`collectible-${i}`}
                    className="nfts-modal__item-wrapper"
                  >
                    <Card
                      padding={0}
                      justifyContent={JUSTIFY_CONTENT.CENTER}
                      className="nfts-modal__item-wrapper__card"
                    >
                      {collectibleImage ? (
                        <Box
                          borderRadius={SIZES.SM}
                          display={DISPLAY.FLEX}
                          justifyContent={JUSTIFY_CONTENT.CENTER}
                          className="nfts-modal__item"
                          style={{
                            backgroundColor,
                          }}
                        >
                          <img
                            className="nfts-modal__item-image"
                            src={collectibleImage}
                          />
                        </Box>
                      ) : (
                        <CollectibleDefaultImage
                          name={name}
                          tokenId={tokenId}
                        />
                      )}
                    </Card>
                  </Box>
                );
              }
              return null;
            })}
          </Box>
        ) : null}
      </Box>
    );
  };

  return (
    <Popover className="nfts-modal__content" footer={footer}>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        paddingTop={4}
        paddingLeft={4}
        paddingBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H4} fontWeight={FONT_WEIGHT.BOLD}>
          {t('nftsBeingAccessed')}
        </Typography>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        padding={4}
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
        className="nfts-modal__content__account"
      >
        <Box display={DISPLAY.FLEX}>
          <Identicon address={senderAddress} diameter={32} />
          <Typography
            variant={TYPOGRAPHY.H5}
            marginLeft={2}
            className="nfts-modal__content__account-name"
          >
            <b>{accountName}</b> {` (${shortenAddress(senderAddress)})`}
          </Typography>
        </Box>
        {isSetApproveForAll && (
          <Typography>{`${t('total')}: ${total}`}</Typography>
        )}
      </Box>
      <Box
        paddingTop={6}
        paddingBottom={6}
        paddingLeft={4}
        paddingRight={4}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        {collectionsKeys.map((key) => {
          const { collectibles, collectionName } = collections[key];

          return renderCollection({
            collectibles,
            collectionName,
            key,
          });
        })}
      </Box>

      {isSetApproveForAll && (
        <Typography
          variant={TYPOGRAPHY.H6}
          color={COLORS.PRIMARY_DEFAULT}
          marginBottom={4}
          align={TEXT_ALIGN.CENTER}
        >
          <a
            key="zendesk_page_link"
            href={ZENDESK_URLS.SET_APPROVAL_FOR_ALL}
            rel="noreferrer"
            target="_blank"
          >
            {t('noGivenAccessToAllNfts')}
          </a>
        </Typography>
      )}
    </Popover>
  );
}

NftsModal.propTypes = {
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
  }),
  senderAddress: PropTypes.string,
  accountName: PropTypes.string,
  assetName: PropTypes.string,
  total: PropTypes.number,
  isSetApproveForAll: PropTypes.bool,
  onClose: PropTypes.func,
};
