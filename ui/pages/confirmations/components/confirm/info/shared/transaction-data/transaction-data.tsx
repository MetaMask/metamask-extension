import React from 'react';
import { useSelector } from 'react-redux';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { currentConfirmationSelector } from '../../../../../selectors';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import {
  BlockSize,
  Display,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import { Box } from '../../../../../../../components/component-library';
import { decodeUniswapPath } from '../../../../../../../../shared/modules/transaction-decode/uniswap';
import { hexStripZeros } from '@ethersproject/bytes';
import { Hex } from '@metamask/utils';
import { DecodedTransactionParam } from '../../../../../../../../shared/modules/transaction-decode/types';

const Param = ({
  param,
  index,
}: {
  param: DecodedTransactionParam;
  index: number;
}) => {
  const { name, type, value, description } = param;
  let valueString = value.toString();

  if (type !== 'address' && valueString.startsWith('0x')) {
    valueString = hexStripZeros(valueString);
  }

  let content =
    type === 'address' ? (
      <ConfirmInfoRowAddress address={valueString} />
    ) : (
      <ConfirmInfoRowText text={valueString} />
    );

  if (name === 'path') {
    const pathPools = decodeUniswapPath(valueString);

    content = (
      <>
        {pathPools.map((pool) => {
          return (
            <Box justifyContent={JustifyContent.flexEnd} display={Display.Flex}>
              <ConfirmInfoRowAddress address={pool.firstAddress} />
              <ConfirmInfoRowText text={String(pool.tickSpacing)} />
              <ConfirmInfoRowAddress address={pool.secondAddress} />
            </Box>
          );
        })}
      </>
    );
  }

  const label = name ?? `#${index}`;

  return (
    <ConfirmInfoRow label={label} tooltip={description}>
      {content}
    </ConfirmInfoRow>
  );
};

export function TransactionData() {
  const currentConfirmation = useSelector(currentConfirmationSelector) as
    | TransactionMeta
    | undefined;

  const chainId = currentConfirmation?.chainId as Hex;
  const address = currentConfirmation?.txParams?.to as Hex;
  const transactionData = currentConfirmation?.txParams?.data as Hex;

  const parsedMethodData = useDecodedTransactionData({
    chainId,
    address,
    transactionData,
  });

  if (!parsedMethodData) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Data">
        <Box width={BlockSize.Full}></Box>
      </ConfirmInfoRow>
      {parsedMethodData.map((method, methodIndex) => (
        <>
          <Box>
            <ConfirmInfoRow label="Function" tooltip={method.description}>
              <ConfirmInfoRowText text={method.name} />
            </ConfirmInfoRow>
            {method.params.map((param, paramIndex) => (
              <Param
                key={`${methodIndex}_${paramIndex}`}
                param={param}
                index={paramIndex}
              />
            ))}
          </Box>
          {methodIndex < parsedMethodData.length - 1 && (
            <ConfirmInfoRowDivider />
          )}
        </>
      ))}
    </ConfirmInfoSection>
  );
}
