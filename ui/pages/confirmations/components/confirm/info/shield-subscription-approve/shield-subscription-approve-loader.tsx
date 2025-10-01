import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../components/component-library';
import { Skeleton } from '../../../../../../components/component-library/skeleton';

const ShieldSubscriptionApproveLoader = () => {
  return (
    <Box paddingTop={4}>
      {/* Subscription Details */}
      <ConfirmInfoSection>
        <Box paddingBottom={4}>
          <Skeleton height={12} width={150} />
        </Box>
        <Box>
          <Skeleton height={12} width={150} />
        </Box>
      </ConfirmInfoSection>
      {/* Estimated Changes */}
      <ConfirmInfoSection>
        <Box paddingBottom={4}>
          <Skeleton height={12} width={175} />
        </Box>
        <Box>
          <Skeleton height={12} width={100} />
        </Box>
      </ConfirmInfoSection>
      {/* Account Details */}
      <ConfirmInfoSection>
        <Box>
          <Skeleton height={12} width={75} />
        </Box>
      </ConfirmInfoSection>
    </Box>
  );
};

export default ShieldSubscriptionApproveLoader;
