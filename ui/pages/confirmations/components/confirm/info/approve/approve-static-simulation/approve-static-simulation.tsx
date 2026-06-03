import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import Name from '../../../../../../../components/app/name';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  IconColor,
  TextAlign,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import StaticSimulation from '../../shared/static-simulation/static-simulation';
import { Container } from '../../shared/transaction-data/transaction-data';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';
import { useIsNFT } from '../hooks/use-is-nft';

export const ApproveStaticSimulation = ({
  setIsOpenEditSpendingCapModal,
}: {
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { decimals } = useAssetDetails(
    transactionMeta?.txParams?.to,
    transactionMeta?.txParams?.from,
    transactionMeta?.txParams?.data,
    transactionMeta?.chainId,
  );

  const {
    spendingCap,
    isUnlimitedSpendingCap,
    formattedSpendingCap,
    value,
    pending,
  } = useApproveTokenSimulation(transactionMeta, decimals);

  const { isNFT } = useIsNFT(transactionMeta);

  if (pending) {
    return <Container isLoading />;
  }

  if (!value) {
    return null;
  }

  const { chainId } = transactionMeta;

  const formattedTokenText = (
    <Text
      data-testid="simulation-token-value"
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.XL}
      paddingInline={2}
      textAlign={TextAlign.Center}
      alignItems={AlignItems.center}
    >
      {isUnlimitedSpendingCap ? t('unlimited') : formattedSpendingCap}
    </Text>
  );

  const SpendingCapRow = (
    <ConfirmInfoRow
      label={t(isNFT ? 'simulationApproveHeading' : 'spendingCap')}
    >
      <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          {!isNFT && (
            <ButtonIcon
              color={IconColor.primaryDefault}
              ariaLabel={t('edit')}
              iconName={IconName.Edit}
              onClick={() => setIsOpenEditSpendingCapModal(true)}
              size={ButtonIconSize.Sm}
              data-testid="edit-spending-cap-icon"
            />
          )}
          <Box
            display={Display.Inline}
            marginInlineEnd={1}
            minWidth={BlockSize.Zero}
          >
            {Boolean(isUnlimitedSpendingCap) ||
            spendingCap !== formattedSpendingCap ? (
              <Tooltip title={spendingCap}>{formattedTokenText}</Tooltip>
            ) : (
              formattedTokenText
            )}
          </Box>
          <Name
            value={transactionMeta.txParams.to as string}
            type={NameType.ETHEREUM_ADDRESS}
            preferContractSymbol
            variation={chainId}
          />
        </Box>
      </Box>
    </ConfirmInfoRow>
  );

  const simulationElements = SpendingCapRow;

  return (
    <StaticSimulation
      title={t('simulationDetailsTitle')}
      titleTooltip={t('simulationDetailsTitleTooltip')}
      description={t(
        isNFT
          ? 'simulationDetailsApproveDesc'
          : 'simulationDetailsERC20ApproveDesc',
      )}
      simulationElements={simulationElements}
    />
  );
};
