import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../ui/popover';
import { showModal, setAccountLabel } from '../../../store/actions';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import { AvatarAccount, Button, BUTTON_TYPES } from '../../component-library';
import Box from '../../ui/box';
import QrView from '../../ui/qr-code';
import EditableLabel from '../../ui/editable-label/editable-label';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
import { findKeyringForAddress } from '../../../ducks/metamask/metamask';

export const MultichainAccountDetails = (identity) => {
  const t = useContext(I18nContext);
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  const keyring = useSelector((state) =>
    findKeyringForAddress(state, identity.address),
  );
  let exportPrivateKeyFeatureEnabled = true;
  // This feature is disabled for hardware wallets
  if (isHardwareKeyring(keyring?.type)) {
    exportPrivateKeyFeatureEnabled = false;
  }

  return (
    <Popover
      className="multichain-account-details__popover"
      contentProps={{ justifyContent: JustifyContent.flexEnd }}
      title={
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          <AvatarAccount address={identity.address} size={Size.LG} />
          <EditableLabel
            className="account-details-modal__name"
            defaultValue={identity.name}
            onSubmit={(label) => {
              setAccountLabel(identity.name, label);
            }}
            accounts={accounts}
          />
        </Box>
      }
    >
      <Box
        padding={4}
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        flexDirection={FLEX_DIRECTION.COLUMN}
        gap={6}
      >
        <QrView
          Qr={{
            data: identity.address,
          }}
        />
        {exportPrivateKeyFeatureEnabled && (
          <Button
            block
            type={BUTTON_TYPES.SECONDARY}
            onClick={() => {
              showModal({ name: 'EXPORT_PRIVATE_KEY' });
            }}
          >
            {t('exportPrivateKey')}
          </Button>
        )}
      </Box>
    </Popover>
  );
};
MultichainAccountDetails.propTypes = {
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
  }).isRequired,
};
