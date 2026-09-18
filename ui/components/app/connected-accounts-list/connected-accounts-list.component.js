import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import {
  BackgroundColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Text,
} from '../../component-library';
import { MenuItem } from '../../ui/menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ConnectedAccountsListItem from './connected-accounts-list-item';
import ConnectedAccountsListOptions from './connected-accounts-list-options';

function ConnectedAccountsList({
  accountToConnect = null,
  connectedAccounts,
  connectAccount,
  selectedAddress,
  removePermittedAccount,
  setSelectedAddress,
  shouldRenderListOptions,
}) {
  const t = useI18nContext();
  const [accountWithOptionsShown, setAccountWithOptionsShown] = useState(null);

  const hideAccountOptions = useCallback(() => {
    setAccountWithOptionsShown(null);
  }, []);

  const disconnectAccount = useCallback(() => {
    hideAccountOptions();
    removePermittedAccount(accountWithOptionsShown);
  }, [accountWithOptionsShown, hideAccountOptions, removePermittedAccount]);

  const switchAccount = useCallback(
    (address) => {
      hideAccountOptions();
      setSelectedAddress(address);
    },
    [hideAccountOptions, setSelectedAddress],
  );

  const showAccountOptions = useCallback((address) => {
    setAccountWithOptionsShown(address);
  }, []);

  const renderUnconnectedAccount = () => {
    if (!accountToConnect) {
      return null;
    }

    const {
      address,
      metadata: { name },
    } = accountToConnect;

    return (
      <ConnectedAccountsListItem
        className="connected-accounts-list__row--highlight"
        backgroundColor={BackgroundColor.warningMuted}
        address={address}
        name={name}
        status={t('statusNotConnected')}
        action={
          <Text variant={TextVariant.bodyMd}>
            <ButtonLink
              className="connected-accounts-list__account-status-link"
              onClick={() => connectAccount(address)}
              size={ButtonLinkSize.Inherit}
            >
              {t('connect')}
            </ButtonLink>
          </Text>
        }
      />
    );
  };

  const renderListItemOptions = (address) => (
    <ConnectedAccountsListOptions
      onHideOptions={hideAccountOptions}
      onShowOptions={() => showAccountOptions(address)}
      show={accountWithOptionsShown === address}
    >
      <MenuItem iconNameLegacy={IconName.Logout} onClick={disconnectAccount}>
        {t('disconnectThisAccount')}
      </MenuItem>
    </ConnectedAccountsListOptions>
  );

  const renderListItemAction = (address) => (
    <Text variant={TextVariant.bodyMd}>
      <ButtonLink
        className="connected-accounts-list__account-status-link"
        onClick={() => switchAccount(address)}
        size={ButtonLinkSize.Inherit}
      >
        {t('switchToThisAccount')}
      </ButtonLink>
    </Text>
  );

  return (
    <main className="connected-accounts-list">
      {renderUnconnectedAccount()}
      {connectedAccounts.map(({ address, name }, index) => (
        <ConnectedAccountsListItem
          key={address}
          address={address}
          name={name}
          status={index === 0 ? t('active') : null}
          options={
            shouldRenderListOptions ? renderListItemOptions(address) : null
          }
          action={
            address === selectedAddress ? null : renderListItemAction(address)
          }
        />
      ))}
    </main>
  );
}

ConnectedAccountsList.propTypes = {
  accountToConnect: PropTypes.shape({
    id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
      keyring: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    options: PropTypes.object.isRequired,
    methods: PropTypes.arrayOf(PropTypes.string).isRequired,
    type: PropTypes.string.isRequired,
  }),
  connectedAccounts: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  connectAccount: PropTypes.func.isRequired,
  selectedAddress: PropTypes.string.isRequired,
  removePermittedAccount: PropTypes.func,
  setSelectedAddress: PropTypes.func.isRequired,
  shouldRenderListOptions: (props, propName, componentName) => {
    if (typeof props[propName] !== 'boolean') {
      return new Error(
        `Warning: Failed prop type: '${propName}' of component '${componentName}' must be a boolean. Received: ${typeof props[
          propName
        ]}`,
      );
    } else if (props[propName] && !props.removePermittedAccount) {
      return new Error(
        `Warning: Failed prop type: '${propName}' of component '${componentName}' requires prop 'removePermittedAccount'.`,
      );
    }
    return undefined;
  },
};

export default React.memo(ConnectedAccountsList);
