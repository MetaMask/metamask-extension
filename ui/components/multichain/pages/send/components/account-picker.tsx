import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { EthAccountType } from '@metamask/keyring-api';
import { getSelectedInternalAccount } from '../../../../../selectors';
import { Box, Label } from '../../../../component-library';
import { AccountPicker } from '../../../account-picker';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  JustifyContent,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../../contexts/i18n';
import { AccountListMenu } from '../../..';
import { SEND_STAGES, getSendStage } from '../../../../../ducks/send';
import { RemoteModeStatus } from '../../../../../pages/remote-mode/components';
import { SendPageRow } from './send-page-row';

const AccountListItemProps = { showOptions: false };

type SendPageAccountPickerProps = {
  isRemoteModeEnabled?: boolean;
};

export const SendPageAccountPicker = ({
  isRemoteModeEnabled = false,
}: SendPageAccountPickerProps) => {
  const t = useContext(I18nContext);
  const internalAccount = useSelector(getSelectedInternalAccount);

  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const sendStage = useSelector(getSendStage);
  const disabled = SEND_STAGES.EDIT === sendStage;
  const onAccountListMenuClose = useCallback(() => {
    setShowAccountPicker(false);
  }, []);

  return (
    <SendPageRow>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Label paddingBottom={2}>{t('from')}</Label>
        {isRemoteModeEnabled && <RemoteModeStatus enabled />}
      </Box>
      <AccountPicker
        className="multichain-send-page__account-picker"
        address={internalAccount.address}
        name={internalAccount.metadata.name}
        onClick={() => setShowAccountPicker(true)}
        showAddress
        borderColor={BorderColor.borderMuted}
        borderWidth={1}
        paddingTop={3}
        paddingBottom={3}
        paddingLeft={3}
        block
        justifyContent={JustifyContent.flexStart}
        addressProps={{
          display: Display.Flex,
          textAlign: TextAlign.Start,
        }}
        labelProps={{
          style: { flexGrow: 1, textAlign: 'start' },
          paddingInlineStart: 1,
          className: 'multichain-send-page__account-picker__label',
        }}
        textProps={{
          display: Display.Flex,
          width: BlockSize.Full,
        }}
        width={BlockSize.Full}
        disabled={disabled}
        data-testid="send-page-account-picker"
      />
      {showAccountPicker ? (
        <AccountListMenu
          accountListItemProps={AccountListItemProps}
          showAccountCreation={false}
          onClose={onAccountListMenuClose}
          allowedAccountTypes={[EthAccountType.Eoa, EthAccountType.Erc4337]}
        />
      ) : null}
    </SendPageRow>
  );
};
