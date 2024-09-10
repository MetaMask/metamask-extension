import React, { memo } from 'react';

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
import { useAsyncResult } from '../../../../../hooks/useAsyncResult';
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

enum Field {
  Amount = 'amount',
  BuyAmount = 'buyAmount',
  Deadline = 'deadline',
  EndAmount = 'endAmount',
  EndTime = 'endTime',
  Expiration = 'expiration',
  SellAmount = 'sellAmount',
  SigDeadline = 'sigDeadline',
  StartAmount = 'startAmount',
  StartTime = 'startTime',
  ValidTo = 'validTo',
  Value = 'value',
}

const FIELD_TOKEN_UTILS_PRIMARY_TYPES: Record<string, string[]> = {
  [Field.Amount]: [...PRIMARY_TYPES_PERMIT],
  [Field.BuyAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.EndAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.SellAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.StartAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.Value]: [...PRIMARY_TYPES_PERMIT],
};

const FIELD_DATE_PRIMARY_TYPES: Record<string, string[]> = {
  [Field.Deadline]: [...PRIMARY_TYPES_PERMIT],
  [Field.EndTime]: [...PRIMARY_TYPES_ORDER],
  [Field.Expiration]: [PrimaryType.PermitBatch, PrimaryType.PermitSingle],
  [Field.SigDeadline]: [...PRIMARY_TYPES_PERMIT],
  [Field.StartTime]: [...PRIMARY_TYPES_ORDER],
  [Field.ValidTo]: [...PRIMARY_TYPES_ORDER],
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
    (await getTokenStandardAndDetails(tokenContract))?.decimals ?? '0',
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
  const { value: decimalsResponse } = useAsyncResult(
    async () => await getTokenDecimalsOfDataTree(data),
    [data],
  );

  const tokenContractDecimals =
    typeof decimalsResponse === 'number' ? decimalsResponse : undefined;

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

function isDateField(label: string, primaryType?: PrimaryType) {
  return (FIELD_DATE_PRIMARY_TYPES[label] || [])?.includes(primaryType || '');
}

function isTokenUnitsField(label: string, primaryType?: PrimaryType) {
  return (FIELD_TOKEN_UTILS_PRIMARY_TYPES[label] || [])?.includes(
    primaryType || '',
  );
}

<<<<<<< HEAD
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

    if (isDateField(label, primaryType) && value) {
      return <ConfirmInfoRowDate date={parseInt(value, 10)} />;
    }

    if (isTokenUnitsField(label, primaryType)) {
||||||| merged common ancestors
<<<<<<<<< Temporary merge branch 1
const DataField = memo(
  ({
    label,
    isPermit,
    type,
    value,
    tokenDecimals,
  }: {
    label: string;
    isPermit: boolean;
    type: string;
    value: ValueType;
    tokenDecimals: number;
  }) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <DataTree
          data={value}
          isPermit={isPermit}
          tokenDecimals={tokenDecimals}
        />
      );
    }
    if (isPermit && label === 'value') {
      const valueBN = new BigNumber(value);
      const diviserBN = new BigNumber(10).pow(tokenDecimals);
      const resultBn = valueBN.div(diviserBN);

      // FIXME - Precision may be lost for large values when using formatAmount
      /** @see {@link https://github.com/MetaMask/metamask-extension/issues/25755} */
      const tokenValue = formatAmount('en-US', resultBn);
      const tokenValueMaxPrecision = formatAmountMaxPrecision('en-US', valueBN);

      return (
        <ConfirmInfoRowText
          isEllipsis={true}
          text={tokenValue}
          tooltip={tokenValueMaxPrecision}
        />
      );
    }
    if (isPermit && label === 'deadline') {
      return <ConfirmInfoRowDate date={parseInt(value, 10)} />;
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
||||||||| 1f74b08fc1
const DataField = ({
  label,
  isPermit,
  type,
  value,
}: {
  label: string;
  isPermit: boolean;
  type: string;
  value: ValueType;
}) => {
  if (typeof value === 'object' && value !== null) {
    return <DataTree data={value} isPermit={isPermit} />;
  }
  if (isPermit && label === 'deadline') {
    return <ConfirmInfoRowDate date={parseInt(value, 10)} />;
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
};
=========
const DataField = memo(
  ({
    label,
    isPermit,
    type,
    value,
    tokenDecimals,
  }: {
    label: string;
    isPermit: boolean;
    type: string;
    value: ValueType;
    tokenDecimals: number;
  }) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <DataTree
          data={value}
          isPermit={isPermit}
          tokenDecimals={tokenDecimals}
        />
      );
    }
    if (isPermit && label === 'value') {
=======
const DataField = memo(
  ({
    label,
    isPermit,
    type,
    value,
    tokenDecimals,
  }: {
    label: string;
    isPermit: boolean;
    type: string;
    value: ValueType;
    tokenDecimals: number;
  }) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <DataTree
          data={value}
          isPermit={isPermit}
          tokenDecimals={tokenDecimals}
        />
      );
    }
    if (isPermit && label === 'value') {
>>>>>>> master
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
