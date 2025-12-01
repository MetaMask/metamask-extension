import React from 'react';
import {
  Box,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ButtonRow, ButtonRowContainer } from '../button-row';
const ManageShieldPlan = () => {
  const t = useI18nContext();

  return (
    <Box className="manage-plan-page w-full" data-testid="manage-plan-page">
      <Text variant={TextVariant.HeadingMd} className="px-4 mb-4">
        {t('shieldManagePlan')}
      </Text>
      <ButtonRowContainer>
        <ButtonRow
          title="Plan type"
          description="Monthly, next billing on 10 May 2025"
        />
        <ButtonRow
          title="Payment method"
          description="Card"
          onClick={() => {
            console.log('Payment method');
          }}
        />
        <Box className="border-t border-muted w-full h-px" />
        <ButtonRow
          title="Manage billing"
          rightIconProps={{
            name: IconName.ArrowRight,
          }}
          onClick={() => {
            console.log('Manage billing');
          }}
        />
      </ButtonRowContainer>
    </Box>
  );
};

export default ManageShieldPlan;
