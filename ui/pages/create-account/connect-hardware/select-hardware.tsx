import classnames from 'clsx';
import React, { useCallback, useContext, useState } from 'react';
import { upperFirst } from 'lodash';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  ButtonIcon,
  ButtonIconSize,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  IconName,
  Text,
  TextAlign,
  TextButton,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../components/component-library';
import LogoLedger from '../../../components/ui/logo/logo-ledger';
import LogoQRBased from '../../../components/ui/logo/logo-qr-based';
import LogoTrezor from '../../../components/ui/logo/logo-trezor';
import LogoLattice from '../../../components/ui/logo/logo-lattice';

import {
  HardwareDeviceNames,
  HardwareAffiliateLinks,
  HardwareAffiliateTutorialLinks,
  LedgerTransportTypes,
  MarketingActionNames,
  QrHardwareDeviceNames,
} from '../../../../shared/constants/hardware-wallets';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { openWindow } from '../../../helpers/utils/window';
import { getBrowserName } from '../../../../shared/lib/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';

// Not all browsers have usb support. In particular, Firefox does
// not support usb. More information on that can be found here:
// https://mozilla.github.io/standards-positions/#webusb
//
// The below `&& window.navigator.usb` condition ensures that we
// only attempt to connect Trezor via usb if we are in a browser
// that supports usb. If not, the connection of the hardware wallet
// to the browser will be handled by the Trezor connect screen. In
// the case of Firefox, this will depend on the Trezor bridge software
const isUSBSupported = !process.env.IN_TEST && window.navigator.usb;

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

const LEDGER_LIVE_APP_URL = 'https://www.ledger.com/ledger-live';

type DeviceButtonConfig = {
  device: HardwareDeviceNames;
  testId: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  logo: React.ComponentType<{ className: string; ariaLabel: string }>;
  ariaLabel: string;
};

const DEVICE_BUTTONS: DeviceButtonConfig[] = [
  {
    device: HardwareDeviceNames.ledger,
    testId: 'connect-ledger-btn',
    logo: LogoLedger as DeviceButtonConfig['logo'],
    ariaLabel: 'Ledger',
  },
  {
    device: HardwareDeviceNames.trezor,
    testId: 'connect-trezor-btn',
    logo: LogoTrezor as DeviceButtonConfig['logo'],
    ariaLabel: 'Trezor',
  },
  {
    device: HardwareDeviceNames.lattice,
    testId: 'connect-lattice-btn',
    logo: LogoLattice as DeviceButtonConfig['logo'],
    ariaLabel: 'Lattice',
  },
  {
    device: HardwareDeviceNames.qr,
    testId: 'connect-qr-btn',
    logo: LogoQRBased as DeviceButtonConfig['logo'],
    ariaLabel: 'QRCode',
  },
];

type TutorialStepConfig = {
  titleKey: string;
  messageKey: string;
  asset: string;
  dimensions: { width: string; height: string };
  deviceName: string;
  buyLink: string;
  tutorialLink: string;
};

const DEVICE_TUTORIAL_CONFIG: Partial<Record<string, TutorialStepConfig>> = {
  [HardwareDeviceNames.ledger]: {
    titleKey: 'step2LedgerWallet',
    messageKey: 'step2LedgerWalletMsg',
    asset: 'plug-in-wallet',
    dimensions: { width: '225px', height: '75px' },
    deviceName: HardwareDeviceNames.ledger,
    buyLink: HardwareAffiliateLinks.Ledger,
    tutorialLink: HardwareAffiliateTutorialLinks.Ledger,
  },
  [HardwareDeviceNames.trezor]: {
    titleKey: 'step1TrezorWallet',
    messageKey: 'step1TrezorWalletMsg',
    asset: 'plug-in-wallet',
    dimensions: { width: '225px', height: '75px' },
    deviceName: HardwareDeviceNames.trezor,
    buyLink: HardwareAffiliateLinks.Trezor,
    tutorialLink: HardwareAffiliateTutorialLinks.Trezor,
  },
  [HardwareDeviceNames.lattice]: {
    titleKey: 'step1LatticeWallet',
    messageKey: 'step1LatticeWalletMsg',
    asset: 'connect-lattice',
    dimensions: { width: '225px', height: '75px' },
    deviceName: HardwareDeviceNames.lattice,
    buyLink: HardwareAffiliateLinks.GridPlus,
    tutorialLink: HardwareAffiliateTutorialLinks.GridPlus,
  },
};

