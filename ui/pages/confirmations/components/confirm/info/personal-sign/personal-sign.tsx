import React from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../../components/component-library';
import Tooltip from '../../../../../../components/ui/tooltip';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { isSnapId } from '../../../../../../helpers/utils/snaps';
import {
  hexToText,
  sanitizeString,
} from '../../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { selectUseTransactionSimulations } from '../../../../selectors/preferences';
import { SignatureRequestType } from '../../../../types/confirm';
import { isSIWESignatureRequest } from '../../../../utils';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';
import { SIWESignInfo } from './siwe-sign';

const PersonalSignInfo: React.FC = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<SignatureRequestType>();
  const useTransactionSimulations = useSelector(
    selectUseTransactionSimulations,
  );

  if (!currentConfirmation?.msgParams) {
    return null;
  }

  const isSIWE = isSIWESignatureRequest(currentConfirmation);
  const messageText = sanitizeString(
    hexToText(currentConfirmation.msgParams?.data),
  );

  let toolTipMessage;
  if (!isSIWE) {
    if (isSnapId(currentConfirmation.msgParams.origin)) {
      toolTipMessage = t('requestFromInfoSnap');
    } else {
      toolTipMessage = t('requestFromInfo');
    }
  }

  const SimulationDetailsKey = (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      gap={1}
    >
      <Text variant={TextVariant.bodyMdMedium}>
        {t('simulationDetailsTitle')}
      </Text>
      <Tooltip
        interactive
        position="top"
        containerClassName="info-tooltip__tooltip-container"
        tooltipInnerClassName="info-tooltip__tooltip-content"
        tooltipArrowClassName="info-tooltip__top-tooltip-arrow"
        html={t('simulationDetailsTitleTooltip')}
        theme="tippy-tooltip-info"
        style={{ display: Display.Flex }}
      >
        <Icon
          name={IconName.Question}
          marginLeft={1}
          color={IconColor.iconMuted}
          size={IconSize.Sm}
        />
      </Tooltip>
    </Box>
  );

  const SimulationDetailsValue = (
    <Text color={TextColor.textAlternative} variant={TextVariant.bodyMd}>
      {t('simulationDetailsNoChanges')}
    </Text>
  );

  return (
    <>
      {isSIWE && useTransactionSimulations && (
        <ConfirmInfoSection>
          <Box
            data-testid="simulation-details-layout"
            className="simulation-details-layout"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            borderRadius={BorderRadius.LG}
            borderColor={BorderColor.transparent}
            padding={2}
            gap={3}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
            >
              {SimulationDetailsKey}
              {SimulationDetailsValue}
            </Box>
          </Box>
        </ConfirmInfoSection>
      )}
      <ConfirmInfoSection>
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={currentConfirmation.id}
          label={t('requestFrom')}
          tooltip={toolTipMessage}
        >
          <ConfirmInfoRowUrl url={currentConfirmation.msgParams.origin} />
        </ConfirmInfoAlertRow>
        <SigningInWithRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        {isSIWE ? (
          <SIWESignInfo />
        ) : (
          <ConfirmInfoAlertRow
            alertKey="message"
            ownerId={currentConfirmation.id}
            label={t('message')}
            collapsed={false}
            copyEnabled
            copyText={messageText}
          >
            <ConfirmInfoRowText text={messageText} />
          </ConfirmInfoAlertRow>
        )}
      </ConfirmInfoSection>
    </>
  );
};

export default PersonalSignInfo;
