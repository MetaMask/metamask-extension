import React, { ChangeEvent, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Input,
  InputType,
  Label,
  Text,
} from '../../../../component-library';
import { I18nContext } from '../../../../../contexts/i18n';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { SendPageRow } from '../../send/components';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { normalizeSafeAddress } from '../../../../../../app/scripts/lib/multichain/address';
import { updateAndValidateRecipient } from '../../../../../ducks/multichain-send/multichain-send';
import {
  getCurrentMultichainDraftTransaction,
  getCurrentMultichainDraftTransactionRecipient,
} from '../../../../../selectors/multichain';
import {
  MULTICHAIN_CAIP_19_TO_NETWORK_NAME,
  MultichainNetworks,
} from '../../../../../../shared/constants/multichain/networks';

export type SendPageRecipientInputProps = {
  transactionId: string;
};

export const SendPageRecipientInput = ({
  transactionId,
}: SendPageRecipientInputProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { transactionParams } = useSelector(
    getCurrentMultichainDraftTransaction,
  );

  const networkName: string =
    MULTICHAIN_CAIP_19_TO_NETWORK_NAME[
      transactionParams?.network.network as MultichainNetworks
    ] ?? '';

  const {
    address: recipientAddress,
    valid: validRecipient,
    error: recipientError,
  } = useSelector(getCurrentMultichainDraftTransactionRecipient);

  const shortenedAddress = shortenAddress(
    normalizeSafeAddress(recipientAddress),
  );

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const input = value.trim();

    await dispatch(
      updateAndValidateRecipient({
        transactionId,
        recipient: input,
      }),
    );
  };

  const resetAddress = () => {
    dispatch({
      type: 'multichainSend/editTransaction',
      payload: {
        recipient: { address: '', valid: false },
      },
    });
  };

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('to')}</Label>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.MD}
        borderStyle={BorderStyle.solid}
        borderColor={BorderColor.borderMuted}
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={[4, 3, 4, 3]}
      >
        {validRecipient ? (
          <>
            <AvatarAccount
              variant={AvatarAccountVariant.Jazzicon}
              address={recipientAddress}
              size={AvatarAccountSize.Md}
              borderColor={BorderColor.backgroundDefault} // we currently don't have white color for border hence using backgroundDefault as the border
              marginRight={2}
            />
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              marginRight={'auto'}
            >
              <Text data-testid="multichain-recipient">{shortenedAddress}</Text>
              {shortenedAddress ? (
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodySm}
                  ellipsis
                >
                  {shortenedAddress}
                </Text>
              ) : null}
            </Box>
            <ButtonIcon
              iconName={IconName.Close}
              ariaLabel={t('close')}
              onClick={() => {
                resetAddress();
              }}
              className="ens-input__wrapper__action-icon-button"
              size={ButtonIconSize.Sm}
            />
          </>
        ) : (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              width={BlockSize.Full}
            >
              <Input
                ref={ref}
                //  @ts-expect-error Input component has the wrong type for onChange
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  event.persist();
                  onChange(event);
                }}
                placeholder={t('multichainRecipientAddressPlaceholder').replace(
                  '$1',
                  networkName,
                )}
                display={Display.Block}
                width={BlockSize.Full}
                type={InputType.Text}
                spellCheck={false}
                value={recipientAddress}
                autoFocus
                data-testid="multichain-send-recipient-input"
              />
              {recipientAddress && (
                <ButtonIcon
                  size={ButtonIconSize.Sm}
                  className="ens-input__wrapper__action-icon-button"
                  onClick={() => {
                    if (recipientAddress?.length > 0) {
                      resetAddress();
                    }
                  }}
                  iconName={IconName.Close}
                  ariaLabel={t('close')}
                  color={
                    recipientAddress
                      ? IconColor.iconDefault
                      : IconColor.primaryDefault
                  }
                  data-testid="clear-button"
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
      {recipientError && (
        <Text
          variant={TextVariant.bodySmMedium}
          color={TextColor.errorDefault}
          data-testid="multichain-recipient-error"
        >
          {t('invalidAddressRecipient')}
        </Text>
      )}
    </SendPageRow>
  );
};
