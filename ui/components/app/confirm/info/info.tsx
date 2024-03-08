import React from 'react';

import { captureException } from '@sentry/browser';

import {
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { Box } from '../../../component-library';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowAddressProps,
  ConfirmInfoRowDivider,
  ConfirmInfoRowProps,
  ConfirmInfoRowText,
  ConfirmInfoRowTextProps,
  ConfirmInfoRowUrl,
  ConfirmInfoRowUrlProps,
  ConfirmInfoRowValueDouble,
  ConfirmInfoRowValueDoubleProps,
  ConfirmInfoRowVariant,
} from './row';

export enum ConfirmInfoRowType {
  Address = 'address',
  Divider = 'divider',
  Text = 'text',
  UrlType = 'url',
  ValueDouble = 'value-double',
}

type ConfirmInfoTypeProps =
  | ConfirmInfoRowAddressProps
  | ConfirmInfoRowTextProps
  | ConfirmInfoRowUrlProps
  | ConfirmInfoRowValueDoubleProps;

const TYPE_TO_COMPONENT: Record<ConfirmInfoRowType, any> = {
  [ConfirmInfoRowType.Address]: ({ address }: ConfirmInfoRowAddressProps) => {
    return <ConfirmInfoRowAddress address={address} />;
  },
  [ConfirmInfoRowType.Divider]: () => {
    return <ConfirmInfoRowDivider />;
  },
  [ConfirmInfoRowType.Text]: ({ text }: ConfirmInfoRowTextProps) => {
    return <ConfirmInfoRowText text={text} />;
  },
  [ConfirmInfoRowType.UrlType]: ({ url }: ConfirmInfoRowUrlProps) => {
    return <ConfirmInfoRowUrl url={url} />;
  },
  [ConfirmInfoRowType.ValueDouble]: ({
    left,
    right,
  }: ConfirmInfoRowValueDoubleProps) => {
    return <ConfirmInfoRowValueDouble left={left} right={right} />;
  },
};

export type ConfirmInfoRowConfig = {
  /** The display label text. This should be required unless it is a 'divider' variant */
  label?: ConfirmInfoRowProps['label'];

  /** Optional, and likely needed, props passed to the row */
  rowProps?: ConfirmInfoTypeProps;

  /** The type of the row e.g. address, divider, value-double */
  type: ConfirmInfoRowType;

  /** Optional row variant  */
  variant?: ConfirmInfoRowVariant;
};

interface ConfirmInfoProps {
  rowConfigs: ConfirmInfoRowConfig[];
}

/**
 * ConfirmInfo receives a custom config object and displays a list of ConfirmInfoRow components
 *
 * @param options
 * @param options.rowConfigs
 */
export const ConfirmInfo: React.FC<ConfirmInfoProps> = ({
  rowConfigs = [],
}) => (
  <Box
    borderRadius={BorderRadius.LG}
    backgroundColor={BackgroundColor.backgroundDefault}
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
  >
    {rowConfigs.map((rowConfig: ConfirmInfoRowConfig, index) => {
      const { label, rowProps, type, variant } = rowConfig;
      const component = TYPE_TO_COMPONENT[type];

      if (!component) {
        const error = new Error(`ConfirmInfo: Unknown row type: ${type}`);
        console.error(error);
        captureException(error);
        return null;
      }

      if (type === ConfirmInfoRowType.Divider) {
        const key = `confirm-info-divider-${rowConfigs
          .map(({ label: _label }) => _label)
          .concat('-')}-${index}`;

        return (
          <React.Fragment key={key}>
            <ConfirmInfoRowDivider />
          </React.Fragment>
        );
      }

      const key = `confirm-info-row-${label}-${index}`;

      return (
        <React.Fragment key={key}>
          <ConfirmInfoRow label={label || ''} variant={variant}>
            {component(rowProps)}
          </ConfirmInfoRow>
        </React.Fragment>
      );
    })}
  </Box>
);
