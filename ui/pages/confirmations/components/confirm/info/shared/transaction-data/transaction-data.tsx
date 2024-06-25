import React from 'react';
import { useSelector } from 'react-redux';
import {
  ParsedParam,
  useParsedMethodData,
} from '../../hooks/useParsedMethodData';
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

const Param = ({ param, index }: { param: ParsedParam; index: number }) => {
  const { name, type, value, description } = param;
  let valueString = value.toString();

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

  const chainId = currentConfirmation?.chainId as string;
  const address = currentConfirmation?.txParams?.to as string;
  const data = currentConfirmation?.txParams?.data as string;

  const parsedMethodData = useParsedMethodData({ chainId, address, data });

  if (!parsedMethodData) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Uniswap Router Commands">
        <Box width={BlockSize.Full}></Box>
      </ConfirmInfoRow>
      {parsedMethodData.map((method, methodIndex) => (
        <>
          <Box paddingTop={3} paddingBottom={3}>
            <ConfirmInfoRow label={method.name} tooltip={method.description}>
              <Box width={BlockSize.Full}></Box>
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
