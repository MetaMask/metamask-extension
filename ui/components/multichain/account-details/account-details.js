import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Popover from '../../ui/popover/popover.component';
import {
  setAccountDetailsAddress,
  setAccountLabel,
  showModal,
} from '../../../store/actions';
import {
  AvatarAccount,
  AvatarAccountVariant,
  ButtonSecondary,
} from '../../component-library';
import { Size } from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import EditableLabel from '../../ui/editable-label/editable-label';
import {
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
} from '../../../selectors';
import QrView from '../../ui/qr-code';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const AccountDetails = ({ address }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const useBlockie = useSelector((state) => state.metamask.useBlockie);
  const keyrings = useSelector(getMetaMaskKeyrings);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const { name } = accounts.find((account) => account.address === address);
  const keyring = keyrings.find((kr) => kr.accounts.includes(address));
  const exportPrivateKeyFeatureEnabled = !isHardwareKeyring(keyring?.type);

  const onClose = useCallback(() => {
    dispatch(setAccountDetailsAddress());
  }, [dispatch]);

  return (
    <Popover
      title={
        <AvatarAccount
          variant={
            useBlockie
              ? AvatarAccountVariant.Blockies
              : AvatarAccountVariant.Jazzicon
          }
          address={address}
          size={Size.XL}
        />
      }
      onClose={onClose}
    >
      <Box>
        <EditableLabel
          defaultValue={name}
          onSubmit={(label) => dispatch(setAccountLabel(address, label))}
          accounts={accounts}
        />
        <QrView Qr={{ data: address }} />
        {exportPrivateKeyFeatureEnabled ? (
          <ButtonSecondary
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.KeyExportSelected,
                properties: {
                  key_type: MetaMetricsEventKeyType.Pkey,
                  location: 'Account Details Modal',
                },
              });
              dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' }));
              onClose();
            }}
          >
            {t('exportPrivateKey')}
          </ButtonSecondary>
        ) : null}
      </Box>
    </Popover>
  );
};

AccountDetails.propTypes = {
  address: PropTypes.string,
};
