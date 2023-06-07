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
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { TOKEN_API_METASWAP_CODEFI_URL } from '../../../../shared/constants/tokens';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  getNativeCurrencyImage,
  getUseTokenDetection,
} from '../../../selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import Chip from '../chip/chip';
import { setFirstTimeUsedNetwork } from '../../../store/actions';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { Icon, IconName, Text } from '../../component-library';

const NewNetworkInfo = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const [tokenDetectionSupported, setTokenDetectionSupported] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const autoDetectToken = useSelector(getUseTokenDetection);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const providerConfig = useSelector(getProviderConfig);

  const onCloseClick = () => {
    setShowPopup(false);
    setFirstTimeUsedNetwork(providerConfig.chainId);
  };

  const addTokenManually = () => {
    history.push(IMPORT_TOKEN_ROUTE);
    setShowPopup(false);
    setFirstTimeUsedNetwork(providerConfig.chainId);
  };

  const getIsTokenDetectionSupported = async () => {
    const fetchedTokenData = await fetchWithCache(
      `${TOKEN_API_METASWAP_CODEFI_URL}${providerConfig.chainId}`,
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
      <Text
        variant={TextVariant.headingSm}
        as="h4"
        color={Color.textDefault}
        fontWeight={FontWeight.Bold}
        align={TextAlign.Center}
      >
        {t('switchedTo')}
      </Text>
      <Chip
        className="new-network-info__token-box"
        backgroundColor={Color.backgroundAlternative}
        maxContent={false}
        label={
          providerConfig.type === NETWORK_TYPES.RPC
            ? providerConfig.nickname ?? t('privateNetwork')
            : t(providerConfig.type)
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
              name={IconName.Question}
              color={Color.iconDefault}
            />
          )
        }
      />
      <Text
        variant={TextVariant.bodySmBold}
        as="h6"
        color={Color.textDefault}
        align={TextAlign.Center}
        margin={[8, 0, 0, 0]}
      >
        {t('thingsToKeep')}
      </Text>
      <Box marginRight={4} marginLeft={5} marginTop={6}>
        {providerConfig.ticker ? (
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
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              color={Color.textDefault}
              display={DISPLAY.INLINE_BLOCK}
              key="nativeTokenInfo"
            >
              {t('nativeToken', [
                <Text
                  variant={TextVariant.bodySmBold}
                  as="h6"
                  display={DISPLAY.INLINE_BLOCK}
                  key="ticker"
                >
                  {providerConfig.ticker}
                </Text>,
              ])}
            </Text>
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
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={Color.textDefault}
            display={DISPLAY.INLINE_BLOCK}
            className="new-network-info__bullet-paragraph__text"
          >
            {t('attemptSendingAssets')}{' '}
            <a
              href="https://metamask.zendesk.com/hc/en-us/articles/4404424659995"
              target="_blank"
              rel="noreferrer"
            >
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={Color.infoDefault}
                display={DISPLAY.INLINE_BLOCK}
              >
                {t('learnMoreUpperCase')}
              </Text>
            </a>
          </Text>
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
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={Color.textDefault}
                className="new-network-info__token-show-up"
              >
                {t('tokenShowUp')}{' '}
                <Button
                  type="link"
                  onClick={addTokenManually}
                  className="new-network-info__button"
                >
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={Color.infoDefault}
                    className="new-network-info__manually-add-tokens"
                  >
                    {t('clickToManuallyAdd')}
                  </Text>
                </Button>
              </Text>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Popover>
  );
};

export default NewNetworkInfo;
