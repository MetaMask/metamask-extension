import React from 'react';

import {
  ConfirmInfoRow,
  ConfirmInfoRowProps,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowValueDouble,
  /** todo: rename ConfirmInfoRowVariant to ConfirmInfoRowState */
  ConfirmInfoRowVariant as ConfirmInfoRowState,
} from './row';
import { ConfirmInfoContainer } from './container';

/**
 * todo: rename ConfirmInfoRowVariant to ConfirmInfoRowState
 * and rename ConfirmInfoRowType to ConfirmInfoRowVariant
 */
export enum ConfirmInfoRowType {
  Address = 'address',
  Divider = 'divider',
  ValueDouble = 'value-double',
}

export type ConfirmInfoRowConfig = {
  /** The variant of the row e.g. address, divider, value-double */
  variant: ConfirmInfoRowType;

  /** The display label text. This should be required unless it is a 'divider' variant */
  label?: ConfirmInfoRowProps['label'];

  /** Optional, and likely needed, props passed to the row */
  rowProps?: Record<string, any>;

  /** Optional row state */
  state?: ConfirmInfoRowState;
};

interface ConfirmInfoProps {
  rowConfigs: ConfirmInfoRowConfig[];
}

export const ConfirmInfo: React.FC<ConfirmInfoProps> = ({
  rowConfigs = [],
}) => (
  <ConfirmInfoContainer>
    {rowConfigs.map((rowConfig: ConfirmInfoRowConfig, index) => {
      const { label, rowProps, state, variant } = rowConfig;
      const key = `confirm-info-row-${label}-${index}`;

      switch (variant) {
        case ConfirmInfoRowType.Address:
          return (
            <React.Fragment key={key}>
              <ConfirmInfoRow label={label || ''} variant={state}>
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
              <ConfirmInfoRow label={label || ''} variant={state}>
                <ConfirmInfoRowValueDouble
                  left={rowProps?.left}
                  right={rowProps?.right}
                />
              </ConfirmInfoRow>
            </React.Fragment>
          );
        default:
          return null;
      }
    })}
  </ConfirmInfoContainer>
);
