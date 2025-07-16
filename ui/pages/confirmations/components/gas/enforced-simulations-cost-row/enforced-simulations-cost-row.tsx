import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  Checkbox,
  IconName,
  Text,
} from '../../../../../components/component-library';
import { useEnforcedSimulationsGasCost } from '../../../hooks/gas/useEnforcedSimulationsGasCost';

export function EnforcedSimulationsCostRow() {
  const additionalGasCostFiat = useEnforcedSimulationsGasCost();

  return (
    <ConfirmInfoSection style={{ marginTop: -14 }}>
      <ConfirmInfoRow
        label="Lock in changes"
        tooltip="Test 1 2 3"
        style={{ marginTop: 0, marginBottom: 0 }}
        icon={IconName.Lock}
      >
        <Box display={Display.Flex} alignItems={AlignItems.flexEnd}>
          <Checkbox isChecked={true} />
        </Box>
      </ConfirmInfoRow>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        paddingInline={2}
      >
        <Text
          data-testid="gas-fee-token-fee"
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          + {additionalGasCostFiat} network fee
        </Text>
      </Box>
    </ConfirmInfoSection>
  );
}
