import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleNetworkMenu } from '../../../store/actions';
import { getSelectedInternalAccount } from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(solana)
import { CreateSolanaAccountModal } from '../create-solana-account-modal';
///: END:ONLY_INCLUDE_IF
// import { openBasicFunctionalityModal } from '../../../ducks/app/app';
import { PickerNetwork, Box } from '../../component-library';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';
import { getNetworkIcon } from '../../../../shared/modules/network.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { shortenAddress } from '../../../helpers/utils/util';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import { CopyIcon } from '../../app/confirm/info/row/copy-icon';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);
  ///: END:ONLY_INCLUDE_IF

  return (
    <>
      <div className="account-overview__balance-wrapper">
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          paddingTop={4}
          style={{ width: '100%' }}
        >
          <AccountOverviewNetworkPicker />
        </Box>
        {children}
      </div>
      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(solana)
        showCreateSolanaAccountModal && (
          <CreateSolanaAccountModal
            onClose={() => setShowCreateSolanaAccountModal(false)}
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
    </>
  );
};

const AccountOverviewNetworkPicker = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const currentNetwork = useSelector(getSelectedMultichainNetworkConfiguration);
  const networkIconSrc = getNetworkIcon(currentNetwork);
  const internalAccount = useSelector(getSelectedInternalAccount);
  const shortenedAddress =
    internalAccount &&
    shortenAddress(normalizeSafeAddress(internalAccount.address));

  const handleNetworkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(toggleNetworkMenu());
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
      }}
    >
      <PickerNetwork
        avatarNetworkProps={{
          role: 'img',
          name: currentNetwork?.name || 'Unknown Network',
        }}
        aria-label={`${t('networkMenu')} ${
          currentNetwork?.name || 'Unknown Network'
        }`}
        label={currentNetwork?.name || 'Unknown Network'}
        src={networkIconSrc}
        onClick={handleNetworkClick}
        className="account-overview__network-picker"
        data-testid="account-overview-network-picker"
        style={{ backgroundColor: 'transparent' }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        position: 'relative'
      }}>
        <div style={{ fontSize: '14px' }}>{shortenedAddress}</div>
        {internalAccount && (
          <CopyIcon
            copyText={normalizeSafeAddress(internalAccount.address)}
            style={{
              position: 'static',
              cursor: 'pointer',
            }}
          />
        )}
      </div>
    </div>
  );
};
