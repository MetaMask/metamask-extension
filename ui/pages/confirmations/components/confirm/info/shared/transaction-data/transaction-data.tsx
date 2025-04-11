import { hexStripZeros } from '@ethersproject/bytes';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import _ from 'lodash';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import type { UniswapPathPool } from '../../../../../../../../app/scripts/lib/transaction/decode/uniswap';
import { hasTransactionData } from '../../../../../../../../shared/modules/transaction.utils';
import type {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam} from '../../../../../../../../shared/types/transaction-decode';
import {
  DecodedTransactionDataSource,
} from '../../../../../../../../shared/types/transaction-decode';
import { renderShortTokenId } from '../../../../../../../components/app/assets/nfts/nft-details/utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../../components/component-library';
import {
  Display,
  FlexWrap,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import Preloader from '../../../../../../../components/ui/icon/preloader';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { useConfirmContext } from '../../../../../context/confirm';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';

export const TransactionData = ({
  data,
  noPadding,
  to,
}: { data?: Hex; noPadding?: boolean; to?: Hex } = {}) => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions, txParams } = currentConfirmation ?? {};
  const { data: currentData, to: currentTo } = txParams ?? {};
  const transactionData = data ?? (currentData as Hex);
  const transactionTo = to ?? (currentTo as Hex);

  const decodeResponse = useDecodedTransactionData({
    data: transactionData,
    to: transactionTo,
  });

  const { value, pending } = decodeResponse;

  // Don't show root transaction data if this is a batch transaction
  if (nestedTransactions?.length && !data) {
    return null;
  }

  if (pending) {
    return <Container isLoading noPadding={noPadding} />;
  }

  if (!hasTransactionData(transactionData)) {
    return null;
  }

  if (!value) {
    return (
      <Container noPadding={noPadding} transactionData={transactionData}>
        <RawDataRow transactionData={transactionData} />
      </Container>
    );
  }

  const { data: decodeData, source } = value;
  const isExpandable = decodeData.length > 1;
  const { chainId } = currentConfirmation;

  return (
    <Container transactionData={transactionData} noPadding={noPadding}>
      <>
        {decodeData.map((method, index) => (
          <React.Fragment key={index}>
            <FunctionContainer
              method={method}
              source={source}
              isExpandable={isExpandable}
              chainId={chainId}
            />
            {index < decodeData.length - 1 && <ConfirmInfoRowDivider />}
          </React.Fragment>
        ))}
      </>
    </Container>
  );
};

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
        noPadding={noPadding}
        data-testid="advanced-details-data-section"
      >
        <ConfirmInfoRow
          label={t('advancedDetailsDataDesc')}
          copyEnabled={Boolean(transactionData)}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
          copyText={transactionData || undefined}
        >
          <Box>{isLoading && <Preloader size={20} />}</Box>
        </ConfirmInfoRow>
        {children}
      </ConfirmInfoSection>
    </>
  );
}

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
  // if its a long string value truncate it
  let valueString = value.toString();
  if (valueString.length > 15 && !valueString.startsWith('0x')) {
    valueString = renderShortTokenId(valueString, 5);
  }

  if (!Array.isArray(value) && valueString.startsWith('0x')) {
    valueString = hexStripZeros(valueString);
  }

  return <ConfirmInfoRowText text={valueString} />;
}

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
