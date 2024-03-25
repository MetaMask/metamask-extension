import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TOKEN_API_METASWAP_CODEFI_URL } from '../../../../shared/constants/tokens';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { I18nContext } from '../../../contexts/i18n';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import {
  AlignItems,
  Color,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import { getCurrentNetwork, getUseTokenDetection } from '../../../selectors';
import { setFirstTimeUsedNetwork } from '../../../store/actions';
import { PickerNetwork, Text, Box } from '../../component-library';
import Button from '../button';
import Popover from '../popover';

export default function NewNetworkInfo() {
  const t = useContext(I18nContext);
  const history = useHistory();
  const [tokenDetectionSupported, setTokenDetectionSupported] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const autoDetectToken = useSelector(getUseTokenDetection);
  const providerConfig = useSelector(getProviderConfig);
  const currentNetwork = useSelector(getCurrentNetwork);

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
    setIsLoading(true);
    const fetchedTokenData = await fetchWithCache({
      url: `${TOKEN_API_METASWAP_CODEFI_URL}${providerConfig.chainId}`,
      functionName: 'getIsTokenDetectionSupported',
    });
    const isTokenDetectionSupported = !fetchedTokenData?.error;
    setTokenDetectionSupported(isTokenDetectionSupported);
    setIsLoading(false);
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
        <Box
          data-testid="new-network-info__wrapper"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
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
          <PickerNetwork
            label={currentNetwork?.nickname}
            src={currentNetwork?.rpcPrefs?.imageUrl}
            marginLeft="auto"
            marginRight="auto"
            marginTop={4}
            marginBottom={4}
            iconProps={{ display: 'none' }} // do not show the dropdown icon
            as="div" // do not render as a button
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
            {providerConfig.ticker && (
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
            )}
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
}
