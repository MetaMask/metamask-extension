import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';

import { Numeric } from '../../../../../../../../shared/modules/Numeric';
import Name from '../../../../../../../components/app/name/name';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  TextAlign,
} from '../../../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../../../types/confirm';
import useTokenExchangeRate from '../../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { IndividualFiatDisplay } from '../../../../simulation-details/fiat-display';

const PermitSimulation: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;
  const [faitValue, setFiatValue] = useState<number>();

  const {
    domain: { verifyingContract },
    message: { value },
  } = JSON.parse(currentConfirmation?.msgParams?.data as string);

  const exchangeRate = useTokenExchangeRate(verifyingContract);

  useEffect(() => {
    if (exchangeRate && value) {
      setFiatValue(exchangeRate.times(new Numeric(value, 10)).toNumber());
    }
  }, [exchangeRate, value]);

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
        <Box>
          <Box display={Display.Flex}>
            <Box display={Display.Inline} marginRight={1}>
              <Text
                backgroundColor={BackgroundColor.backgroundAlternative}
                borderRadius={BorderRadius.XL}
                paddingInline={2}
                textAlign={TextAlign.Center}
              >
                {value}
              </Text>
            </Box>
            <Name value={verifyingContract} type={NameType.ETHEREUM_ADDRESS} />
          </Box>
          <Box>
            {faitValue && <IndividualFiatDisplay fiatAmount={faitValue} />}
          </Box>
        </Box>
      </ConfirmInfoRow>
    </Box>
  );
};

export default PermitSimulation;
