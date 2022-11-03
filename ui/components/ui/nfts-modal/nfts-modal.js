import React from 'react';
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
import Identicon from '../identicon';
import { shortenAddress } from '../../../helpers/utils/util';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import CollectibleDefaultImage from '../../app/collectible-default-image';

export default function NftsModal({
  senderAddress,
  accountName,
  assetName,
  tokenImage,
  tokenId,
  total,
  isSetApproveForAll,
  onClose,
}) {
  const t = useI18nContext();

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
        <Box className="nfts-modal__collection">
          <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP} gap={4}>
            <Box
              width={BLOCK_SIZES.ONE_THIRD}
              className="nfts-modal__item-wrapper"
            >
              <Card
                padding={0}
                justifyContent={JUSTIFY_CONTENT.CENTER}
                className="nfts-modal__item-wrapper__card"
              >
                {tokenImage ? (
                  <Box
                    borderRadius={SIZES.SM}
                    display={DISPLAY.FLEX}
                    justifyContent={JUSTIFY_CONTENT.CENTER}
                    className="nfts-modal__item"
                  >
                    <img className="nfts-modal__item-image" src={tokenImage} />
                  </Box>
                ) : (
                  <CollectibleDefaultImage name={assetName} tokenId={tokenId} />
                )}
              </Card>
            </Box>
          </Box>
        </Box>
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
  senderAddress: PropTypes.string,
  accountName: PropTypes.string,
  assetName: PropTypes.string,
  tokenImage: PropTypes.string,
  tokenId: PropTypes.string,
  total: PropTypes.number,
  isSetApproveForAll: PropTypes.bool,
  onClose: PropTypes.func,
};
