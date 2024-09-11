import React, { useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ButtonVariant } from '@metamask/snaps-sdk';
import { addUrlProtocolPrefix } from '../../../../app/scripts/lib/util';
import {
  useSetIsProfileSyncingEnabled,
  useEnableProfileSyncing,
} from '../../../hooks/metamask-notifications/useProfileSyncing';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  COINGECKO_LINK,
  CRYPTOCOMPARE_LINK,
  PRIVACY_POLICY_LINK,
  TRANSACTION_SIMULATIONS_LEARN_MORE_LINK,
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
  Icon,
  IconName,
  ButtonLink,
  AvatarNetwork,
  ButtonIcon,
  IconSize,
} from '../../../components/component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_PIN_EXTENSION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAllNetworks,
  getCurrentNetwork,
  getPetnamesEnabled,
  getExternalServicesOnboardingToggleState,
} from '../../../selectors';
import { selectIsProfileSyncingEnabled } from '../../../selectors/metamask-notifications/profile-syncing';
import { selectParticipateInMetaMetrics } from '../../../selectors/metamask-notifications/authentication';
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
  toggleExternalServices,
  setUseTransactionSimulations,
  setPetnamesEnabled,
  performSignIn,
} from '../../../store/actions';
import {
  onboardingToggleBasicFunctionalityOn,
  openBasicFunctionalityModal,
} from '../../../ducks/app/app';
import IncomingTransactionToggle from '../../../components/app/incoming-trasaction-toggle/incoming-transaction-toggle';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { getLocalNetworkMenuRedesignFeatureFlag } from '../../../helpers/utils/feature-flags';
import { Setting } from './setting';

/**
 * Profile Syncing Setting props
 *
 * @param {boolean} basicFunctionalityOnboarding
 * @returns props that are used for the profile syncing toggle.
 */
function useProfileSyncingProps(basicFunctionalityOnboarding) {
  const { setIsProfileSyncingEnabled, error: setIsProfileSyncingEnabledError } =
    useSetIsProfileSyncingEnabled();
  const { enableProfileSyncing, error: enableProfileSyncingError } =
    useEnableProfileSyncing();

  const profileSyncingError =
    setIsProfileSyncingEnabledError || enableProfileSyncingError;

  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  // Effect - toggle profile syncing on/off based on basic functionality toggle
  useEffect(() => {
    const changeProfileSync = basicFunctionalityOnboarding === true;
    setIsProfileSyncingEnabled(changeProfileSync);
  }, [basicFunctionalityOnboarding, setIsProfileSyncingEnabled]);

  return {
    setIsProfileSyncingEnabled,
    enableProfileSyncing,
    profileSyncingError,
    isProfileSyncingEnabled,
  };
}

