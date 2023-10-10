import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  HeaderBase,
  IconName,
  PickerNetwork,
  Text,
} from '../../../component-library';
import {
  SEND_STAGES,
  getDraftTransactionExists,
  getRecipient,
  getSendStage,
} from '../../../../ducks/send';
import {
  getCurrentNetwork,
  getSelectedIdentity,
  getTestNetworkBackgroundColor,
} from '../../../../selectors';
import { toggleNetworkMenu } from '../../../../store/actions';
import { AccountPicker } from '../../account-picker';

export const Send = () => {
  const dispatch = useDispatch();

  // Layout
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const currentNetwork = useSelector(getCurrentNetwork);

  // Send wiring
  const draftTransactionExists = useSelector(getDraftTransactionExists);
  const sendStage = useSelector(getSendStage);

  // Account
  const selectedIdentity = useSelector(getSelectedIdentity);

  // Recipient
  const recipient = useSelector(getRecipient);

  return (
    <Box>
      <HeaderBase
        startAccessory={() => <ButtonIcon iconName={IconName.LeftArrow} />}
      >
        Send
      </HeaderBase>
      <Box>
        <PickerNetwork
          avatarNetworkProps={{
            backgroundColor: testNetworkBackgroundColor,
          }}
          margin={2}
          label={currentNetwork?.nickname}
          src={currentNetwork?.rpcPrefs?.imageUrl}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            dispatch(toggleNetworkMenu());
          }}
        />
        {draftTransactionExists &&
        [SEND_STAGES.EDIT, SEND_STAGES.DRAFT].includes(sendStage)
          ? 'Edit Mode'
          : 'New Mode'}
      </Box>

      <Text>From</Text>
      <AccountPicker
        address={selectedIdentity.address}
        name={selectedIdentity.name}
        onClick={() => console.log('Choose Account!')}
        showAddress
      />
    </Box>
  );
};
