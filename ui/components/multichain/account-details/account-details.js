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
  AvatarAccountSize,
  AvatarAccountVariant,
  BUTTON_SECONDARY_SIZES,
  Button,
  PopoverHeader,
  Text,
} from '../../component-library';
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
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

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
      headerProps={{
        paddingBottom: 1,
      }}
      contentProps={{
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }}
      title={
        <PopoverHeader
          onClose={onClose}
          childrenWrapperProps={{
            display: DISPLAY.FLEX,
            justifyContent: JustifyContent.center,
          }}
        >
          <AvatarAccount
            variant={
              useBlockie
                ? AvatarAccountVariant.Blockies
                : AvatarAccountVariant.Jazzicon
            }
            address={address}
            size={AvatarAccountSize.Lg}
          />
        </PopoverHeader>
      }
    >
      <Box
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <EditableLabel
          defaultValue={name}
          onSubmit={(label) => dispatch(setAccountLabel(address, label))}
          accounts={accounts}
        />
        <QrView Qr={{ data: address }} />
        {exportPrivateKeyFeatureEnabled ? (
          <Button
            block
            size={BUTTON_SECONDARY_SIZES.LG}
            type="secondary"
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
            <Text variant={TextVariant.bodyMd} color={TextColor.primaryDefault}>
              {t('showPrivateKey')}
            </Text>
          </Button>
        ) : null}
      </Box>
    </Popover>
  );
};

AccountDetails.propTypes = {
  address: PropTypes.string,
};
