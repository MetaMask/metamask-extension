import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import classnames from 'classnames';
import log from 'loglevel';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addUrlProtocolPrefix } from '../../../../app/scripts/lib/util';
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
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

import {
  Box,
  Text,
  TextField,
  IconName,
  ButtonLink,
  AvatarNetwork,
  ButtonIcon,
  ButtonIconSize,
  Icon,
} from '../../../components/component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Display,
  TextAlign,
  TextColor,
  TextVariant,
  IconColor,
  AlignItems,
  JustifyContent,
  FlexDirection,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getUseExternalNameSources,
  getExternalServicesOnboardingToggleState,
  getIsSocialLoginFlow,
  getDataCollectionForMarketing,
} from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import {
  setIpfsGateway,
  setUseCurrencyRateCheck,
  setUseMultiAccountBalanceChecker,
  setUse4ByteResolution,
  setUseTokenDetection,
  setUseAddressBarEnsResolution,
  toggleNetworkMenu,
  setUseTransactionSimulations,
  setUseExternalNameSources,
  setEditedNetwork,
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import {
  onboardingToggleBasicFunctionalityOn,
  openBasicFunctionalityModal,
} from '../../../ducks/app/app';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { BackupAndSyncToggle } from '../../../components/app/identity/backup-and-sync-toggle/backup-and-sync-toggle';
import DeleteMetaMetricsDataButton from '../../settings/security-tab/delete-metametrics-data-button';
import MetametricsToggle from '../../settings/security-tab/metametrics-toggle/metametrics-toggle';
import { MetaMaskReduxState } from '../../../store/store';
import { Setting } from './setting';

const ANIMATION_TIME = 500;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PrivacySettings() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: number;
    title: string;
    subtitle: string;
  } | null>(null);
  const [hiddenClass, setHiddenClass] = useState(true);

  const defaultState = useSelector(
    (state: MetaMaskReduxState) => state.metamask,
  );
  const {
    use4ByteResolution,
    useTokenDetection,
    useCurrencyRateCheck,
    useMultiAccountBalanceChecker,
    ipfsGateway,
    useAddressBarEnsResolution,
    useTransactionSimulations,
  } = defaultState;
  const useExternalNameSources = useSelector(getUseExternalNameSources);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);

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
  const [turnOnExternalNameSources, setTurnOnExternalNameSources] = useState(
    useExternalNameSources,
  );

  const trackEvent = useContext(MetaMetricsContext);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');

  const handleSubmit = () => {
    dispatch(setUse4ByteResolution(turnOn4ByteResolution));
    dispatch(setUseTokenDetection(turnOnTokenDetection));
    dispatch(
      setUseMultiAccountBalanceChecker(isMultiAccountBalanceCheckerEnabled),
    );
    dispatch(setUseCurrencyRateCheck(turnOnCurrencyRateCheck));
    dispatch(setUseAddressBarEnsResolution(addressBarResolution));
    setUseTransactionSimulations(isTransactionSimulationsEnabled);
    setUseExternalNameSources(turnOnExternalNameSources);

    if (ipfsURL && !ipfsError) {
      const { host } = new URL(addUrlProtocolPrefix(ipfsURL) as string);
      dispatch(setIpfsGateway(host));
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_group: 'onboarding_advanced_configuration',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_profile_syncing_enabled: isBackupAndSyncEnabled,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_basic_functionality_enabled: externalServicesOnboardingToggleState,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        turnon_token_detection: turnOnTokenDetection,
      },
    });
    if (isFromReminder) {
      navigate(`${ONBOARDING_COMPLETION_ROUTE}?isFromReminder=true`, {
        replace: true,
      });
    } else {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    }
  };

  const handleIPFSChange = (url: string) => {
    setIPFSURL(url);
    try {
      const { host } = new URL(addUrlProtocolPrefix(url) as string);
      if (!host || host === 'gateway.ipfs.io') {
        throw new Error();
      }
      setIPFSError(null);
    } catch (error) {
      setIPFSError(t('onboardingAdvancedPrivacyIPFSInvalid'));
    }
  };

  const handleItemSelected = (item: {
    id: number;
    title: string;
    subtitle: string;
  }) => {
    setSelectedItem(item);
    setShowDetail(true);

    setTimeout(() => {
      setHiddenClass(false);
    }, ANIMATION_TIME);
  };

  const handleBack = () => {
    setShowDetail(false);
    setTimeout(() => {
      setHiddenClass(true);
    }, ANIMATION_TIME);
  };

  const items = [
    { id: 1, title: t('general'), subtitle: t('generalDescription') },
    { id: 2, title: t('assets'), subtitle: t('assetsDescription') },
    {
      id: 3,
      title: isSocialLoginFlow
        ? t('securityDefaultSettingsSocialLogin')
        : t('security'),
      subtitle: isSocialLoginFlow
        ? t('securitySocialLoginDefaultSettingsDescription')
        : t('securityDescription'),
    },
  ];

  const handleDataCollectionForMarketing = async (value: boolean) => {
    try {
      dispatch(setMarketingConsent(value));
    } catch (error) {
      log.error('Error setting marketing consent in default settings', error);
    }
    dispatch(setDataCollectionForMarketing(value));
  };

  return (
    <>
      <div className="privacy-settings" data-testid="privacy-settings">
        <div
          className={classnames('container', {
            'show-detail': showDetail,
            'show-list': !showDetail,
          })}
        >
          <div className="list-view">
            <Box
              className="privacy-settings__header"
              marginTop={6}
              marginBottom={6}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              justifyContent={JustifyContent.flexStart}
            >
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                flexDirection={FlexDirection.Row}
                justifyContent={JustifyContent.spaceBetween}
              >
                <ButtonIcon
                  iconName={IconName.ArrowLeft}
                  ariaLabel="Back"
                  size={ButtonIconSize.Lg}
                  data-testid="privacy-settings-back-button"
                  onClick={handleSubmit}
                />
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.center}
                  width={BlockSize.Full}
                >
                  <Text variant={TextVariant.headingMd} as="h3">
                    {t('defaultSettingsTitle')}
                  </Text>
                </Box>
                <Box className="privacy-settings__empty-space" />
              </Box>
              <Text variant={TextVariant.bodyLgMedium} marginTop={5}>
                {t('defaultSettingsSubTitle')}
              </Text>
              <a
                href="https://support.metamask.io/privacy-and-security/privacy-best-practices"
                target="_blank"
                rel="noreferrer"
                key="learnMoreAboutPrivacy"
                style={{
                  fontSize: 'var(--font-size-5)',
                }}
              >
                {t('learnMoreAboutPrivacy')}
              </a>
            </Box>
            <Box>
              <Box
                as="ul"
                marginTop={4}
                marginBottom={4}
                style={{ listStyleType: 'none' }}
                className="privacy-settings__categories-list"
              >
                {items.map((item) => (
                  <Box
                    marginTop={5}
                    marginBottom={5}
                    key={item.id}
                    className="categories-item"
                    onClick={() => handleItemSelected(item)}
                  >
                    <Box
                      display={Display.Flex}
                      alignItems={AlignItems.flexStart}
                      justifyContent={JustifyContent.spaceBetween}
                      data-testid={`category-item-${item.title}`}
                    >
                      <Text variant={TextVariant.bodyLgMedium}>
                        {item.title}
                      </Text>
                      <ButtonIcon
                        iconName={IconName.ArrowRight}
                        ariaLabel="Next"
                        size={ButtonIconSize.Lg}
                        color={IconColor.iconDefault}
                        onClick={() => handleItemSelected(item)}
                      />
                    </Box>
                    <Text
                      className="description"
                      variant={TextVariant.bodyMd}
                      color={TextColor.textAlternative}
                    >
                      {item.subtitle}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </div>

          <div
            className={classnames('detail-view', {
              hidden: !showDetail && hiddenClass,
            })}
          >
            <Box
              className="privacy-settings__header"
              marginTop={6}
              marginBottom={5}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
            >
              <ButtonIcon
                data-testid="category-back-button"
                iconName={IconName.ArrowLeft}
                ariaLabel="Back"
                size={ButtonIconSize.Lg}
                onClick={handleBack}
              />
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                width={BlockSize.Full}
              >
                <Text variant={TextVariant.headingLg} as="h2">
                  {selectedItem?.title}
                </Text>
              </Box>
              <Box className="privacy-settings__empty-space" />
            </Box>

            <div
              className="privacy-settings__settings"
              data-testid="privacy-settings-settings"
            >
              {selectedItem?.id === 1 ? (
                <>
                  <Setting
                    dataTestId="basic-functionality-toggle"
                    value={externalServicesOnboardingToggleState}
                    setValue={(toggledValue) => {
                      if (toggledValue) {
                        dispatch(onboardingToggleBasicFunctionalityOn());
                        trackEvent({
                          category: MetaMetricsEventCategory.Onboarding,
                          event: MetaMetricsEventName.SettingsUpdated,
                          properties: {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            settings_group: 'onboarding_advanced_configuration',
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            settings_type: 'basic_functionality',
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            old_value: false,
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            new_value: true,
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            was_profile_syncing_on: false,
                          },
                        });
                      } else {
                        dispatch(openBasicFunctionalityModal());
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

                  <BackupAndSyncToggle />

                  <Setting
                    title={t('onboardingAdvancedPrivacyNetworkTitle')}
                    showToggle={false}
                    enableMarginBottom={false}
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
                          <a
                            href={ZENDESK_URLS.ADD_SOLANA_ACCOUNTS}
                            key="link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t(
                              'onboardingAdvancedPrivacyNetworkDescriptionCallToAction',
                            )}
                          </a>,
                        ])}

                        <Box paddingTop={4}>
                          <Box
                            display={Display.Flex}
                            flexDirection={FlexDirection.Column}
                            gap={5}
                          >
                            {Object.values(networkConfigurations)
                              .filter(
                                ({ chainId }) => !TEST_CHAINS.includes(chainId),
                              )
                              .map((network) => (
                                <Box
                                  key={network.chainId}
                                  className="privacy-settings__customizable-network"
                                  onClick={() => {
                                    dispatch(
                                      setEditedNetwork({
                                        chainId: network.chainId,
                                      }),
                                    );
                                    dispatch(toggleNetworkMenu());
                                  }}
                                  display={Display.Flex}
                                  alignItems={AlignItems.center}
                                  justifyContent={JustifyContent.spaceBetween}
                                >
                                  <Box
                                    display={Display.Flex}
                                    alignItems={AlignItems.center}
                                  >
                                    <AvatarNetwork
                                      src={
                                        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                                          network.chainId
                                        ]
                                      }
                                      name={network.name}
                                    />
                                    <Box
                                      textAlign={TextAlign.Left}
                                      marginLeft={3}
                                    >
                                      <Text variant={TextVariant.bodySmMedium}>
                                        {network.name}
                                      </Text>
                                      <Text
                                        variant={TextVariant.bodyXs}
                                        color={TextColor.textAlternative}
                                      >
                                        {
                                          // Get just the protocol + domain, not the infura key in path
                                          new URL(
                                            network?.rpcEndpoints[
                                              network?.defaultRpcEndpointIndex
                                            ]?.url,
                                          )?.origin
                                        }
                                      </Text>
                                    </Box>
                                  </Box>
                                  <ButtonIcon
                                    iconName={IconName.ArrowRight}
                                    size={ButtonIconSize.Md}
                                    ariaLabel="Next"
                                  />
                                </Box>
                              ))}
                            <ButtonLink
                              onClick={() => {
                                dispatch(
                                  toggleNetworkMenu({
                                    isAddingNewNetwork: true,
                                  }),
                                );
                              }}
                              justifyContent={JustifyContent.flexStart}
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
                      </>
                    }
                  />
                </>
              ) : null}
              {selectedItem?.id === 2 ? (
                <>
                  <Setting
                    value={turnOnTokenDetection}
                    setValue={setTurnOnTokenDetection}
                    title={t('turnOnTokenDetection')}
                    description={t('useTokenDetectionPrivacyDesc')}
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
                              {ipfsError ||
                                t('onboardingAdvancedPrivacyIPFSValid')}
                            </Text>
                          ) : null}
                        </Box>
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
                    value={isMultiAccountBalanceCheckerEnabled}
                    setValue={setMultiAccountBalanceCheckerEnabled}
                    title={t('useMultiAccountBalanceChecker')}
                    description={t(
                      'useMultiAccountBalanceCheckerSettingDescription',
                    )}
                  />
                </>
              ) : null}
              {selectedItem?.id === 3 ? (
                <>
                  <Setting
                    value={turnOn4ByteResolution}
                    setValue={setTurnOn4ByteResolution}
                    title={t('use4ByteResolution')}
                    description={t('toggleDecodeDescription')}
                  />
                  <Setting
                    value={turnOnExternalNameSources}
                    setValue={setTurnOnExternalNameSources}
                    title={t('externalNameSourcesSetting')}
                    description={t('externalNameSourcesSettingDescription')}
                  />
                  {isSocialLoginFlow && (
                    <>
                      <MetametricsToggle
                        dataCollectionForMarketing={dataCollectionForMarketing}
                        setDataCollectionForMarketing={
                          handleDataCollectionForMarketing
                        }
                        fromDefaultSettings
                      />
                      <DeleteMetaMetricsDataButton defaultPrivacySettings />
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
