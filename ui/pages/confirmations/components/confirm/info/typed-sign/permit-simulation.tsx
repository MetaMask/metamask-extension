import React from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { Box, Text } from '../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  TextAlign,
} from '../../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../../types/confirm';

const PermitSimulation: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;

  const {
    domain: { name },
    message: { value },
  } = JSON.parse(currentConfirmation?.msgParams?.data as string);

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.MD}
      padding={2}
      marginBottom={4}
    >
      <ConfirmInfoRow
        label={t('simulationDetailsTitle')}
        tooltip={t('simulationDetailsTitleTooltip')}
      >
        <ConfirmInfoRowText text={t('permitSimulationDetailInfo')} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={t('approve')}>
        <Box display={Display.Flex}>
          <Text
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.XL}
            paddingInline={2}
            textAlign={TextAlign.Center}
          >
            {value}
          </Text>
          <Text
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderRadius={BorderRadius.XL}
            paddingInline={2}
            marginLeft={2}
            textAlign={TextAlign.Center}
          >
            {name}
          </Text>
        </Box>
      </ConfirmInfoRow>
    </Box>
  );
};

export default PermitSimulation;
