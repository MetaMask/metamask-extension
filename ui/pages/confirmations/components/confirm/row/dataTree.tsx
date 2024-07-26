import React, { memo, useEffect, useState } from 'react';

import {
  PrimaryType,
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
} from '../../../../../../shared/constants/signatures';
import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { sanitizeString } from '../../../../../helpers/utils/util';
import { getTokenStandardAndDetails } from '../../../../../store/actions';

import { Box } from '../../../../../components/component-library';
import { BlockSize } from '../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDate,
  ConfirmInfoRowText,
  ConfirmInfoRowTextTokenUnits,
} from '../../../../../components/app/confirm/info/row';

type ValueType = string | Record<string, TreeData> | TreeData[];

export type TreeData = {
  value: ValueType;
  type: string;
};

const FIELD = {
  AMOUNT: 'amount',
  BUY_AMOUNT: 'buyAmount',
  DEADLINE: 'deadline',
  END_AMOUNT: 'endAmount',
  END_TIME: 'endTime',
  EXPIRATION: 'expiration',
  SELL_AMOUNT: 'sellAmount',
  SIG_DEADLINE: 'sigDeadline',
  START_AMOUNT: 'startAmount',
  START_TIME: 'startTime',
  VALID_TO: 'validTo',
  VALUE: 'value',
};

const FIELD_TOKEN_UTILS_PRIMARY_TYPES = {
  [FIELD.AMOUNT]: [...PRIMARY_TYPES_PERMIT],
  [FIELD.BUY_AMOUNT]: [...PRIMARY_TYPES_ORDER],
  [FIELD.END_AMOUNT]: [...PRIMARY_TYPES_ORDER],
  [FIELD.SELL_AMOUNT]: [...PRIMARY_TYPES_ORDER],
  [FIELD.START_AMOUNT]: [...PRIMARY_TYPES_ORDER],
  [FIELD.VALUE]: [...PRIMARY_TYPES_PERMIT],
};

const FIELD_DATE_PRIMARY_TYPES = {
  [FIELD.DEADLINE]: [...PRIMARY_TYPES_PERMIT],
  [FIELD.END_TIME]: [...PRIMARY_TYPES_ORDER],
  [FIELD.EXPIRATION]: [PrimaryType.PermitBatch, PrimaryType.PermitSingle],
  [FIELD.SIG_DEADLINE]: [...PRIMARY_TYPES_PERMIT],
  [FIELD.START_TIME]: [...PRIMARY_TYPES_ORDER],
  [FIELD.VALID_TO]: [...PRIMARY_TYPES_ORDER],
};

const getTokenDecimalsOfDataTree = async (
  dataTreeData: Record<string, TreeData> | TreeData[],
): Promise<void | number> => {
  if (Array.isArray(dataTreeData)) {
    return undefined;
  }

  const tokenContract = (dataTreeData as Record<string, TreeData>).token
    ?.value as string;
  if (!tokenContract) {
    return undefined;
  }

  const decimals = parseInt(
    (await getTokenStandardAndDetails(tokenContract)).decimals ?? '0',
    10,
  );

  return decimals;
};

export const DataTree = ({
  data,
  primaryType,
  tokenDecimals = 0,
}: {
  data: Record<string, TreeData> | TreeData[];
  primaryType?: PrimaryType;
  tokenDecimals?: number;
}) => {
  const [tokenContractDecimals, setTokenContractDecimals] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    getTokenDecimalsOfDataTree(data).then((decimals) => {
      if (typeof decimals === 'number') {
        setTokenContractDecimals(decimals);
      }
    });
  }, [data]);

  return (
    <Box width={BlockSize.Full}>
      {Object.entries(data).map(([label, { value, type }], i) => (
        <ConfirmInfoRow
          label={`${sanitizeString(
            label.charAt(0).toUpperCase() + label.slice(1),
          )}:`}
          style={{ paddingRight: 0 }}
          key={`tree-data-${label}-index-${i}`}
        >
          {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            <DataField
              label={label}
              primaryType={primaryType}
              value={value}
              type={type}
              tokenDecimals={tokenContractDecimals ?? tokenDecimals}
            />
          }
        </ConfirmInfoRow>
      ))}
    </Box>
  );
};

const DataField = memo(
  ({
    label,
    primaryType,
    type,
    value,
    tokenDecimals,
  }: {
    label: string;
    primaryType?: PrimaryType;
    type: string;
    value: ValueType;
    tokenDecimals: number;
  }) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <DataTree
          data={value}
          primaryType={primaryType}
          tokenDecimals={tokenDecimals}
        />
      );
    }

    const isDate =
      value &&
      (FIELD_DATE_PRIMARY_TYPES[label] || [])?.includes(primaryType || '');
    if (isDate) {
      return <ConfirmInfoRowDate date={parseInt(value, 10)} />;
    }

    const isTokenUnits = (
      FIELD_TOKEN_UTILS_PRIMARY_TYPES[label] || []
    )?.includes(primaryType || '');
    if (isTokenUnits) {
      return (
        <ConfirmInfoRowTextTokenUnits value={value} decimals={tokenDecimals} />
      );
    }

    if (
      type === 'address' &&
      isValidHexAddress(value, {
        mixedCaseUseChecksum: true,
      })
    ) {
      return <ConfirmInfoRowAddress address={value} />;
    }

    return <ConfirmInfoRowText text={sanitizeString(value)} />;
  },
);
