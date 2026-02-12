import React, { useCallback, useContext, useEffect, useState } from 'react';
import { getAccountLink } from '@metamask/etherscan-link';

import {
  Box,
  Button,
  ButtonLink,
  ButtonVariant,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../../components/component-library';
import Checkbox from '../../../components/ui/check-box';
import Dropdown from '../../../components/ui/dropdown';

import { getURLHostName } from '../../../helpers/utils/util';

import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { capitalizeStr } from './utils';

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

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.ConnectHardwareWalletAccountSelectorViewed,
      properties: {
        device_type: capitalizeStr(device),
      },
    });
    // Only fire on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        as="h3"
        variant={TextVariant.headingSm}
        className="hw-connect__hdPath__title"
      >
        {t('selectHdPath')}
      </Text>
      <Text
        as="p"
        variant={TextVariant.bodyMd}
        className="hw-connect__msg"
      >
        {t('selectPathHelp')}
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
        as="h3"
        variant={TextVariant.headingSm}
        className="hw-connect__unlock-title"
      >
        {t('selectAnAccount')}
      </Text>
      {shouldShowHDPaths ? renderHdPathSelector() : null}
      <Text
        as="h3"
        variant={TextVariant.headingSm}
        className="hw-connect__hdPath__title"
      >
        {t('selectAnAccount')}
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
              display={Display.Flex}
              alignItems={AlignItems.center}
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
                  as="span"
                  variant={TextVariant.bodySm}
                  className="hw-account-list__item__index"
                >
                  {account.index + 1}
                </Text>
                {`${account.address.slice(0, 4)}...${account.address.slice(
                  -4,
                )}`}
                <Text
                  as="span"
                  variant={TextVariant.bodySm}
                  className="hw-account-list__item__balance"
                >
                  {account.balance}
                </Text>
              </Label>
            </Box>
            <ButtonLink
              className="hw-account-list__item__link"
              onClick={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Accounts,
                  event: 'Clicked Block Explorer Link',
                  properties: {
                    actions: 'Hardware Connect',
                    link_type: 'Account Tracker',
                    block_explorer_domain: blockExplorerDomain,
                  },
                });
                global.platform.openTab({
                  url: accountLink,
                });
              }}
              title={t('genericExplorerView', [blockExplorerDomain]) as string}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon
                name={IconName.Export}
                size={IconSize.Sm}
                color={IconColor.iconDefault}
              />
            </ButtonLink>
          </Box>
        );
      })}
    </Box>
  );

  const renderPagination = () => (
    <Box
      display={Display.Flex}
      className="hw-list-pagination"
    >
      <Button
        variant={ButtonVariant.Link}
        className="hw-list-pagination__button"
        disabled={isFirstPage}
        onClick={goToPreviousPage}
        data-testid="hw-list-pagination__prev-button"
      >
        {`< ${t('prev')}`}
      </Button>
      <Button
        variant={ButtonVariant.Link}
        className="hw-list-pagination__button"
        onClick={goToNextPage}
      >
        {`${t('next')} >`}
      </Button>
    </Box>
  );

  const renderButtons = () => {
    const disabled = selectedAccounts.length === 0;

    return (
      <Box className="new-external-account-form__buttons">
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          block
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          block
          className="new-external-account-form__button unlock"
          disabled={disabled}
          onClick={() => onUnlockAccounts(device, selectedPath)}
        >
          {t('unlock')}
        </Button>
      </Box>
    );
  };

  const renderForgetDevice = () => (
    <Box className="hw-forget-device-container">
      <ButtonLink onClick={() => onForgetDevice(device, selectedPath)}>
        {t('forgetDevice')}
      </ButtonLink>
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
