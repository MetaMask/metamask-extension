import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Text } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import { storeDelegation, signDelegation } from '../../store/actions';
import { getSelectedAccount } from '../../selectors';

export const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

export const DelegationContainer = () => {
  const selectedAccount = useSelector(getSelectedAccount);
  const saveDelegation = () => {
    storeDelegation({
      delegate: selectedAccount.address,
      delegator: selectedAccount.address,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: BigInt(0).toString(),
      signature: '0x',
    });
  };

  const sign = async () => {
    const signature = await signDelegation({
      delegate: selectedAccount.address,
      delegator: selectedAccount.address,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: BigInt(0).toString(),
      signature: '0x',
    });
    console.log(signature);
  };

  return (
    <div className="main-container">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        paddingTop={2}
        width={BlockSize.Full}
        padding={2}
      >
        <Text as="h3" variant={TextVariant.headingMd}>
          Delegation Demo
        </Text>
        <Button onClick={saveDelegation}>Save Delegation</Button>
        <Button onClick={sign}>Sign Delegation</Button>
      </Box>
    </div>
  );
};