type QrBrandConfig = {
  labelKey: string;
  deviceName: string;
  primaryLabelKey: string;
  primaryLink: string;
  primaryAction: string;
  secondaryLabelKey: string;
  secondaryLink: string;
  testIdPrefix?: string;
};

const QR_BRAND_CONFIG: QrBrandConfig[] = [
  {
    labelKey: 'keystone',
    deviceName: QrHardwareDeviceNames.Keystone,
    primaryLabelKey: 'learnMoreKeystone',
    primaryLink: HardwareAffiliateLinks.Keystone,
    primaryAction: MarketingActionNames.LearnMore,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.Keystone,
  },
  {
    labelKey: 'airgapVault',
    deviceName: QrHardwareDeviceNames.AirGap,
    primaryLabelKey: 'downloadNow',
    primaryLink: HardwareAffiliateLinks.AirGap,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.AirGap,
  },
  {
    labelKey: 'coolWallet',
    deviceName: QrHardwareDeviceNames.CoolWallet,
    primaryLabelKey: 'buyNow',
    primaryLink: HardwareAffiliateLinks.CoolWallet,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.CoolWallet,
  },
  {
    labelKey: 'dcent',
    deviceName: QrHardwareDeviceNames.DCent,
    primaryLabelKey: 'buyNow',
    primaryLink: HardwareAffiliateLinks.DCent,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.DCent,
  },
  {
    labelKey: 'imToken',
    deviceName: QrHardwareDeviceNames.ImToken,
    primaryLabelKey: 'downloadNow',
    primaryLink: HardwareAffiliateLinks.ImToken,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.ImToken,
  },
  {
    labelKey: 'oneKey',
    deviceName: HardwareDeviceNames.oneKey,
    primaryLabelKey: 'buyNow',
    primaryLink: HardwareAffiliateLinks.OneKey,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.OneKey,
  },
  {
    labelKey: 'QRHardwareWalletSteps2Description',
    deviceName: QrHardwareDeviceNames.Ngrave,
    primaryLabelKey: 'buyNow',
    primaryLink: HardwareAffiliateLinks.Ngrave,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'learnMoreUpperCase',
    secondaryLink: HardwareAffiliateTutorialLinks.Ngrave,
    testIdPrefix: 'ngrave-brand',
  },
  {
    labelKey: 'keycardShell',
    deviceName: QrHardwareDeviceNames.KShell,
    primaryLabelKey: 'buyNow',
    primaryLink: HardwareAffiliateLinks.KShell,
    primaryAction: MarketingActionNames.BuyNow,
    secondaryLabelKey: 'tutorial',
    secondaryLink: HardwareAffiliateTutorialLinks.KShell,
  },
];

type SelectHardwareProps = {
  onCancel: () => void;
  connectToHardwareWallet: (device: string) => void;
  browserSupported: boolean;
  ledgerTransportType?: LedgerTransportTypes | 'live';
};

