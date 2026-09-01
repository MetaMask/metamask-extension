import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Skeleton } from '../../../../../../components/component-library/skeleton';

const ShieldSubscriptionApproveLoader = () => {
  return (
    <Box paddingTop={4}>
      {/* Subscription Details */}
      <ConfirmInfoSection>
        <Box flexDirection={BoxFlexDirection.Column} padding={2} gap={2}>
          <Box>
            <Skeleton height={24} width="100%" />
          </Box>
          <Box>
            <Skeleton height={24} width="50%" />
          </Box>
        </Box>
      </ConfirmInfoSection>
      {/* Estimated Changes */}
      <ConfirmInfoSection>
        <Box flexDirection={BoxFlexDirection.Column} padding={2} gap={2}>
          <Box>
            <Skeleton height={24} width="50%" />
          </Box>
          <Box>
            <Skeleton height={24} width="100%" />
          </Box>
        </Box>
      </ConfirmInfoSection>
      {/* Account Details */}
      <ConfirmInfoSection>
        <Box padding={2}>
          <Skeleton height={24} width="100%" />
        </Box>
      </ConfirmInfoSection>
      {/* Billing Details */}
      <ConfirmInfoSection>
        <Box padding={2}>
          <Skeleton height={24} width="100%" />
        </Box>
      </ConfirmInfoSection>
      {/* Gas Fees */}
      <ConfirmInfoSection>
        <Box flexDirection={BoxFlexDirection.Column} padding={2} gap={2}>
          <Box>
            <Skeleton height={24} width="100%" />
          </Box>
          <Box>
            <Skeleton height={24} width="100%" />
          </Box>
        </Box>
      </ConfirmInfoSection>
    </Box>
  );
};

export default ShieldSubscriptionApproveLoader;