export default function PrivacySettings() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const defaultState = useSelector((state) => state.metamask);
  const {
    incomingTransactionsPreferences,
    use4ByteResolution,
    useTokenDetection,
    useCurrencyRateCheck,
    useMultiAccountBalanceChecker,
    ipfsGateway,
    useAddressBarEnsResolution,
    useTransactionSimulations,
  } = defaultState;
  const petnamesEnabled = useSelector(getPetnamesEnabled);
  const participateInMetaMetrics = useSelector(selectParticipateInMetaMetrics);

  const [usePhishingDetection, setUsePhishingDetection] = useState(null);
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
  const [isTransactionSimulationsEnabled, setTransactionSimulationsEnabled] =
    useState(useTransactionSimulations);
  const [ipfsURL, setIPFSURL] = useState(ipfsGateway);
  const [ipfsError, setIPFSError] = useState(null);
  const [addressBarResolution, setAddressBarResolution] = useState(
    useAddressBarEnsResolution,
  );
  const [turnOnPetnames, setTurnOnPetnames] = useState(petnamesEnabled);

  const trackEvent = useContext(MetaMetricsContext);
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getAllNetworks);

  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );

  const phishingToggleState =
    usePhishingDetection === null
      ? externalServicesOnboardingToggleState
      : usePhishingDetection;

  const profileSyncingProps = useProfileSyncingProps(
    externalServicesOnboardingToggleState,
  );

  const networkMenuRedesign = useSelector(
    getLocalNetworkMenuRedesignFeatureFlag,
  );

  const handleSubmit = () => {
    dispatch(toggleExternalServices(externalServicesOnboardingToggleState));
    dispatch(setUsePhishDetect(phishingToggleState));
    dispatch(setUse4ByteResolution(turnOn4ByteResolution));
    dispatch(setUseTokenDetection(turnOnTokenDetection));
    dispatch(
      setUseMultiAccountBalanceChecker(isMultiAccountBalanceCheckerEnabled),
    );
    dispatch(setUseCurrencyRateCheck(turnOnCurrencyRateCheck));
    dispatch(setCompletedOnboarding());
    dispatch(setUseAddressBarEnsResolution(addressBarResolution));
    setUseTransactionSimulations(isTransactionSimulationsEnabled);
    dispatch(setPetnamesEnabled(turnOnPetnames));

    // Profile Syncing Setup
    if (externalServicesOnboardingToggleState) {
      if (
        profileSyncingProps.isProfileSyncingEnabled ||
        participateInMetaMetrics
      ) {
        dispatch(performSignIn());
      }
    } else {
      profileSyncingProps.setIsProfileSyncingEnabled(false);
    }

    if (ipfsURL && !ipfsError) {
      const { host } = new URL(addUrlProtocolPrefix(ipfsURL));
      dispatch(setIpfsGateway(host));
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletAdvancedSettings,
      properties: {
        settings_group: 'onboarding_advanced_configuration',
        is_profile_syncing_enabled: profileSyncingProps.isProfileSyncingEnabled,
        is_basic_functionality_enabled: externalServicesOnboardingToggleState,
        show_incoming_tx: incomingTransactionsPreferences,
        use_phising_detection: usePhishingDetection,
        turnon_token_detection: turnOnTokenDetection,
      },
    });

    history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
  };

  const handleUseProfileSync = async () => {
    if (profileSyncingProps.isProfileSyncingEnabled) {
      dispatch(
        showModal({
          name: 'CONFIRM_TURN_OFF_PROFILE_SYNCING',
          turnOffProfileSyncing: () => {
            profileSyncingProps.setIsProfileSyncingEnabled(false);
          },
        }),
      );
    } else {
      profileSyncingProps.setIsProfileSyncingEnabled(true);
    }
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
          <Setting
            dataTestId="basic-functionality-toggle"
            value={externalServicesOnboardingToggleState}
            setValue={(toggledValue) => {
              if (toggledValue === false) {
                dispatch(openBasicFunctionalityModal());
              } else {
                dispatch(onboardingToggleBasicFunctionalityOn());
                trackEvent({
                  category: MetaMetricsEventCategory.Onboarding,
                  event: MetaMetricsEventName.SettingsUpdated,
                  properties: {
                    settings_group: 'advanced',
                    settings_type: 'basic_functionality',
                    old_value: false,
                    new_value: true,
                  },
                });
              }
            }}
            title={t('basicConfigurationLabel')}
            description={t('basicConfigurationDescription', [
              <a
                href="https://consensys.io/privacy-policy"
                key="link"
                target="_blank"
                rel="noreferrer noopener"
              >
                {t('privacyMsg')}
              </a>,
            ])}
          />

          <IncomingTransactionToggle
            allNetworks={allNetworks}
            setIncomingTransactionsPreferences={(chainId, value) =>
              dispatch(setIncomingTransactionsPreferences(chainId, value))
            }
            incomingTransactionsPreferences={incomingTransactionsPreferences}
          />

          <Setting
            dataTestId="profile-sync-toggle"
            disabled={!externalServicesOnboardingToggleState}
            value={profileSyncingProps.isProfileSyncingEnabled}
            setValue={handleUseProfileSync}
            title={t('profileSync')}
            description={t('profileSyncDescription', [
              <a
                href="https://support.metamask.io/privacy-and-security/profile-privacy"
                key="link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('profileSyncPrivacyLink')}
              </a>,
            ])}
          />
          {profileSyncingProps.profileSyncingError && (
            <Box paddingBottom={4}>
              <Text
                as="p"
                color={TextColor.errorDefault}
                variant={TextVariant.bodySm}
              >
                {t('notificationsSettingsBoxError')}
              </Text>
            </Box>
          )}

          <Setting
            value={phishingToggleState}
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

                {networkMenuRedesign ? (
                  <Box paddingTop={4}>
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={5}
                    >
                      {[CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET].map(
                        (chainId) => (
                          <Box
                            key={chainId}
                            className="privacy-settings__customizable-network"
                            onClick={() =>
                              console.log(`chain ${chainId} clicked`)
                            }
                            display={Display.Flex}
                            alignItems={AlignItems.center}
                            justifyContent={JustifyContent.spaceBetween}
                          >
                            <Box
                              display={Display.Flex}
                              alignItems={AlignItems.center}
                            >
                              <AvatarNetwork
                                src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
                              />
                              <Box textAlign={TextAlign.Left} marginLeft={3}>
                                <Text variant={TextVariant.bodySmMedium}>
                                  {NETWORK_TO_NAME_MAP[chainId]}
                                </Text>
                                <Text
                                  variant={TextVariant.bodyXs}
                                  color={TextColor.textAlternative}
                                >
                                  {
                                    // Get just the protocol + domain, not the infura key in path
                                    new URL(
                                      allNetworks.find(
                                        (network) =>
                                          network.chainId === chainId,
                                      )?.rpcUrl,
                                    )?.origin
                                  }
                                </Text>
                              </Box>
                            </Box>
                            <ButtonIcon
                              iconName={IconName.ArrowRight}
                              size={IconSize.Md}
                            />
                          </Box>
                        ),
                      )}
                      <ButtonLink
                        onClick={() => console.log('add a network clicked')}
                        justifyContent={JustifyContent.Left}
                        variant={ButtonVariant.link}
                      >
                        <Box
                          display={Display.Flex}
                          alignItems={AlignItems.center}
                        >
                          <Icon name={IconName.Add} marginRight={3} />
                          <Text color={TextColor.primaryDefault}>
                            {t('addANetwork')}
                          </Text>
                        </Box>
                      </ButtonLink>
                    </Box>
                  </Box>
                ) : (
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
                          dispatch(
                            showModal({ name: 'ONBOARDING_ADD_NETWORK' }),
                          );
                        }}
                      >
                        {t('onboardingAdvancedPrivacyNetworkButton')}
                      </ButtonSecondary>
                    )}
                  </Box>
                )}
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
            value={isTransactionSimulationsEnabled}
            setValue={setTransactionSimulationsEnabled}
            title={t('simulationsSettingSubHeader')}
            description={t('simulationsSettingDescription', [
              <a
                key="learn_more_link"
                href={TRANSACTION_SIMULATIONS_LEARN_MORE_LINK}
                rel="noreferrer"
                target="_blank"
              >
                {t('learnMoreUpperCase')}
              </a>,
            ])}
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
            dataTestId="currency-rate-check-toggle"
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
          <Setting
            value={turnOnPetnames}
            setValue={setTurnOnPetnames}
            title={t('petnamesEnabledToggle')}
            description={t('petnamesEnabledToggleDescription')}
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
