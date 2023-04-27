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
  BannerAlert,
  ButtonIcon,
  ButtonPrimary,
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
  SEVERITIES,
  FontWeight,
  BorderRadius,
  BorderColor,
  Size,
} from '../../../helpers/constants/design-system';
import { AddressCopyButton } from '../address-copy-button';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsAuthenticate } from './account-details-authenticate';

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
  const [privateKeyCopied, handlePrivateKeyCopy] = useCopyToClipboard();

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
      {attemptingExport === false ? (
        <AccountDetailsDisplay
          accounts={accounts}
          accountName={name}
          address={address}
          onExportClick={() => setAttemptingExport(true)}
        />
      ) : null}
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
            <>
              <Text marginTop={6}>{t('privateKeyCopyWarning', [name])}</Text>
              <Box
                display={DISPLAY.FLEX}
                flexDirection={FLEX_DIRECTION.ROW}
                alignItems={AlignItems.center}
                borderRadius={BorderRadius.SM}
                borderWidth={1}
                borderColor={BorderColor.default}
                padding={4}
                gap={4}
              >
                <Text
                  variant={TextVariant.bodySm}
                  style={{ wordBreak: 'break-word' }}
                >
                  {privateKey}
                </Text>
                <ButtonIcon
                  onClick={() => handlePrivateKeyCopy(privateKey)}
                  iconName={
                    privateKeyCopied ? IconName.CopySuccess : IconName.Copy
                  }
                />
              </Box>
              <BannerAlert severity={SEVERITIES.DANGER} marginTop={4}>
                <Text variant={TextVariant.bodySm}>
                  {t('privateKeyWarning')}
                </Text>
              </BannerAlert>
              <ButtonPrimary marginTop={6} onClick={onClose}>
                {t('done')}
              </ButtonPrimary>
            </>
          ) : (
            <AccountDetailsAuthenticate address={address} onCancel={onClose} />
          )}
        </>
      ) : null}
    </Popover>
  );
};

AccountDetails.propTypes = {
  address: PropTypes.string,
};
