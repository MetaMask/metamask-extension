import React from 'react';
import { captureException } from '@sentry/browser';

import {
  ConfirmInfoRow,
  ConfirmInfoRowProps,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowValueDouble,
  ConfirmInfoRowVariant,
} from './row';
import { ConfirmInfoContainer } from './container';

export enum ConfirmInfoRowType {
  Address = 'address',
  Divider = 'divider',
  ValueDouble = 'value-double',
}

export type ConfirmInfoRowConfig = {
  /** The display label text. This should be required unless it is a 'divider' variant */
  label?: ConfirmInfoRowProps['label'];

  /** Optional, and likely needed, props passed to the row */
  rowProps?: Record<string, any>;

  /** The type of the row e.g. address, divider, value-double */
  type: ConfirmInfoRowType;

  /** Optional row variant  */
  variant?: ConfirmInfoRowVariant;
};

interface ConfirmInfoProps {
  rowConfigs: ConfirmInfoRowConfig[];
}

export const ConfirmInfo: React.FC<ConfirmInfoProps> = ({
  rowConfigs = [],
}) => (
  <ConfirmInfoContainer>
    {rowConfigs.map((rowConfig: ConfirmInfoRowConfig, index) => {
      const { label, rowProps, type, variant } = rowConfig;
      const key = `confirm-info-row-${label}-${index}`;

      switch (type) {
        case ConfirmInfoRowType.Address:
          return (
            <React.Fragment key={key}>
              <ConfirmInfoRow label={label || ''} variant={variant}>
                <ConfirmInfoRowAddress address={rowProps?.address} />
              </ConfirmInfoRow>
            </React.Fragment>
          );
        case ConfirmInfoRowType.Divider: {
          const dividerKey = `confirm-info-divider-${rowConfigs
            .map(({ label: _label }) => _label)
            .concat('-')}-${index}`;

          return (
            <React.Fragment key={dividerKey}>
              <ConfirmInfoRowDivider />
            </React.Fragment>
          );
        }
        case ConfirmInfoRowType.ValueDouble:
          return (
            <React.Fragment key={key}>
              <ConfirmInfoRow label={label || ''} variant={variant}>
                <ConfirmInfoRowValueDouble
                  left={rowProps?.left}
                  right={rowProps?.right}
                />
              </ConfirmInfoRow>
            </React.Fragment>
          );
        default: {
          const error = new Error(`ConfirmInfo: Unknown row type: ${type}`);
          console.error(error);
          captureException(error);
          return null;
        }
      }
    })}
  </ConfirmInfoContainer>
);
