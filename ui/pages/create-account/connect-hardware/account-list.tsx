import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getAccountLink } from '@metamask/etherscan-link';
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
  IconName,
  Text,
  TextButton,
  TextVariant,
} from '@metamask/design-system-react';
import { Label } from '../../../components/component-library';
import Checkbox from '../../../components/ui/check-box';
import Dropdown from '../../../components/ui/dropdown';

import { getURLHostName } from '../../../helpers/utils/util';

import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';

type HardwareAccount = {
  address: string;
  balance: string;
  index: number;
};

type AccountListProps = {
  onPathChange: (path: string) => void;
  selectedPath: string;
  device: string;
  accounts: HardwareAccount[];
  connectedAccounts: string[];
  onAccountChange: (index: number) => void;
  onForgetDevice: (device: string, hdPath: string) => void;
  getPage: (
    device: string,
    page: number,
    hdPath: string,
    loadHid?: boolean,
  ) => void;
  chainId: string;
  rpcPrefs: Record<string, string>;
  selectedAccounts: number[];
  onUnlockAccounts: (device: string, hdPath: string) => void;
  onCancel: () => void;
  onAccountRestriction: () => void;
  hdPaths: Record<string, { name: string; value: string }[]>;
};

const AccountList = ({
  onPathChange,
  selectedPath,
  device,
  accounts,
  connectedAccounts,
  onAccountChange,
  onForgetDevice,
  getPage,
  chainId,
  rpcPrefs,
  selectedAccounts,
  onUnlockAccounts,
  onCancel,
  onAccountRestriction,
  hdPaths,
}: AccountListProps) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [pathValue, setPathValue] = useState<string | null>(null);
  const trackEventRef = useRef(trackEvent);
  const initialDeviceRef = useRef(device);

  useEffect(() => {
    trackEventRef.current = trackEvent;
  }, [trackEvent]);

  useEffect(() => {
    trackEventRef.current({
      event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        device_type: upperFirst(initialDeviceRef.current),
      },
    });
  }, []);

  const goToNextPage = useCallback(() => {
    // If we have < 5 accounts, it's restricted by BIP-44
    if (accounts.length === 5) {
      getPage(device, 1, selectedPath, false);
    } else {
      onAccountRestriction();
    }
  }, [accounts.length, device, getPage, onAccountRestriction, selectedPath]);

  const goToPreviousPage = useCallback(() => {
    getPage(device, -1, selectedPath, false);
  }, [device, getPage, selectedPath]);

  const isFirstPage = accounts[0]?.index === 0;

  const shouldShowHDPaths = [
    HardwareDeviceNames.ledger,
    HardwareDeviceNames.lattice,
    HardwareDeviceNames.trezor,
    HardwareDeviceNames.oneKey,
  ].includes(device as HardwareDeviceNames);

  const renderHdPathSelector = () => (
    <Box>
      <Text
        asChild
        variant={TextVariant.HeadingSm}
        className="hw-connect__hdPath__title"
      >
        <h3>{t('selectHdPath')}</h3>
      </Text>
      <Text asChild variant={TextVariant.BodyMd} className="hw-connect__msg">
        <p>{t('selectPathHelp')}</p>
      </Text>
      <Box className="hw-connect__hdPath">
        <Dropdown
          className="hw-connect__hdPath__select"
          options={hdPaths[device]}
          selectedOption={pathValue || selectedPath}
          onChange={(value: string) => {
            setPathValue(value);
            onPathChange(value);
          }}
        />
      </Box>
    </Box>
  );

  const renderHeader = () => (
    <Box className="hw-connect">
      <Text
        asChild
        variant={TextVariant.HeadingSm}
        className="hw-connect__unlock-title"
      >
        <h3>{t('selectAnAccount')}</h3>
      </Text>
      {shouldShowHDPaths ? renderHdPathSelector() : null}
      <Text
        asChild
        variant={TextVariant.HeadingSm}
        className="hw-connect__hdPath__title"
      >
        <h3>{t('selectAnAccount')}</h3>
      </Text>
    </Box>
  );

  const renderAccounts = () => (
    <Box className="hw-account-list">
      {accounts.map((account, idx) => {
        const accountAlreadyConnected = connectedAccounts.includes(
          account.address.toLowerCase(),
        );
        const value = account.index;
        const checked =
          selectedAccounts.includes(account.index) || accountAlreadyConnected;
        const accountLink = getAccountLink(account.address, chainId, rpcPrefs);
        const blockExplorerDomain = getURLHostName(accountLink);

        return (
          <Box
            className="hw-account-list__item"
            key={account.address}
            data-testid="hw-account-list__item"
            title={
              accountAlreadyConnected
                ? (t('selectAnAccountAlreadyConnected') as string)
                : ''
            }
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              className="hw-account-list__item__checkbox"
            >
              <Checkbox
                id={`address-${idx}`}
                checked={checked}
                disabled={accountAlreadyConnected}
                onClick={() => {
                  onAccountChange(value);
                }}
              />
              <Label
                className="hw-account-list__item__label"
                htmlFor={`address-${idx}`}
              >
                <Text
                  asChild
                  variant={TextVariant.BodySm}
                  className="hw-account-list__item__index"
                >
                  <span>{account.index + 1}</span>
                </Text>
                {`${account.address.slice(0, 4)}...${account.address.slice(
                  -4,
                )}`}
                <Text
                  asChild
                  variant={TextVariant.BodySm}
                  className="hw-account-list__item__balance"
                >
                  <span>{account.balance}</span>
                </Text>
              </Label>
            </Box>
            <ButtonIcon
              className="hw-account-list__item__link"
              onClick={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Accounts,
                  event: 'Clicked Block Explorer Link',
                  properties: {
                    actions: 'Hardware Connect',
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    link_type: 'Account Tracker',
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    block_explorer_domain: blockExplorerDomain,
                  },
                });
                global.platform.openTab({
                  url: accountLink,
                });
              }}
              ariaLabel={
                t('genericExplorerView', [blockExplorerDomain]) as string
              }
              iconName={IconName.Export}
              size={ButtonIconSize.Sm}
              title={t('genericExplorerView', [blockExplorerDomain]) as string}
            />
          </Box>
        );
      })}
    </Box>
  );

  const renderPagination = () => (
    <Box flexDirection={BoxFlexDirection.Row} className="hw-list-pagination">
      <TextButton
        className="hw-list-pagination__button"
        isDisabled={isFirstPage}
        onClick={goToPreviousPage}
        data-testid="hw-list-pagination__prev-button"
      >
        {`< ${t('prev')}`}
      </TextButton>
      <TextButton className="hw-list-pagination__button" onClick={goToNextPage}>
        {`${t('next')} >`}
      </TextButton>
    </Box>
  );

  const renderButtons = () => {
    const disabled = selectedAccounts.length === 0;

    return (
      <Box className="new-external-account-form__buttons">
        <Button
          data-testid="connect-hardware-account-list-cancel-btn"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          data-testid="connect-hardware-account-list-unlock-btn"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          className="new-external-account-form__button unlock"
          isDisabled={disabled}
          onClick={() => onUnlockAccounts(device, selectedPath)}
        >
          {t('unlock')}
        </Button>
      </Box>
    );
  };

  const renderForgetDevice = () => (
    <Box className="hw-forget-device-container">
      <TextButton
        data-testid="hardware-forget-device-button"
        onClick={() => onForgetDevice(device, selectedPath)}
      >
        {t('forgetDevice')}
      </TextButton>
    </Box>
  );

  return (
    <Box className="new-external-account-form account-list">
      {renderHeader()}
      {renderAccounts()}
      {renderPagination()}
      {renderButtons()}
      {renderForgetDevice()}
    </Box>
  );
};

export default AccountList;
