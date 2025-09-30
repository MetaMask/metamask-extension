import React, { useCallback } from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';

import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextField,
  TextFieldSize,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import {
  isValidDomainName,
  shortenAddress,
} from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useRecipients } from '../../../hooks/send/useRecipients';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useSendContext } from '../../../context/send';

export const RecipientInput = ({
  openRecipientModal,
  recipientInputRef,
  recipientValidationResult,
}: {
  openRecipientModal: () => void;
  recipientInputRef: React.RefObject<HTMLInputElement>;
  recipientValidationResult: ReturnType<typeof useRecipientValidation>;
}) => {
  const { captureRecipientSelected, setRecipientInputMethodManual } =
    useRecipientSelectionMetrics();
  const recipients = useRecipients();
  const t = useI18nContext();
  const { to, updateTo } = useSendContext();
  const { recipientError, recipientResolvedLookup, toAddressValidated } =
    recipientValidationResult;

  const onToChange = useCallback(
    (address: string) => {
      updateTo(address);
      setRecipientInputMethodManual();
    },
    [updateTo, setRecipientInputMethodManual],
  );

  const clearRecipient = useCallback(() => {
    updateTo('');
  }, [updateTo]);

  const addressIsValid =
    Boolean(to?.length) &&
    to === toAddressValidated &&
    !Boolean(recipientError);

  const resolvedAddress = addressIsValid
    ? shortenAddress(recipientResolvedLookup ?? to)
    : undefined;

  const hasRecipients = recipients.length > 0;
  const matchingRecipient = recipients.find(
    (recipient) => recipient.address.toLowerCase() === to?.toLowerCase(),
  );
  const recipientName =
    to && isValidDomainName(to)
      ? to
      : matchingRecipient?.contactName || matchingRecipient?.accountGroupName;

  return (
    <>
      {addressIsValid && resolvedAddress ? (
        <Box
          alignItems={AlignItems.center}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          borderColor={BorderColor.borderDefault}
          borderWidth={1}
          borderRadius={BorderRadius.MD}
          padding={3}
        >
          <Box alignItems={AlignItems.center} display={Display.Flex}>
            <PreferredAvatar
              address={resolvedAddress}
              size={AvatarAccountSize.Md}
            />
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              marginLeft={3}
            >
              <Text variant={TextVariant.bodyMd}>
                {recipientName ?? resolvedAddress}
              </Text>
              {recipientName && (
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySm}
                >
                  {resolvedAddress}
                </Text>
              )}
            </Box>
          </Box>
          <ButtonIcon
            ariaLabel="Clear recipient"
            data-testid="clear-recipient-btn"
            iconName={IconName.Close}
            onClick={clearRecipient}
            size={ButtonIconSize.Sm}
          />
        </Box>
      ) : (
        <TextField
          error={Boolean(recipientError)}
          endAccessory={
            hasRecipients ? (
              <ButtonIcon
                ariaLabel="Open recipient modal"
                data-testid="open-recipient-modal-btn"
                iconName={IconName.Book}
                onClick={openRecipientModal}
                size={ButtonIconSize.Md}
              />
            ) : null
          }
          onChange={(e) => onToChange(e.target.value)}
          onBlur={captureRecipientSelected}
          placeholder={t('recipientPlaceholder')}
          ref={recipientInputRef}
          value={to}
          width={BlockSize.Full}
          size={TextFieldSize.Lg}
          paddingRight={3}
        />
      )}
    </>
  );
};
