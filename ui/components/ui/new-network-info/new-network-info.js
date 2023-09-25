import React, { useContext, useEffect, useState, useCallback } from 'react';
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
  Display,
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
import { getNetworkLabelKey } from '../../../helpers/utils/i18n-helper';

const NewNetworkInfo = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const [tokenDetectionSupported, setTokenDetectionSupported] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
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

  const checkTokenDetection = useCallback(async () => {
    try {
      const fetchedTokenData = await fetchWithCache({
        url: `${TOKEN_API_METASWAP_CODEFI_URL}${providerConfig.chainId}`,
        functionName: 'getIsTokenDetectionSupported',
      });
      const isTokenDetectionSupported = !fetchedTokenData?.error;
      setTokenDetectionSupported(isTokenDetectionSupported);
      setIsLoading(false);
    } catch {
      // If there's any error coming from getIsTokenDetectionSupported
      // we would like to catch this error and simply return false for the state
      // and this will be handled in UI naturally
      setTokenDetectionSupported(false);
      setIsLoading(false);
    }
  }, [providerConfig.chainId]);

  useEffect(() => {
    checkTokenDetection();
    // we want to only fetch once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    !isLoading &&
    showPopup && (
      <Popover
        onClose={onCloseClick}
        className="new-network-info__wrapper"
        footer={
          <Button type="primary" onClick={onCloseClick}>
            {t('recoveryPhraseReminderConfirm')}
          </Button>
        }
      >
        <Box data-testid="new-network-info__wrapper">
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
                : t(getNetworkLabelKey(providerConfig.type))
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
                display={Display.Flex}
                alignItems={AlignItems.center}
                marginBottom={2}
                paddingBottom={2}
                className="new-network-info__bullet-paragraph"
                data-testid="new-network-info__bullet-paragraph"
              >
                <Box marginRight={4} color={Color.textDefault}>
                  &bull;
                </Box>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={Color.textDefault}
                  display={Display.InlineBlock}
                  key="nativeTokenInfo"
                >
                  {t('nativeToken', [
                    <Text
                      variant={TextVariant.bodySmBold}
                      as="h6"
                      display={Display.InlineBlock}
                      key="ticker"
                    >
                      {providerConfig.ticker}
                    </Text>,
                  ])}
                </Text>
              </Box>
            ) : null}
            <Box
              display={Display.Flex}
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
                display={Display.InlineBlock}
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
                    display={Display.InlineBlock}
                  >
                    {t('learnMoreUpperCase')}
                  </Text>
                </a>
              </Text>
            </Box>
            {!autoDetectToken || !tokenDetectionSupported ? (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                marginBottom={2}
                paddingBottom={2}
                data-testid="new-network-info__add-token-manually"
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
        </Box>
      </Popover>
    )
  );
};

export default NewNetworkInfo;
