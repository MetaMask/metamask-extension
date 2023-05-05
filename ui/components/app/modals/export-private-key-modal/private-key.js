import copyToClipboard from 'copy-to-clipboard';
import { stripHexPrefix } from 'ethereumjs-util';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventKeyType,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  BLOCK_SIZES,
  BorderStyle,
  BorderColor,
  BorderRadius,
  AlignItems,
  DISPLAY,
  Color,
  FLEX_DIRECTION,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Label } from '../../../component-library';

const PrivateKeyDisplay = ({ privateKey }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const plainKey = stripHexPrefix(privateKey);

  return (
    <Box
      width={BLOCK_SIZES.FULL}
      flexDirection={FLEX_DIRECTION.COLUMN}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexStart}
      paddingLeft={4}
      paddingRight={4}
    >
      <Label
        color={Color.textDefault}
        marginBottom={2}
        variant={TextVariant.bodySm}
      >
        {t('copyPrivateKey')}
      </Label>
      <Box
        className="export-private-key-modal__private-key-display"
        width={BLOCK_SIZES.FULL}
        borderStyle={BorderStyle.solid}
        borderColor={BorderColor.borderDefault}
        borderRadius={BorderRadius.XS}
        borderWidth={1}
        padding={[2, 3, 2]}
        color={Color.errorDefault}
        onClick={() => {
          copyToClipboard(plainKey);
          trackEvent(
            {
              category: MetaMetricsEventCategory.Keys,
              event: MetaMetricsEventName.KeyExportCopied,
              properties: {
                key_type: MetaMetricsEventKeyType.Pkey,
                copy_method: 'clipboard',
              },
            },
            {},
          );
        }}
      >
        {plainKey}
      </Box>
    </Box>
  );
};

PrivateKeyDisplay.propTypes = {
  privateKey: PropTypes.string.isRequired,
};

export default PrivateKeyDisplay;
