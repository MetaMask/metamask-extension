import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { hexStripZeros } from '@ethersproject/bytes';
import _ from 'lodash';
import { Hex } from '@metamask/utils';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import {
  Display,
  FlexWrap,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import { Box } from '../../../../../../../components/component-library';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import Preloader from '../../../../../../../components/ui/icon/preloader';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
  DecodedTransactionDataSource,
} from '../../../../../../../../shared/types/transaction-decode';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { UniswapPathPool } from '../../../../../../../../app/scripts/lib/transaction/decode/uniswap';
import { useConfirmContext } from '../../../../../context/confirm';
import { hasTransactionData } from '../../../../../../../../shared/modules/transaction.utils';

export const TransactionData = ({
  transactionData,
  noPadding,
  transactionTo,
}: {
  transactionData?: Hex;
  noPadding?: boolean;
  transactionTo?: Hex;
} = {}) => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId } = currentConfirmation;

  const decodeResponse = useDecodedTransactionData({
    chainId,
    transactionData,
    transactionTo,
  });

  const { value, pending } = decodeResponse;

  if (pending) {
    return <Container isLoading />;
  }

  if (!hasTransactionData(transactionData)) {
    return null;
  }

  if (!value) {
    return (
      <Container transactionData={transactionData}>
        <RawDataRow transactionData={transactionData as string} />
      </Container>
    );
  }

  const { data, source } = value;
  const isExpandable = data.length > 1;

  return (
    <Container transactionData={transactionData} noPadding={noPadding}>
      <>
        {data.map((method, index) => (
          <React.Fragment key={index}>
            <FunctionContainer
              method={method}
              source={source}
              isExpandable={isExpandable}
              chainId={chainId}
            />
            {index < data.length - 1 && <ConfirmInfoRowDivider />}
          </React.Fragment>
        ))}
      </>
    </Container>
  );
};

export function Container({
  children,
  isLoading,
  noPadding,
  transactionData,
}: {
  children?: React.ReactNode;
  isLoading?: boolean;
  noPadding?: boolean;
  transactionData?: string;
}) {
  const t = useI18nContext();

  return (
    <>
      <ConfirmInfoSection
        data-testid="advanced-details-data-section"
        noPadding={noPadding}
      >
        <ConfirmInfoRow
          label={t('advancedDetailsDataDesc')}
          copyEnabled={Boolean(transactionData)}
          copyText={transactionData || undefined}
        >
          <Box>{isLoading && <Preloader size={20} />}</Box>
        </ConfirmInfoRow>
        {children}
      </ConfirmInfoSection>
    </>
  );
}

function RawDataRow({ transactionData }: { transactionData: string }) {
  const t = useI18nContext();
  return (
    <ConfirmInfoRow label={t('advancedDetailsHexDesc')}>
      <ConfirmInfoRowText
        data-testid="advanced-details-transaction-hex"
        text={transactionData}
      />
    </ConfirmInfoRow>
  );
}

function FunctionContainer({
  method,
  source,
  isExpandable,
  chainId,
}: {
  method: DecodedTransactionDataMethod;
  source?: DecodedTransactionDataSource;
  isExpandable: boolean;
  chainId: string;
}) {
  const t = useI18nContext();

  const paramRows = (
    <Box paddingLeft={2} data-testid={`advanced-details-${method.name}-params`}>
      {method.params.map((param, paramIndex) => (
        <ParamRow
          key={paramIndex}
          param={param}
          index={paramIndex}
          source={source}
          chainId={chainId}
        />
      ))}
    </Box>
  );

  if (isExpandable) {
    return (
      <ConfirmInfoExpandableRow
        label={t('transactionDataFunction')}
        tooltip={method.description}
        content={paramRows}
        startExpanded
      >
        <ConfirmInfoRowText
          data-testid="advanced-details-data-function"
          text={method.name}
        />
      </ConfirmInfoExpandableRow>
    );
  }

  return (
    <>
      <ConfirmInfoRow
        data-testid="advanced-details-data-function"
        label={t('transactionDataFunction')}
        tooltip={method.description}
      >
        <ConfirmInfoRowText text={method.name} />
      </ConfirmInfoRow>
      {paramRows}
    </>
  );
}

function ParamValue({
  param,
  source,
  chainId,
}: {
  param: DecodedTransactionDataParam;
  source?: DecodedTransactionDataSource;
  chainId: string;
}) {
  const { name, type, value } = param;

  if (type === 'address') {
    return <ConfirmInfoRowAddress address={value} chainId={chainId} />;
  }

  if (name === 'path' && source === DecodedTransactionDataSource.Uniswap) {
    return <UniswapPath pathPools={value} chainId={chainId} />;
  }

  let valueString = value.toString();

  if (!Array.isArray(value) && valueString.startsWith('0x')) {
    valueString = hexStripZeros(valueString);
  }

  return <ConfirmInfoRowText text={valueString} />;
}

function ParamRow({
  param,
  index,
  source,
  chainId,
}: {
  param: DecodedTransactionDataParam;
  index: number;
  source?: DecodedTransactionDataSource;
  chainId: string;
}) {
  const { name, type, description } = param;
  const label = name ? _.startCase(name) : `Param #${index + 1}`;
  const tooltip = `${type}${description ? ` - ${description}` : ''}`;
  const dataTestId = `advanced-details-data-param-${index}`;

  const childRows = param.children?.map((childParam, childIndex) => (
    <ParamRow
      key={childIndex}
      param={childParam}
      index={childIndex}
      source={source}
      chainId={chainId}
    />
  ));

  return (
    <>
      <ConfirmInfoRow label={label} tooltip={tooltip} data-testid={dataTestId}>
        {!childRows?.length && (
          <ParamValue param={param} source={source} chainId={chainId} />
        )}
      </ConfirmInfoRow>
      {childRows && <Box paddingLeft={2}>{childRows}</Box>}
    </>
  );
}

function UniswapPath({
  pathPools,
  chainId,
}: {
  pathPools: UniswapPathPool[];
  chainId: string;
}) {
  return (
    <Box
      display={Display.Flex}
      flexWrap={FlexWrap.Wrap}
      justifyContent={JustifyContent.flexEnd}
    >
      {pathPools.map((pool, index) => (
        <>
          {index === 0 && (
            <ConfirmInfoRowAddress
              address={pool.firstAddress}
              chainId={chainId}
            />
          )}
          <ConfirmInfoRowText text={String(pool.tickSpacing)} />
          <ConfirmInfoRowAddress
            address={pool.secondAddress}
            chainId={chainId}
          />
        </>
      ))}
    </Box>
  );
}
