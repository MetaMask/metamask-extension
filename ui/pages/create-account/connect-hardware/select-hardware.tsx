import classnames from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import { upperFirst } from 'lodash';
import {
  Text,
  Box,
  IconName,
  ButtonIconSize,
  ButtonIcon,
  Button,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
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
  MarketingActionNames,
  QrHardwareDeviceNames,
} from '../../../../shared/constants/hardware-wallets';
import type { LedgerTransportTypes } from '../../../../shared/constants/hardware-wallets';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { openWindow } from '../../../helpers/utils/window';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
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

const LEDGER_FIREFOX_NOT_SUPPORTED_URL =
  'https://support.metamask.io/more-web3/wallets/how-to-connect-a-trezor-or-ledger-hardware-wallet/';

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
  ledgerTransportType?: LedgerTransportTypes;
};

const SelectHardware = ({
  onCancel,
  connectToHardwareWallet,
  browserSupported,
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
    <Box
      as="button"
      data-testid={testId}
      className={classnames('hw-connect__btn', {
        selected: selectedDevice === deviceName,
      })}
      onClick={() => setSelectedDevice(deviceName)}
      key={deviceName}
    >
      <LogoComponent className="hw-connect__btn__img" ariaLabel={ariaLabel} />
    </Box>
  );

  const renderMarketingButtons = (
    deviceName: string,
    buyLink: string,
    tutorialLink: string,
  ) => (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
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
        as="p"
        variant={TextVariant.bodyMdBold}
        className="hw-connect__QR-subtitle"
      >
        {t(brand.labelKey)}
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
    <Text
      color={TextColor.textAlternative}
      variant={TextVariant.bodySm}
      textAlign={TextAlign.Center}
      as="h6"
      marginTop={4}
      className="new-external-account-form footer"
    >
      {t('hardwareWalletsInfo')}
    </Text>
  );

  const renderUnsupportedBrowser = () => (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      className="new-external-account-form unsupported-browser"
    >
      <Box
        className="hw-connect"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <Text
          className="hw-connect__title"
          variant={TextVariant.headingMd}
          as="h3"
          fontWeight={FontWeight.Bold}
          marginTop={6}
          marginBottom={3}
        >
          {t('browserNotSupported')}
        </Text>
        <Text
          className="hw-connect__msg"
          variant={TextVariant.bodyMd}
          as="h5"
          marginTop={3}
          marginBottom={5}
        >
          {t('chromeRequiredForHardwareWallets')}
        </Text>
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
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
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
            <ButtonLink
              className="hw-connect__href-link"
              href={LEDGER_FIREFOX_NOT_SUPPORTED_URL}
              externalLink
            >
              {t('ledgerFirefoxNotSupportedLink')}
            </ButtonLink>
            {t('ledgerFirefoxNotSupportedDescription2')}
            <br />
            {t('ledgerFirefoxNotSupportedDescription3')}
          </BannerAlert>
        </Box>
      )}

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        className="hw-connect__header__title-wrapper"
        marginTop={6}
      >
        <Text
          variant={TextVariant.headingMd}
          as="h3"
          fontWeight={FontWeight.Bold}
          marginLeft="auto"
        >
          {t('hardwareWallets')}
        </Text>
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close') as string}
          onClick={onCancel}
          size={ButtonIconSize.Sm}
          marginLeft="auto"
          data-testid="hardware-connect-close-btn"
        />
      </Box>

      <Text
        className="hw-connect__header__msg"
        variant={TextVariant.bodyMd}
        as="h5"
        marginTop={5}
        marginBottom={3}
      >
        {t('hardwareWalletsMsg')}
      </Text>
    </Box>
  );

  /**
   * Renders tutorial steps for Ledger, Trezor, or Lattice using a shared layout.
   * Each device has a single step with buy/tutorial marketing buttons,
   * a message with a support link, and an asset image.
   *
   * @param config - The tutorial step configuration for the device
   */
  const renderDeviceTutorialSteps = (config: TutorialStepConfig) => (
    <Box className="hw-tutorial">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        className="hw-connect"
      >
        <Text
          as="h3"
          variant={TextVariant.headingSm}
          className="hw-connect__title"
        >
          {t(config.titleKey)}
        </Text>
        {renderMarketingButtons(
          config.deviceName,
          config.buyLink,
          config.tutorialLink,
        )}
        <Text as="p" variant={TextVariant.bodyMd} className="hw-connect__msg">
          {t(config.messageKey, [
            <ButtonLink
              className="hw-connect__msg-link"
              href={ZENDESK_URLS.HARDWARE_CONNECTION}
              externalLink
              key={`${config.deviceName}-support-link`}
            >
              {t('hardwareWalletSupportLinkConversion')}
            </ButtonLink>,
          ])}
        </Text>
        <img
          className="hw-connect__step-asset"
          src={`images/${config.asset}.svg`}
          {...config.dimensions}
          alt=""
        />
      </Box>
    </Box>
  );

  /**
   * Renders the QR hardware wallet section with a title step
   * followed by all supported QR-based wallet brands.
   */
  const renderQRHardwareWalletSteps = () => (
    <Box className="hw-tutorial">
      <Box className="hw-connect">
        <Text
          as="h3"
          variant={TextVariant.headingSm}
          className="hw-connect__title"
        >
          {t('QRHardwareWalletSteps1Title')}
        </Text>
        <Text as="p" variant={TextVariant.bodyMd} className="hw-connect__msg">
          {t('QRHardwareWalletSteps1Description')}
        </Text>
      </Box>
      {QR_BRAND_CONFIG.map((brand) => (
        <Box className="hw-connect" key={brand.deviceName}>
          <Box className="hw-connect__msg">{renderQrBrandSection(brand)}</Box>
        </Box>
      ))}
    </Box>
  );

  const renderTutorialSteps = () => {
    if (selectedDevice === HardwareDeviceNames.qr) {
      return renderQRHardwareWalletSteps();
    }
    const config = selectedDevice
      ? DEVICE_TUTORIAL_CONFIG[selectedDevice]
      : undefined;
    return config ? renderDeviceTutorialSteps(config) : null;
  };

  const renderConnectScreen = () => (
    <Box
      className="new-external-account-form"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
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
