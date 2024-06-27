import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { hexStripZeros } from '@ethersproject/bytes';
import { Hex } from '@metamask/utils';
import _ from 'lodash';
import {
  DecodedTransactionDataSource,
  useDecodedTransactionData,
} from '../../hooks/useDecodedTransactionData';
import { currentConfirmationSelector } from '../../../../../selectors';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import {
  Display,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../../../components/component-library';
import { decodeUniswapPath } from '../../../../../../../../shared/modules/transaction-decode/uniswap';
import {
  DecodedTransactionMethod,
  DecodedTransactionParam,
} from '../../../../../../../../shared/modules/transaction-decode/types';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useCopyToClipboard } from '../../../../../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import Preloader from '../../../../../../../components/ui/icon/preloader';

export const TransactionData = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector) as
    | TransactionMeta
    | undefined;

  const chainId = currentConfirmation?.chainId as Hex;
  const address = currentConfirmation?.txParams?.to as Hex;
  const transactionData = currentConfirmation?.txParams?.data as Hex;

  const decodeResponse = useDecodedTransactionData({
    chainId,
    address,
    transactionData,
  });

  const { data, loading, source } = decodeResponse;

  if (loading) {
    return <Container isLoading />;
  }

  if (!data) {
    return (
      <Container>
        <RawDataRow transactionData={transactionData} />
        <CopyDataButton transactionData={transactionData} />
      </Container>
    );
  }

  const isExpandable = data.length > 1;

  return (
    <Container>
      <>
        {data.map((method, index) => (
          <>
            <FunctionContainer
              key={index}
              method={method}
              source={source}
              isExpandable={isExpandable}
            />
            {index < data.length - 1 && <ConfirmInfoRowDivider />}
          </>
        ))}
        <CopyDataButton transactionData={transactionData} />
      </>
    </Container>
  );
};

function Container({
  children,
  isLoading,
}: {
  children?: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <>
      <ConfirmInfoSection>
        <ConfirmInfoRow label="Data">
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
      <ConfirmInfoRowText text={transactionData} />
    </ConfirmInfoRow>
  );
}

function FunctionContainer({
  method,
  source,
  isExpandable,
}: {
  method: DecodedTransactionMethod;
  source?: DecodedTransactionDataSource;
  isExpandable: boolean;
}) {
  const paramRows = (
    <Box paddingLeft={2}>
      {method.params.map((param, paramIndex) => (
        <ParamRow
          key={paramIndex}
          param={param}
          index={paramIndex}
          source={source}
        />
      ))}
    </Box>
  );

  if (isExpandable) {
    return (
      <ConfirmInfoExpandableRow
        label="Function"
        tooltip={method.description}
        content={paramRows}
        startExpanded
      >
        <ConfirmInfoRowText text={method.name} />
      </ConfirmInfoExpandableRow>
    );
  }

  return (
    <>
      <ConfirmInfoRow label="Function" tooltip={method.description}>
        <ConfirmInfoRowText text={method.name} />
      </ConfirmInfoRow>
      {paramRows}
    </>
  );
}

function ParamRow({
  param,
  index,
  source,
}: {
  param: DecodedTransactionParam;
  index: number;
  source?: DecodedTransactionDataSource;
}) {
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

  if (source === DecodedTransactionDataSource.Uniswap && name === 'path') {
    content = <UniswapPath pathData={valueString} />;
  }

  const label = name ? _.startCase(name) : `Param #${index + 1}`;
  const tooltip = `${type}${description ? ` - ${description}` : ''}`;

  return (
    <ConfirmInfoRow label={label} tooltip={tooltip}>
      {content}
    </ConfirmInfoRow>
  );
}

function CopyDataButton({ transactionData }: { transactionData: string }) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  const handleClick = useCallback(() => {
    handleCopy(transactionData);
  }, [handleCopy, transactionData]);

  return (
    <Box paddingInline={2}>
      <Tooltip position="right" title={copied ? t('copiedExclamation') : ''}>
        <Button
          onClick={handleClick}
          variant={ButtonVariant.Link}
          size={ButtonSize.Lg}
          startIconName={copied ? IconName.CopySuccess : IconName.Copy}
        >
          {t('copyRawTransactionData')}
        </Button>
      </Tooltip>
    </Box>
  );
}

function UniswapPath({ pathData }: { pathData: Hex }) {
  const pathPools = decodeUniswapPath(pathData);

  return (
    <>
      {pathPools.map((pool, index) => (
        <Box
          key={index}
          justifyContent={JustifyContent.flexEnd}
          display={Display.Flex}
        >
          <ConfirmInfoRowAddress address={pool.firstAddress} />
          <ConfirmInfoRowText text={String(pool.tickSpacing)} />
          <ConfirmInfoRowAddress address={pool.secondAddress} />
        </Box>
      ))}
    </>
  );
}
