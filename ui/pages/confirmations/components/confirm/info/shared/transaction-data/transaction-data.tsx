import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { hexStripZeros } from '@ethersproject/bytes';
import { Hex } from '@metamask/utils';
import _ from 'lodash';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
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
  FlexWrap,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useCopyToClipboard } from '../../../../../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import Preloader from '../../../../../../../components/ui/icon/preloader';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
  DecodedTransactionDataSource,
} from '../../../../../../../../shared/types/transaction-decode';
import { UniswapPathPool } from '../../../../../../../../app/scripts/lib/transaction/decode/uniswap';

export const TransactionData = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector) as
    | TransactionMeta
    | undefined;

  const chainId = currentConfirmation?.chainId as Hex;
  const contractAddress = currentConfirmation?.txParams?.to as Hex;
  const transactionData = currentConfirmation?.txParams?.data as Hex;

  const decodeResponse = useDecodedTransactionData({
    chainId,
    contractAddress,
    transactionData,
  });

  const { value, pending } = decodeResponse;

  if (pending) {
    return <Container isLoading />;
  }

  if (!value) {
    return (
      <Container>
        <RawDataRow transactionData={transactionData} />
        <CopyDataButton transactionData={transactionData} />
      </Container>
    );
  }

  const { data, source } = value;
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
  const t = useI18nContext();

  return (
    <>
      <ConfirmInfoSection>
        <ConfirmInfoRow label={t('advancedDetailsDataDesc')}>
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
  method: DecodedTransactionDataMethod;
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

function ParamValue({
  param,
  source,
}: {
  param: DecodedTransactionDataParam;
  source?: DecodedTransactionDataSource;
}) {
  const { name, type, value } = param;
  let valueString = value.toString();

  if (valueString.startsWith('0x')) {
    valueString = hexStripZeros(valueString);
  }

  if (type === 'address') {
    return <ConfirmInfoRowAddress address={value} />;
  }

  if (name === 'path' && source === DecodedTransactionDataSource.Uniswap) {
    return <UniswapPath pathPools={value} />;
  }

  return <ConfirmInfoRowText text={valueString} />;
}

function ParamRow({
  param,
  index,
  source,
}: {
  param: DecodedTransactionDataParam;
  index: number;
  source?: DecodedTransactionDataSource;
}) {
  const { name, type, description } = param;
  const label = name ? _.startCase(name) : `Param #${index + 1}`;
  const tooltip = `${type}${description ? ` - ${description}` : ''}`;

  return (
    <ConfirmInfoRow label={label} tooltip={tooltip}>
      <ParamValue param={param} source={source} />
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

function UniswapPath({ pathPools }: { pathPools: UniswapPathPool[] }) {
  return (
    <Box
      display={Display.Flex}
      flexWrap={FlexWrap.Wrap}
      justifyContent={JustifyContent.flexEnd}
    >
      {pathPools.map((pool, index) => (
        <>
          {index === 0 && <ConfirmInfoRowAddress address={pool.firstAddress} />}
          <ConfirmInfoRowText text={String(pool.tickSpacing)} />
          <ConfirmInfoRowAddress address={pool.secondAddress} />
        </>
      ))}
    </Box>
  );
}
