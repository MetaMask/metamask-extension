import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { addUrlProtocolPrefix } from '../../../../app/scripts/lib/util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  COINGECKO_LINK,
  CRYPTOCOMPARE_LINK,
  PRIVACY_POLICY_LINK,
} from '../../../../shared/lib/ui-utils';
import {
  Box,
  PickerNetwork,
  Text,
  TextField,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../../components/component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_PIN_EXTENSION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAllNetworks, getCurrentNetwork } from '../../../selectors';
import {
  setCompletedOnboarding,
  setIpfsGateway,
  setUseCurrencyRateCheck,
  setUseMultiAccountBalanceChecker,
  setUsePhishDetect,
  setUse4ByteResolution,
  setUseTokenDetection,
  setUseAddressBarEnsResolution,
  showModal,
  toggleNetworkMenu,
  setIncomingTransactionsPreferences,
} from '../../../store/actions';
import IncomingTransactionToggle from '../../../components/app/incoming-trasaction-toggle/incoming-transaction-toggle';
import { Setting } from './setting';

export default function PrivacySettings() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const defaultState = useSelector((state) => state.metamask);
  const {
    incomingTransactionsPreferences,
    usePhishDetect,
    use4ByteResolution,
    useTokenDetection,
    useCurrencyRateCheck,
    useMultiAccountBalanceChecker,
    ipfsGateway,
    useAddressBarEnsResolution,
  } = defaultState;

  const [usePhishingDetection, setUsePhishingDetection] =
    useState(usePhishDetect);
  const [turnOn4ByteResolution, setTurnOn4ByteResolution] =
    useState(use4ByteResolution);
  const [turnOnTokenDetection, setTurnOnTokenDetection] =
    useState(useTokenDetection);
  const [turnOnCurrencyRateCheck, setTurnOnCurrencyRateCheck] =
    useState(useCurrencyRateCheck);

  const [
    isMultiAccountBalanceCheckerEnabled,
    setMultiAccountBalanceCheckerEnabled,
  ] = useState(useMultiAccountBalanceChecker);
  const [ipfsURL, setIPFSURL] = useState(ipfsGateway);
  const [ipfsError, setIPFSError] = useState(null);
  const [addressBarResolution, setAddressBarResolution] = useState(
    useAddressBarEnsResolution,
  );

  const trackEvent = useContext(MetaMetricsContext);
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getAllNetworks);

  const handleSubmit = () => {
    dispatch(setUsePhishDetect(usePhishingDetection));
    dispatch(setUse4ByteResolution(turnOn4ByteResolution));
    dispatch(setUseTokenDetection(turnOnTokenDetection));
    dispatch(
      setUseMultiAccountBalanceChecker(isMultiAccountBalanceCheckerEnabled),
    );
    dispatch(setUseCurrencyRateCheck(turnOnCurrencyRateCheck));
    dispatch(setCompletedOnboarding());
    dispatch(setUseAddressBarEnsResolution(addressBarResolution));

    if (ipfsURL && !ipfsError) {
      const { host } = new URL(addUrlProtocolPrefix(ipfsURL));
      dispatch(setIpfsGateway(host));
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletAdvancedSettings,
      properties: {
        show_incoming_tx: incomingTransactionsPreferences,
        use_phising_detection: usePhishingDetection,
        turnon_token_detection: turnOnTokenDetection,
      },
    });

    history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
  };

  const handleIPFSChange = (url) => {
    setIPFSURL(url);
    try {
      const { host } = new URL(addUrlProtocolPrefix(url));
      if (!host || host === 'gateway.ipfs.io') {
        throw new Error();
      }
      setIPFSError(null);
    } catch (error) {
      setIPFSError(t('onboardingAdvancedPrivacyIPFSInvalid'));
    }
  };

  return (
    <>
      <div className="privacy-settings" data-testid="privacy-settings">
        <div className="privacy-settings__header">
          <Text variant={TextVariant.headingLg} as="h2">
            {t('advancedConfiguration')}
          </Text>
          <Text variant={TextVariant.headingSm} as="h4">
            {t('setAdvancedPrivacySettingsDetails')}
          </Text>
        </div>
        <div
          className="privacy-settings__settings"
          data-testid="privacy-settings-settings"
        >
          <IncomingTransactionToggle
            allNetworks={allNetworks}
            setIncomingTransactionsPreferences={(chainId, value) =>
              dispatch(setIncomingTransactionsPreferences(chainId, value))
            }
            incomingTransactionsPreferences={incomingTransactionsPreferences}
          />
          <Setting
            value={usePhishingDetection}
            setValue={setUsePhishingDetection}
            title={t('usePhishingDetection')}
            description={t('onboardingUsePhishingDetectionDescription', [
              <a
                href="https://www.jsdelivr.com"
                target="_blank"
                rel="noreferrer"
                key="jsDeliver"
              >
                {t('jsDeliver')}
              </a>,
              <a
                href="https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-com"
                target="_blank"
                rel="noreferrer"
                key="privacyMsg"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          />
          <Setting
            value={turnOn4ByteResolution}
            setValue={setTurnOn4ByteResolution}
            title={t('use4ByteResolution')}
            description={t('use4ByteResolutionDescription')}
          />
          <Setting
            value={turnOnTokenDetection}
            setValue={setTurnOnTokenDetection}
            title={t('turnOnTokenDetection')}
            description={t('useTokenDetectionPrivacyDesc')}
          />
          <Setting
            value={isMultiAccountBalanceCheckerEnabled}
            setValue={setMultiAccountBalanceCheckerEnabled}
            title={t('useMultiAccountBalanceChecker')}
            description={t('useMultiAccountBalanceCheckerSettingDescription')}
          />
          <Setting
            title={t('onboardingAdvancedPrivacyNetworkTitle')}
            showToggle={false}
            description={
              <>
                {t('onboardingAdvancedPrivacyNetworkDescription', [
                  <a
                    href="https://consensys.io/privacy-policy/"
                    key="link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('privacyMsg')}
                  </a>,
                ])}

                <Box paddingTop={2}>
                  {currentNetwork ? (
                    <div className="privacy-settings__network">
                      <>
                        <PickerNetwork
                          label={currentNetwork?.nickname}
                          src={currentNetwork?.rpcPrefs?.imageUrl}
                          onClick={() => dispatch(toggleNetworkMenu())}
                        />
                      </>
                    </div>
                  ) : (
                    <ButtonSecondary
                      size={ButtonSecondarySize.Lg}
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(showModal({ name: 'ONBOARDING_ADD_NETWORK' }));
                      }}
                    >
                      {t('onboardingAdvancedPrivacyNetworkButton')}
                    </ButtonSecondary>
                  )}
                </Box>
              </>
            }
          />
          <Setting
            title={t('onboardingAdvancedPrivacyIPFSTitle')}
            showToggle={false}
            description={
              <>
                {t('onboardingAdvancedPrivacyIPFSDescription')}
                <Box paddingTop={2}>
                  <TextField
                    value={ipfsURL}
                    style={{ width: '100%' }}
                    inputProps={{ 'data-testid': 'ipfs-input' }}
                    onChange={(e) => {
                      handleIPFSChange(e.target.value);
                    }}
                  />
                  {ipfsURL ? (
                    <Text
                      variant={TextVariant.bodySm}
                      color={
                        ipfsError
                          ? TextColor.errorDefault
                          : TextColor.successDefault
                      }
                    >
                      {ipfsError || t('onboardingAdvancedPrivacyIPFSValid')}
                    </Text>
                  ) : null}
                </Box>
              </>
            }
          />
          <Setting
            value={addressBarResolution}
            setValue={setAddressBarResolution}
            title={t('ensDomainsSettingTitle')}
            description={
              <>
                <Text variant={TextVariant.inherit}>
                  {t('ensDomainsSettingDescriptionIntroduction')}
                </Text>
                <Box
                  as="ul"
                  marginTop={4}
                  marginBottom={4}
                  paddingInlineStart={4}
                  style={{ listStyleType: 'circle' }}
                >
                  <Text variant={TextVariant.inherit} as="li">
                    {t('ensDomainsSettingDescriptionPart1')}
                  </Text>
                  <Text variant={TextVariant.inherit} as="li">
                    {t('ensDomainsSettingDescriptionPart2')}
                  </Text>
                </Box>
                <Text variant={TextVariant.inherit}>
                  {t('ensDomainsSettingDescriptionOutroduction')}
                </Text>
              </>
            }
          />
          <Setting
            value={turnOnCurrencyRateCheck}
            setValue={setTurnOnCurrencyRateCheck}
            title={t('currencyRateCheckToggle')}
            description={t('currencyRateCheckToggleDescription', [
              <a
                key="coingecko_link"
                href={COINGECKO_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('coingecko')}
              </a>,
              <a
                key="cryptocompare_link"
                href={CRYPTOCOMPARE_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('cryptoCompare')}
              </a>,
              <a
                key="privacy_policy_link"
                href={PRIVACY_POLICY_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          />
          <ButtonPrimary
            size={ButtonPrimarySize.Lg}
            onClick={handleSubmit}
            block
            marginTop={6}
          >
            {t('done')}
          </ButtonPrimary>
        </div>
      </div>
    </>
  );
}
