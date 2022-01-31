import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon/identicon.component';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';
import Box from '../box';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  COLORS,
  DISPLAY,
  FONT_WEIGHT,
  SIZES,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Typography from '../typography';

const NewNetworkInfo = ({
  onClose,
  autoDetectToken,
  tokenImage,
  providerTicker,
  providerNickname,
  providerType,
  onManuallyAddClick,
  tokenDetectionSupported,
}) => {
  const t = useContext(I18nContext);

  return (
    <Popover
      onClose={onClose}
      className="new-network-info__wrapper"
      footer={
        <Button type="primary" onClick={onClose}>
          {t('recoveryPhraseReminderConfirm')}
        </Button>
      }
    >
      <Typography
        variant={TYPOGRAPHY.H4}
        color={COLORS.BLACK}
        fontWeight={FONT_WEIGHT[700]}
        align={TEXT_ALIGN.CENTER}
        className="new-network-info__title"
      >
        {t('switchedTo')}
      </Typography>
      <Box
        backgroundColor={COLORS.UI1}
        borderRadius={SIZES.XL}
        marginTop={2}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        height={BLOCK_SIZES.ONE_TWELFTH}
        width={BLOCK_SIZES.FIVE_TWELFTHS}
        padding={[0, 2, 0, 2]}
        className="new-network-info__token-box"
      >
        {tokenImage ? (
          <Identicon image={tokenImage} diameter={14} />
        ) : (
          <i className="fa fa-question-circle" />
        )}
        <Typography
          variant={TYPOGRAPHY.H7}
          color={COLORS.BLACK}
          margin={[0, 0, 0, 2]}
        >
          {providerType === NETWORK_TYPE_RPC
            ? providerNickname ?? t('privateNetwork')
            : t(providerType)}
        </Typography>
      </Box>
      <Typography
        variant={TYPOGRAPHY.H7}
        color={COLORS.BLACK}
        fontWeight={FONT_WEIGHT[700]}
        className="new-network-info__subtitle"
      >
        {t('thingsToKeep')}
      </Typography>
      <Box marginRight={4} marginLeft={5}>
        {providerTicker ? (
          <Box
            display={DISPLAY.FLEX}
            alignItems={ALIGN_ITEMS.CENTER}
            paddingBottom={2}
            marginBottom={2}
            width={BLOCK_SIZES.ELEVEN_TWELFTHS}
            className="new-network-info__content-box-1"
          >
            <Box marginRight={4} color={COLORS.BLACK}>
              &bull;
            </Box>
            <Typography
              variant={TYPOGRAPHY.H7}
              color={COLORS.BLACK}
              boxProps={{ display: DISPLAY.INLINE_BLOCK }}
              className="new-network-info__content-box-1__text-1"
            >
              {t('nativeToken', [
                <>
                  <Typography
                    variant={TYPOGRAPHY.H7}
                    boxProps={{ display: DISPLAY.INLINE_BLOCK }}
                    fontWeight={FONT_WEIGHT[700]}
                  >
                    {providerTicker}
                  </Typography>
                </>,
              ])}
            </Typography>
          </Box>
        ) : null}
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          className={
            !autoDetectToken || !tokenDetectionSupported
              ? 'new-network-info__content-box-1'
              : null
          }
        >
          <Box marginRight={4} color={COLORS.BLACK}>
            &bull;
          </Box>
          <Typography
            variant={TYPOGRAPHY.H7}
            color={COLORS.BLACK}
            boxProps={{ display: DISPLAY.INLINE_BLOCK }}
            className="new-network-info__content-box-1__text-1"
          >
            {t('attemptSendingAssets')}{' '}
            <a
              href="https://metamask.zendesk.com/hc/en-us/articles/4404424659995"
              target="_blank"
              rel="noreferrer"
            >
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.PRIMARY1}
                boxProps={{ display: DISPLAY.INLINE_BLOCK }}
              >
                {t('learnMoreUpperCase')}
              </Typography>
            </a>
          </Typography>
        </Box>
        {!autoDetectToken || !tokenDetectionSupported ? (
          <Box
            display={DISPLAY.FLEX}
            alignItems={ALIGN_ITEMS.CENTER}
            width={BLOCK_SIZES.ELEVEN_TWELFTHS}
          >
            <Box marginRight={4} color={COLORS.BLACK}>
              &bull;
            </Box>
            <Box width={BLOCK_SIZES.FOUR_FIFTHS}>
              <Typography variant={TYPOGRAPHY.H7} color={COLORS.BLACK}>
                {t('tokenShowUp')}{' '}
                <Button
                  type="link"
                  onClick={onManuallyAddClick}
                  className="new-network-info__button"
                >
                  {t('clickToManuallyAdd')}
                </Button>
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Popover>
  );
};

NewNetworkInfo.propTypes = {
  onClose: PropTypes.func,
  autoDetectToken: PropTypes.bool,
  tokenImage: PropTypes.string,
  providerTicker: PropTypes.string,
  providerNickname: PropTypes.string,
  providerType: PropTypes.string,
  onManuallyAddClick: PropTypes.func,
  tokenDetectionSupported: PropTypes.bool,
};

export default NewNetworkInfo;
