import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Popover from '../../ui/popover/popover.component';
import {
  setAccountDetailsAddress,
  clearAccountDetails,
  hideWarning,
} from '../../../store/actions';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  ButtonIcon,
  IconName,
  PopoverHeader,
  Text,
} from '../../component-library';
import Box from '../../ui/box/box';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
  FontWeight,
  Size,
} from '../../../helpers/constants/design-system';
import { AddressCopyButton } from '../address-copy-button';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsAuthenticate } from './account-details-authenticate';
import { AccountDetailsKey } from './account-details-key';

export const AccountDetails = ({ address }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const useBlockie = useSelector((state) => state.metamask.useBlockie);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const { name } = accounts.find((account) => account.address === address);

  const [attemptingExport, setAttemptingExport] = useState(false);

  // This is only populated when the user properly authenticates
  const privateKey = useSelector(
    (state) => state.appState.accountDetail.privateKey,
  );

  const onClose = useCallback(() => {
    dispatch(setAccountDetailsAddress(''));
    dispatch(clearAccountDetails());
    dispatch(hideWarning());
  }, [dispatch]);

  const avatar = (
    <AvatarAccount
      variant={
        useBlockie
          ? AvatarAccountVariant.Blockies
          : AvatarAccountVariant.Jazzicon
      }
      address={address}
      size={AvatarAccountSize.Lg}
    />
  );

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
        attemptingExport ? (
          <PopoverHeader
            startAccessory={
              <ButtonIcon
                onClick={() => setAttemptingExport(false)}
                iconName={IconName.ArrowLeft}
                size={Size.SM}
              />
            }
          >
            {t('showPrivateKey')}
          </PopoverHeader>
        ) : (
          <PopoverHeader
            childrenWrapperProps={{
              display: DISPLAY.FLEX,
              justifyContent: JustifyContent.center,
            }}
          >
            {avatar}
          </PopoverHeader>
        )
      }
      onClose={onClose}
    >
      {attemptingExport ? (
        <>
          <Box
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            {avatar}
            <Text
              marginTop={2}
              marginBottom={2}
              variant={TextVariant.headingSm}
              fontWeight={FontWeight.Normal}
            >
              {name}
            </Text>
            <AddressCopyButton address={address} shorten />
          </Box>
          {privateKey ? (
            <AccountDetailsKey
              accountName={name}
              onClose={onClose}
              privateKey={privateKey}
            />
          ) : (
            <AccountDetailsAuthenticate address={address} onCancel={onClose} />
          )}
        </>
      ) : (
        <AccountDetailsDisplay
          accounts={accounts}
          accountName={name}
          address={address}
          onExportClick={() => setAttemptingExport(true)}
        />
      )}
    </Popover>
  );
};

AccountDetails.propTypes = {
  address: PropTypes.string,
};
