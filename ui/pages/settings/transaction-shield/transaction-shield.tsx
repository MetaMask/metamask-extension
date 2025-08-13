import React from 'react';
import { Box } from '../../../components/component-library';
import {
  BlockSize,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { TransactionShieldContainer } from './transaction-shield-container';
import { TransactionShieldRow } from './transaction-shield-row';

const TransactionShield = () => {
  return (
    <Box
      className="transaction-shield-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      padding={4}
    >
      <TransactionShieldContainer marginBottom={4}>
        <TransactionShieldRow>Active membership</TransactionShieldRow>
        <TransactionShieldRow>Membership details</TransactionShieldRow>
        <TransactionShieldRow>View full benefits</TransactionShieldRow>
        <TransactionShieldRow>Submit a case</TransactionShieldRow>
        <TransactionShieldRow>Cancel membership </TransactionShieldRow>
      </TransactionShieldContainer>

      <TransactionShieldContainer>
        <TransactionShieldRow>Billing Details</TransactionShieldRow>
        <TransactionShieldRow>View billing history</TransactionShieldRow>
      </TransactionShieldContainer>
    </Box>
  );
};

export default TransactionShield;
