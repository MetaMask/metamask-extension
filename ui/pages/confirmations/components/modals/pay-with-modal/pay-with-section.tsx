import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextTransform,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { PaymentMethodRow } from './payment-method-row';
import type { PayWithSectionConfig } from './pay-with-modal.types';

type PayWithSectionProps = {
  config: PayWithSectionConfig;
};

export function PayWithSection({ config }: PayWithSectionProps) {
  const testId = config.testId ?? `pay-with-section-${config.id}`;

  return (
    <Box data-testid={testId} paddingTop={2} paddingBottom={2}>
      {config.title ? (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={2}>
          <Text
            variant={TextVariant.bodyXs}
            color={TextColor.textAlternative}
            textTransform={TextTransform.Uppercase}
            data-testid={`${testId}-title`}
          >
            {config.title}
          </Text>
        </Box>
      ) : null}
      <Box data-testid={`${testId}-rows`}>
        {config.rows.map((row) => (
          <PaymentMethodRow key={row.id} {...row} />
        ))}
      </Box>
    </Box>
  );
}
