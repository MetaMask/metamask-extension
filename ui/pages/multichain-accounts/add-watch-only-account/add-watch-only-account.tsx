import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Box as LegacyBox,
  FormTextField,
  FormTextFieldSize,
} from '../../../components/component-library';
import {
  AlignItems,
  FlexDirection,
  TextVariant as LegacyTextVariant,
} from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useDispatch } from '../../../store/hooks';
import { importWatchOnlyAccount } from '../../../store/actions';
import { isValidHexAddress } from '../../../../shared/lib/hexstring-utils';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import { SECOND } from '../../../../shared/constants/time';

const toastId = 'watch-only-account-added-toast';
const autoHideToastDelay = 5 * SECOND;

/**
 * The "Add watch-only account" page. Lets users watch any EVM address
 * without importing any key material: the account is imported by address
 * into the watch-only keyring and cannot sign anything.
 */
export const AddWatchOnlyAccountPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [address, setAddress] = useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedAddress = useMemo(() => address.trim(), [address]);
  const isValid = useMemo(
    () => isValidHexAddress(trimmedAddress),
    [trimmedAddress],
  );

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorMessage(null);
    try {
      await dispatch(importWatchOnlyAccount(trimmedAddress));
      toast.success(
        <ToastContent
          dataTestId={toastId}
          title={t('watchOnlyAccountAdded')}
        />,
        {
          id: toastId,
          duration: autoHideToastDelay,
        },
      );
      navigate(DEFAULT_ROUTE);
    } catch (submitError) {
      setSubmitErrorMessage(t('watchOnlyAccountAddError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, isValid, isSubmitting, navigate, t, trimmedAddress]);

  const showInvalidAddress = trimmedAddress.length > 0 && !isValid;

  return (
    <Page data-testid="add-watch-only-account-page">
      <Header
        textProps={{
          variant: LegacyTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
            data-testid="add-watch-only-account-back-button"
          />
        }
      >
        {t('addWatchOnlyAccount')}
      </Header>
      <Content paddingLeft={4} paddingRight={4}>
        <LegacyBox flexDirection={FlexDirection.Column} gap={4}>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {t('watchOnlyAccountDescription')}
          </Text>
          <FormTextField
            id="watch-only-address-box"
            size={FormTextFieldSize.Lg}
            autoFocus
            label={t('watchOnlyAccountAddressLabel')}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            helpText={
              submitErrorMessage ??
              (showInvalidAddress ? t('invalidAddress') : undefined)
            }
            error={Boolean(submitErrorMessage) || showInvalidAddress}
            marginBottom={4}
            inputProps={{
              'data-testid': 'watch-only-address-input',
            }}
          />
          <LegacyBox
            flexDirection={FlexDirection.Row}
            gap={4}
            alignItems={AlignItems.center}
          >
            <Button
              onClick={handleBack}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Secondary}
              isFullWidth
              data-testid="watch-only-account-cancel-button"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              isDisabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              isFullWidth
              data-testid="watch-only-account-confirm-button"
            >
              {t('addWatchOnlyAccountButton')}
            </Button>
          </LegacyBox>
        </LegacyBox>
      </Content>
    </Page>
  );
};
