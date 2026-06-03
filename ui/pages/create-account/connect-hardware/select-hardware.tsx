import React, { useCallback, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { upperFirst } from 'lodash';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextButton,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';

import { TextVariant as LegacyTextVariant } from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  HardwareDeviceNames,
  TREZOR_USB_VENDOR_IDS,
} from '../../../../shared/constants/hardware-wallets';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  PREVIOUS_ROUTE,
  CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

// Not all browsers support WebUSB (e.g. Firefox does not).
// When unavailable, Trezor connection falls back to the Trezor Connect screen
// which relies on Trezor Bridge software.
// Disabled in test environments to avoid uncontrolled USB prompts.
// See: https://mozilla.github.io/standards-positions/#webusb
const isUSBSupported = !process.env.IN_TEST && window.navigator.usb;

type WalletOptionBase = {
  id: string;
  labelKey: string;
  device: HardwareDeviceNames;
  testId: string;
};

type WalletOptionWithImage = WalletOptionBase & {
  type: 'image';
  imageSrc: string;
};

type WalletOptionWithIcon = WalletOptionBase & {
  type: 'icon';
  iconName: IconName;
};

type WalletOption = WalletOptionWithImage | WalletOptionWithIcon;

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'ledger',
    type: 'image',
    labelKey: 'ledger',
    device: HardwareDeviceNames.ledger,
    testId: 'connect-hardware-wallet-ledger',
    imageSrc: 'images/hardware-wallets/ledger.svg',
  },
  {
    id: 'keystone',
    type: 'image',
    labelKey: 'keystone',
    device: HardwareDeviceNames.qr,
    testId: 'connect-hardware-wallet-keystone',
    imageSrc: 'images/hardware-wallets/keystone.svg',
  },
  {
    id: 'trezor',
    type: 'image',
    labelKey: 'trezor',
    device: HardwareDeviceNames.trezor,
    testId: 'connect-hardware-wallet-trezor',
    imageSrc: 'images/hardware-wallets/trezor.svg',
  },
  {
    id: 'onekey',
    type: 'image',
    labelKey: 'oneKey',
    device: HardwareDeviceNames.qr,
    testId: 'connect-hardware-wallet-onekey',
    imageSrc: 'images/hardware-wallets/onekey.svg',
  },
  {
    id: 'lattice',
    type: 'image',
    labelKey: 'lattice',
    device: HardwareDeviceNames.lattice,
    testId: 'connect-hardware-wallet-lattice',
    imageSrc: 'images/hardware-wallets/lattice.svg',
  },
  {
    id: 'other-qr',
    type: 'icon',
    labelKey: 'otherQrWallet',
    device: HardwareDeviceNames.qr,
    testId: 'connect-hardware-wallet-other-qr',
    iconName: IconName.QrCode,
  },
];

type SelectHardwareProps = {
  connectToHardwareWallet: (device: string) => void;
  browserSupported: boolean;
  isFirefox: boolean;
};

/**
 * Hardware wallet selection screen that initiates the connection flow
 * for the selected device.
 *
 * @param options - Component props.
 * @param options.connectToHardwareWallet - Callback to start the connection for a given device.
 * @param options.browserSupported - Whether the current browser supports hardware wallets.
 * @param options.isFirefox - Whether the current browser is Firefox.
 */
const SelectHardware = ({
  connectToHardwareWallet,
  browserSupported,
  isFirefox,
}: SelectHardwareProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [trezorRequestDevicePending, setTrezorRequestDevicePending] =
    useState(false);
  const [showFirefoxWarning, setShowFirefoxWarning] = useState(false);

  // When opened in a fresh tab (e.g. redirected from side panel/popup for
  // hardware wallet onboarding), there is no browser history to go back to.
  // Navigate explicitly to choose-wallet-type with replace and propagate
  // fromFreshTab so upstream pages continue using explicit routing.
  const handleBack = useCallback(() => {
    if (location.key === 'default') {
      navigate(CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE, {
        replace: true,
        state: { fromFreshTab: true },
      });
    } else {
      navigate(PREVIOUS_ROUTE);
    }
  }, [location.key, navigate]);

  const handleWalletSelect = useCallback(
    async (option: WalletOption) => {
      if (trezorRequestDevicePending) {
        return;
      }

      trackEvent({
        event: MetaMetricsEventName.HardwareWalletMarketingButtonClicked,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          button_type: 'select',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          device_type: upperFirst(option.device),
        },
      });

      if (option.device === HardwareDeviceNames.ledger && isFirefox) {
        setShowFirefoxWarning(true);
        return;
      }

      setShowFirefoxWarning(false);

      if (option.device === HardwareDeviceNames.trezor && isUSBSupported) {
        setTrezorRequestDevicePending(true);
        try {
          await window.navigator.usb.requestDevice({
            filters: TREZOR_USB_VENDOR_IDS,
          });
        } catch (e) {
          if (!(e instanceof Error) || !e.message.match('No device selected')) {
            throw e;
          }
        } finally {
          setTrezorRequestDevicePending(false);
        }
      }

      connectToHardwareWallet(option.device);
    },
    [
      connectToHardwareWallet,
      isFirefox,
      trackEvent,
      trezorRequestDevicePending,
    ],
  );

  const renderWalletIcon = (option: WalletOption) => {
    if (option.type === 'image') {
      return (
        <img
          className="select-hardware__wallet-image"
          src={option.imageSrc}
          alt=""
          width={40}
          height={40}
        />
      );
    }
    return (
      <div className="select-hardware__wallet-icon">
        <Icon
          name={option.iconName}
          size={IconSize.Lg}
          color={IconColor.IconAlternative}
        />
      </div>
    );
  };

  if (!browserSupported) {
    return (
      <Page className="select-hardware">
        <Header
          textProps={{
            variant: LegacyTextVariant.headingSm,
          }}
          startAccessory={
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Md}
              ariaLabel={t('back') as string}
              onClick={handleBack}
              data-testid="hardware-connect-close-btn"
            />
          }
        >
          {t('connectAHardwareWallet')}
        </Header>
        <Content paddingLeft={4} paddingRight={4}>
          <Box paddingTop={4} paddingBottom={6}>
            <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
              {t('browserNotSupported')}
            </Text>
          </Box>
          <Text variant={TextVariant.BodyMd}>
            {t('chromeRequiredForHardwareWallets')}
          </Text>
        </Content>
      </Page>
    );
  }

  return (
    <Page className="select-hardware">
      <Header
        textProps={{
          variant: LegacyTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel={t('back') as string}
            onClick={handleBack}
            data-testid="hardware-connect-close-btn"
          />
        }
      >
        {t('connectAHardwareWallet')}
      </Header>
      <Content paddingLeft={4} paddingRight={4}>
        <Box className="select-hardware__wallet-list" gap={3}>
          {WALLET_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="select-hardware__wallet-option"
              data-testid={option.testId}
              onClick={() => handleWalletSelect(option)}
              disabled={trezorRequestDevicePending}
            >
              {renderWalletIcon(option)}
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {t(option.labelKey)}
              </Text>
            </button>
          ))}
        </Box>
        {showFirefoxWarning && (
          <Box paddingTop={4}>
            <BannerAlert
              severity={BannerAlertSeverity.Warning}
              title={t('ledgerFirefoxNotSupportedTitle') as string}
            >
              {t('ledgerFirefoxNotSupportedDescription1')}
              <TextButton asChild className="inline">
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
      </Content>
    </Page>
  );
};

export default SelectHardware;