const SelectHardware = ({
  onCancel,
  connectToHardwareWallet,
  browserSupported,
  ledgerTransportType,
}: SelectHardwareProps) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [trezorRequestDevicePending, setTrezorRequestDevicePending] =
    useState(false);

  const trackMarketingEvent = useCallback(
    (type: string, device: string) => {
      trackEvent({
        event: MetaMetricsEventName.HardwareWalletMarketingButtonClicked,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          button_type: type,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          device_type: upperFirst(device),
        },
      });
    },
    [trackEvent],
  );

  const connect = useCallback(async () => {
    if (selectedDevice) {
      if (selectedDevice === HardwareDeviceNames.trezor && isUSBSupported) {
        setTrezorRequestDevicePending(true);
        try {
          await window.navigator.usb.requestDevice({
            filters: [
              { vendorId: 0x534c, productId: 0x0001 },
              { vendorId: 0x1209, productId: 0x53c0 },
              { vendorId: 0x1209, productId: 0x53c1 },
            ],
          });
        } catch (e) {
          if (!(e instanceof Error) || !e.message.match('No device selected')) {
            throw e;
          }
        } finally {
          setTrezorRequestDevicePending(false);
        }
      }
      connectToHardwareWallet(selectedDevice);
    }
    return null;
  }, [connectToHardwareWallet, selectedDevice]);

  const renderDeviceButton = ({
    device: deviceName,
    testId,
    logo: LogoComponent,
    ariaLabel,
  }: DeviceButtonConfig) => (
    <button
      data-testid={testId}
      type="button"
      className={classnames('hw-connect__btn', {
        selected: selectedDevice === deviceName,
      })}
      onClick={() => setSelectedDevice(deviceName)}
      key={deviceName}
    >
      <LogoComponent className="hw-connect__btn__img" ariaLabel={ariaLabel} />
    </button>
  );

  const renderMarketingButtons = (
    deviceName: string,
    buyLink: string,
    tutorialLink: string,
  ) => (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      marginBottom={2}
    >
      <Button
        className="hw-connect__external-btn-first"
        variant={ButtonVariant.Secondary}
        onClick={() => {
          trackMarketingEvent(MarketingActionNames.BuyNow, deviceName);
          openWindow(buyLink);
        }}
      >
        {t('buyNow')}
      </Button>
      <Button
        className="hw-connect__external-btn"
        variant={ButtonVariant.Secondary}
        onClick={() => {
          trackMarketingEvent(MarketingActionNames.Tutorial, deviceName);
          openWindow(tutorialLink);
        }}
      >
        {t('tutorial')}
      </Button>
    </Box>
  );

  const renderQrBrandSection = (brand: QrBrandConfig) => (
    <>
      <Text
        asChild
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Bold}
        className="hw-connect__QR-subtitle"
      >
        <p>{t(brand.labelKey)}</p>
      </Text>
      <Button
        className="hw-connect__external-btn-first"
        variant={ButtonVariant.Secondary}
        onClick={() => {
          trackMarketingEvent(brand.primaryAction, brand.deviceName);
          openWindow(brand.primaryLink);
        }}
        {...(brand.testIdPrefix
          ? { 'data-testid': `${brand.testIdPrefix}-buy-now-btn` }
          : {})}
      >
        {t(brand.primaryLabelKey)}
      </Button>
      <Button
        className="hw-connect__external-btn"
        variant={ButtonVariant.Secondary}
        onClick={() => {
          trackMarketingEvent(MarketingActionNames.Tutorial, brand.deviceName);
          openWindow(brand.secondaryLink);
        }}
        {...(brand.testIdPrefix
          ? { 'data-testid': `${brand.testIdPrefix}-learn-more-btn` }
          : {})}
      >
        {t(brand.secondaryLabelKey)}
      </Button>
    </>
  );

  const renderDeviceButtons = () => (
    <>
      <Box className="hw-connect__btn-wrapper">
        {renderDeviceButton(DEVICE_BUTTONS[0])}
        {renderDeviceButton(DEVICE_BUTTONS[1])}
      </Box>
      <Box className="hw-connect__btn-wrapper" marginTop={2}>
        {renderDeviceButton(DEVICE_BUTTONS[2])}
        {renderDeviceButton(DEVICE_BUTTONS[3])}
      </Box>
    </>
  );

  const renderContinueButton = () => (
    <Button
      data-testid="connect-hardware-continue-btn"
      variant={ButtonVariant.Primary}
      size={ButtonSize.Lg}
      className="hw-connect__connect-btn"
      onClick={connect}
      disabled={
        !selectedDevice ||
        trezorRequestDevicePending ||
        (selectedDevice === HardwareDeviceNames.ledger && isFirefox)
      }
    >
      {t('continue')}
    </Button>
  );

  const renderFooter = () => (
    <Box marginTop={4} className="new-external-account-form footer">
      <Text
        color={TextColor.TextAlternative}
        variant={TextVariant.BodySm}
        textAlign={TextAlign.Center}
        asChild
      >
        <h6>{t('hardwareWalletsInfo')}</h6>
      </Text>
    </Box>
  );

  const renderUnsupportedBrowser = () => (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      className="new-external-account-form unsupported-browser"
    >
      <Box
        className="hw-connect"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
      >
        <Box marginTop={6} marginBottom={3}>
          <Text
            className="hw-connect__title"
            variant={TextVariant.HeadingMd}
            asChild
            fontWeight={FontWeight.Bold}
          >
            <h3>{t('browserNotSupported')}</h3>
          </Text>
        </Box>
        <Box marginTop={3} marginBottom={5}>
          <Text
            className="hw-connect__msg"
            variant={TextVariant.BodyMd}
            asChild
          >
            <h5>{t('chromeRequiredForHardwareWallets')}</h5>
          </Text>
        </Box>
      </Box>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={() =>
          global.platform.openTab({
            url: 'https://google.com/chrome',
          })
        }
      >
        {t('downloadGoogleChrome')}
      </Button>
    </Box>
  );

  const renderHeader = () => (
    <Box
      className="hw-connect__header"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
    >
      {selectedDevice === HardwareDeviceNames.ledger && !isFirefox && (
        <Box>
          <BannerAlert
            marginTop={6}
            title={t('ledgerMultipleDevicesUnsupportedInfoTitle')}
          >
            {t('ledgerMultipleDevicesUnsupportedInfoDescription')}
          </BannerAlert>
        </Box>
      )}
      {selectedDevice === HardwareDeviceNames.ledger && isFirefox && (
        <Box>
          <BannerAlert
            marginTop={6}
            severity={BannerAlertSeverity.Warning}
            title={t('ledgerFirefoxNotSupportedTitle')}
          >
            {t('ledgerFirefoxNotSupportedDescription1')}
            <TextButton className="hw-connect__href-link" asChild>
              <a
                href={ZENDESK_URLS.HARDWARE_CONNECTION_TREZOR_LEDGER}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('ledgerFirefoxNotSupportedLink')}
              </a>
            </TextButton>
            {t('ledgerFirefoxNotSupportedDescription2')}
            <br />
            {t('ledgerFirefoxNotSupportedDescription3')}
          </BannerAlert>
        </Box>
      )}

      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        className="hw-connect__header__title-wrapper"
        marginTop={4}
      >
        <Box className="ml-auto">
          <Text
            variant={TextVariant.HeadingMd}
            asChild
            fontWeight={FontWeight.Bold}
          >
            <h3>{t('hardwareWallets')}</h3>
          </Text>
        </Box>
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close') as string}
          onClick={onCancel}
          size={ButtonIconSize.Sm}
          className="ml-auto"
          data-testid="hardware-connect-close-btn"
        />
      </Box>
      <Box marginTop={5} marginBottom={3}>
        <Text
          className="hw-connect__header__msg"
          variant={TextVariant.BodyMd}
          asChild
        >
          <h5>{t('hardwareWalletsMsg')}</h5>
        </Text>
      </Box>
    </Box>
  );

  /**
   * Renders tutorial steps for Ledger, Trezor, or Lattice using a shared layout.
   * Each device has a single step with buy/tutorial marketing buttons,
   * a message with a support link, and an asset image.
   *
   * @param config - The tutorial step configuration for the device
   */
  const renderDeviceTutorialContent = (config: TutorialStepConfig) => (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      className="hw-connect"
    >
      <Text
        asChild
        variant={TextVariant.HeadingSm}
        className="hw-connect__title"
      >
        <h3>{t(config.titleKey)}</h3>
      </Text>
      {renderMarketingButtons(
        config.deviceName,
        config.buyLink,
        config.tutorialLink,
      )}
      <Text asChild variant={TextVariant.BodyMd} className="hw-connect__msg">
        <p>
          {t(config.messageKey, [
            <TextButton
              className="hw-connect__msg-link"
              key={`${config.deviceName}-support-link`}
              asChild
            >
              <a
                href={ZENDESK_URLS.HARDWARE_CONNECTION}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('hardwareWalletSupportLinkConversion')}
              </a>
            </TextButton>,
          ])}
        </p>
      </Text>
      <img
        className="hw-connect__step-asset"
        src={`images/${config.asset}.svg`}
        {...config.dimensions}
        alt=""
      />
    </Box>
  );

  const renderDeviceTutorialSteps = (config: TutorialStepConfig) => (
    <Box className="hw-tutorial">{renderDeviceTutorialContent(config)}</Box>
  );

  /**
   * Renders the QR hardware wallet section with a title step
   * followed by all supported QR-based wallet brands.
   */
  const renderQRHardwareWalletSteps = () => (
    <Box className="hw-tutorial">
      <Box className="hw-connect">
        <Text
          asChild
          variant={TextVariant.HeadingSm}
          className="hw-connect__title"
        >
          <h3>{t('QRHardwareWalletSteps1Title')}</h3>
        </Text>
        <Text asChild variant={TextVariant.BodyMd} className="hw-connect__msg">
          <p>{t('QRHardwareWalletSteps1Description')}</p>
        </Text>
      </Box>
      {QR_BRAND_CONFIG.map((brand) => (
        <Box className="hw-connect" key={brand.deviceName}>
          <Box className="hw-connect__msg">{renderQrBrandSection(brand)}</Box>
        </Box>
      ))}
    </Box>
  );

  const renderLedgerLiveStep = () => (
    <Box className="hw-connect">
      <Text
        asChild
        variant={TextVariant.HeadingSm}
        className="hw-connect__title"
      >
        <h3>{t('step1LedgerWallet')}</h3>
      </Text>
      <Text asChild variant={TextVariant.BodyMd} className="hw-connect__msg">
        <p>
          {t('step1LedgerWalletMsg', [
            <TextButton
              className="hw-connect__msg-link"
              key="ledger-live-app-link"
              asChild
            >
              <a
                href={LEDGER_LIVE_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('ledgerLiveApp')}
              </a>
            </TextButton>,
          ])}
        </p>
      </Text>
    </Box>
  );

  const renderTutorialSteps = () => {
    if (selectedDevice === HardwareDeviceNames.qr) {
      return renderQRHardwareWalletSteps();
    }
    const config = selectedDevice
      ? DEVICE_TUTORIAL_CONFIG[selectedDevice]
      : undefined;

    if (
      selectedDevice === HardwareDeviceNames.ledger &&
      ledgerTransportType === 'live' &&
      config
    ) {
      return (
        <Box className="hw-tutorial">
          {renderLedgerLiveStep()}
          {renderDeviceTutorialContent(config)}
        </Box>
      );
    }

    return config ? renderDeviceTutorialSteps(config) : null;
  };

  const renderConnectScreen = () => (
    <Box
      className="new-external-account-form"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
    >
      {renderHeader()}
      {renderDeviceButtons()}
      {selectedDevice ? renderTutorialSteps() : null}
      {renderContinueButton()}
      {renderFooter()}
    </Box>
  );

  if (browserSupported) {
    return renderConnectScreen();
  }
  return renderUnsupportedBrowser();
};

export default SelectHardware;
