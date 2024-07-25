import React, { memo, useEffect, useState } from 'react';

import { PERMIT_PRIMARY_TYPE } from '../../../../../../shared/constants/signatures';
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

const getTokenDecimalsFromDataTree = async (
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
  isPermit = false,
  primaryType,
  tokenDecimals = 0,
}: {
  data: Record<string, TreeData> | TreeData[];
  isPermit?: boolean;
  primaryType?: PERMIT_PRIMARY_TYPE;
  tokenDecimals?: number;
}) => {
  const [tokenContractDecimals, setTokenContractDecimals] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    getTokenDecimalsFromDataTree(data).then((decimals) => {
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
              isPermit={isPermit}
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
    isPermit,
    primaryType,
    type,
    value,
    tokenDecimals,
  }: {
    label: string;
    isPermit: boolean;
    primaryType: PERMIT_PRIMARY_TYPE | undefined;
    type: string;
    value: ValueType;
    tokenDecimals: number;
  }) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <DataTree
          data={value}
          isPermit={isPermit}
          primaryType={primaryType}
          tokenDecimals={tokenDecimals}
        />
      );
    }

    const isPermitBatchOrSingle =
      primaryType === PERMIT_PRIMARY_TYPE.PERMIT_BATCH ||
      primaryType === PERMIT_PRIMARY_TYPE.PERMIT_SINGLE;

    const isPermitTransferFrom =
      primaryType === PERMIT_PRIMARY_TYPE.PERMIT_BATCH_TRANSFER_FROM ||
      primaryType === PERMIT_PRIMARY_TYPE.PERMIT_TRANSFER_FROM;

    const isOrder =
      primaryType === PERMIT_PRIMARY_TYPE.ORDER ||
      primaryType === PERMIT_PRIMARY_TYPE.ORDER_COMPONENTS;

    const isDate =
      value &&
      ((label === 'deadline' && isPermit) ||
        (label === 'endTime' && isOrder) ||
        (label === 'expiration' && isPermitBatchOrSingle) ||
        (label === 'sigDeadline' &&
          (isPermitBatchOrSingle || isPermitTransferFrom)) ||
        (label === 'startTime' && isOrder) ||
        (label === 'validTo' && isOrder));

    if (isDate) {
      return <ConfirmInfoRowDate date={parseInt(value, 10)} />;
    }

    const isTokenUnits =
      (label === 'amount' &&
        (isPermitBatchOrSingle || isPermitTransferFrom || isOrder)) ||
      (label === 'buyAmount' && isOrder) ||
      (label === 'endAmount' && isOrder) ||
      (label === 'sellAmount' && isOrder) ||
      (label === 'startAmount' && isOrder) ||
      (label === 'value' && isPermit);

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
