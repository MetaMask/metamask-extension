import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../popover';
import Button from '../button';
import Identicon from '../identicon';
import Box from '../box';
import {
  AlignItems,
  Color,
  DISPLAY,
  FONT_WEIGHT,
  TEXT_ALIGN,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import Typography from '../typography';
import { TOKEN_API_METASWAP_CODEFI_URL } from '../../../../shared/constants/tokens';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  getNativeCurrencyImage,
  getProvider,
  getUseTokenDetection,
} from '../../../selectors';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import Chip from '../chip/chip';
import { setFirstTimeUsedNetwork } from '../../../store/actions';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { Icon, ICON_NAMES } from '../../component-library/icon/deprecated';

const NewNetworkInfo = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const [tokenDetectionSupported, setTokenDetectionSupported] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const autoDetectToken = useSelector(getUseTokenDetection);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const currentProvider = useSelector(getProvider);

  const onCloseClick = () => {
    setShowPopup(false);
    setFirstTimeUsedNetwork(currentProvider.chainId);
  };

  const addTokenManually = () => {
    history.push(IMPORT_TOKEN_ROUTE);
    setShowPopup(false);
    setFirstTimeUsedNetwork(currentProvider.chainId);
  };

  const getIsTokenDetectionSupported = async () => {
    const fetchedTokenData = await fetchWithCache(
      `${TOKEN_API_METASWAP_CODEFI_URL}${currentProvider.chainId}`,
    );

    return !fetchedTokenData.error;
  };

  const checkTokenDetection = async () => {
    const fetchedData = await getIsTokenDetectionSupported();

    setTokenDetectionSupported(fetchedData);
  };

  useEffect(() => {
    checkTokenDetection();
  });

  if (!showPopup) {
    return null;
  }

  return (
    <Popover
      onClose={onCloseClick}
      className="new-network-info__wrapper"
      footer={
        <Button type="primary" onClick={onCloseClick}>
          {t('recoveryPhraseReminderConfirm')}
        </Button>
      }
    >
      <Typography
        variant={TypographyVariant.H4}
        color={Color.textDefault}
        fontWeight={FONT_WEIGHT.BOLD}
        align={TEXT_ALIGN.CENTER}
      >
        {t('switchedTo')}
      </Typography>
      <Chip
        className="new-network-info__token-box"
        backgroundColor={Color.backgroundAlternative}
        maxContent={false}
        label={
          currentProvider.type === NETWORK_TYPES.RPC
            ? currentProvider.nickname ?? t('privateNetwork')
            : t(currentProvider.type)
        }
        labelProps={{
          color: Color.textDefault,
        }}
        leftIcon={
          primaryTokenImage ? (
            <Identicon image={primaryTokenImage} diameter={14} />
          ) : (
            <Icon
              className="question"
              name={ICON_NAMES.QUESTION}
              color={Color.iconDefault}
            />
          )
        }
      />
      <Typography
        variant={TypographyVariant.H7}
        color={Color.textDefault}
        fontWeight={FONT_WEIGHT.BOLD}
        align={TEXT_ALIGN.CENTER}
        margin={[8, 0, 0, 0]}
      >
        {t('thingsToKeep')}
      </Typography>
      <Box marginRight={4} marginLeft={5} marginTop={6}>
        {currentProvider.ticker ? (
          <Box
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            marginBottom={2}
            paddingBottom={2}
            className="new-network-info__bullet-paragraph"
          >
            <Box marginRight={4} color={Color.textDefault}>
              &bull;
            </Box>
            <Typography
              variant={TypographyVariant.H7}
              color={Color.textDefault}
              boxProps={{ display: DISPLAY.INLINE_BLOCK }}
              key="nativeTokenInfo"
            >
              {t('nativeToken', [
                <Typography
                  variant={TypographyVariant.H7}
                  boxProps={{ display: DISPLAY.INLINE_BLOCK }}
                  fontWeight={FONT_WEIGHT.BOLD}
                  key="ticker"
                >
                  {currentProvider.ticker}
                </Typography>,
              ])}
            </Typography>
          </Box>
        ) : null}
        <Box
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          marginBottom={2}
          paddingBottom={2}
          className={
            !autoDetectToken || !tokenDetectionSupported
              ? 'new-network-info__bullet-paragraph'
              : null
          }
        >
          <Box marginRight={4} color={Color.textDefault}>
            &bull;
          </Box>
          <Typography
            variant={TypographyVariant.H7}
            color={Color.textDefault}
            boxProps={{ display: DISPLAY.INLINE_BLOCK }}
            className="new-network-info__bullet-paragraph__text"
          >
            {t('attemptSendingAssets')}{' '}
            <a
              href="https://metamask.zendesk.com/hc/en-us/articles/4404424659995"
              target="_blank"
              rel="noreferrer"
            >
              <Typography
                variant={TypographyVariant.H7}
                color={Color.infoDefault}
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
            alignItems={AlignItems.center}
            marginBottom={2}
            paddingBottom={2}
          >
            <Box marginRight={4} color={Color.textDefault}>
              &bull;
            </Box>
            <Box>
              <Typography
                variant={TypographyVariant.H7}
                color={Color.textDefault}
                className="new-network-info__token-show-up"
              >
                {t('tokenShowUp')}{' '}
                <Button
                  type="link"
                  onClick={addTokenManually}
                  className="new-network-info__button"
                >
                  <Typography
                    variant={TypographyVariant.H7}
                    color={Color.infoDefault}
                    className="new-network-info__manually-add-tokens"
                  >
                    {t('clickToManuallyAdd')}
                  </Typography>
                </Button>
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Popover>
  );
};

export default NewNetworkInfo;
