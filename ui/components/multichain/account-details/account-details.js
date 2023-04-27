import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Popover from '../../ui/popover/popover.component';
import {
  setAccountDetailsAddress,
  setAccountLabel,
  clearAccountDetails,
  exportAccount,
  hideWarning,
} from '../../../store/actions';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  BUTTON_SECONDARY_SIZES,
  BannerAlert,
  ButtonIcon,
  ButtonPrimary,
  ButtonSecondary,
  IconName,
  PopoverHeader,
  Text,
  TextField,
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
  SEVERITIES,
  FontWeight,
  BorderRadius,
  BorderColor,
  Size,
} from '../../../helpers/constants/design-system';
import { AddressCopyButton } from '../address-copy-button';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

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

  const [attemptingExport, setAttemptingExport] = useState(false);
  const [password, setPassword] = useState('');

  // Password error would result from appState
  const warning = useSelector((state) => state.appState.warning);

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

  const onSubmit = useCallback(() => {
    dispatch(exportAccount(password, address)).then((res) => {
      dispatch(hideWarning());
      return res;
    });
  }, [dispatch, password, address]);

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
      <Box
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        {attemptingExport === false ? (
          <>
            <EditableLabel
              defaultValue={name}
              onSubmit={(label) => dispatch(setAccountLabel(address, label))}
              accounts={accounts}
            />
            <QrView Qr={{ data: address }} />
            {exportPrivateKeyFeatureEnabled ? (
              <ButtonSecondary
                block
                size={BUTTON_SECONDARY_SIZES.LG}
                variant={TextVariant.bodyMd}
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Accounts,
                    event: MetaMetricsEventName.KeyExportSelected,
                    properties: {
                      key_type: MetaMetricsEventKeyType.Pkey,
                      location: 'Account Details Modal',
                    },
                  });
                  setAttemptingExport(true);
                }}
              >
                {t('showPrivateKey')}
              </ButtonSecondary>
            ) : null}
          </>
        ) : null}
      </Box>
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
            <>
              <Text marginTop={6} variant={TextVariant.bodySm}>
                {t('enterPassword')}
              </Text>
              <TextField
                type="password"
                onInput={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSubmit();
                  }
                }}
                autoFocus
              />
              {warning ? (
                <Text
                  marginTop={1}
                  color={TextColor.errorDefault}
                  variant={TextVariant.bodySm}
                >
                  {warning}
                </Text>
              ) : null}
              <BannerAlert marginTop={6} severity={SEVERITIES.DANGER}>
                <Text variant={TextVariant.bodySm}>
                  {t('privateKeyWarning')}
                </Text>
              </BannerAlert>
              <Box display={DISPLAY.FLEX} marginTop={6} gap={2}>
                <ButtonSecondary onClick={onClose} block>
                  {t('cancel')}
                </ButtonSecondary>
                <ButtonPrimary
                  onClick={onSubmit}
                  disabled={password === ''}
                  block
                >
                  {t('submit')}
                </ButtonPrimary>
              </Box>
            </>
          )}
        </>
      ) : null}
    </Popover>
  );
};

AccountDetails.propTypes = {
  address: PropTypes.string,
};
