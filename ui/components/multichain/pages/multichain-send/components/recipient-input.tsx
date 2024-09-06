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
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { normalizeSafeAddress } from '../../../../../../app/scripts/lib/multichain/address';
import { updateAndValidateRecipient } from '../../../../../ducks/multichain-send/multichain-send';
import { getCurrentMultichainDraftTransaction } from '../../../../../selectors/multichain';
import { getSelectedInternalAccount } from '../../../../../selectors';

export const SendPageRecipientInput = () => {
  const ref = useRef<HTMLInputElement>(null);
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const selectedAccount = useSelector(getSelectedInternalAccount);

  const transactionParams = useSelector(getCurrentMultichainDraftTransaction);

  const recipient = useSelector(
    (state) =>
      state.multichainSend.draftTransactions[
        state.multichainSend.currentTransactionUUID
      ]?.transactionParams?.recipient?.address ?? '',
  );

  const isValidRecipient = useSelector(
    (state) =>
      state.multichainSend.draftTransactions[
        state.multichainSend.currentTransactionUUID
      ]?.transactionParams?.recipient?.valid &&
      state.multichainSend.draftTransactions[
        state.multichainSend.currentTransactionUUID
      ]?.transactionParams?.recipient?.address.length > 0,
  );

  const shortenedAddress = shortenAddress(normalizeSafeAddress(recipient));

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const input = value.trim();

    if (input !== '') {
      await dispatch(
        updateAndValidateRecipient({
          account: selectedAccount,
          transactionParams,
          recipient: input,
        }),
      );
    }
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
        padding={[4, 3, 4, 3]}
      >
        {isValidRecipient ? (
          <>
            <AvatarAccount
              variant={AvatarAccountVariant.Blockies}
              address={recipient}
              size={AvatarAccountSize.Md}
              borderColor={BorderColor.backgroundDefault} // we currently don't have white color for border hence using backgroundDefault as the border
              marginRight={2}
            />
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              marginRight={'auto'}
            >
              <Text>{shortenedAddress}</Text>
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
          <>
            <Input
              ref={ref}
              //  @ts-expect-error Input component has the wrong type for onChange
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                event.persist();
                onChange(event);
              }}
              placeholder={'Enter public address'}
              display={Display.Block}
              type={InputType.Text}
              spellCheck={false}
              value={recipient}
              autoFocus
              data-testid="multichain-send-recipient-input"
              width={BlockSize.Full}
            />
            <ButtonIcon
              className="ens-input__wrapper__action-icon-button"
              onClick={() => {
                if (recipient?.length > 0) {
                  resetAddress();
                }
              }}
              iconName={recipient && IconName.Close}
              ariaLabel={t('close')}
              color={
                recipient ? IconColor.iconDefault : IconColor.primaryDefault
              }
              data-testid="ens-qr-scan-button"
            />
          </>
        )}
      </Box>
    </SendPageRow>
  );
};
