import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../ui/popover';
import {
  AlignItems,
  FLEX_DIRECTION,
  TextVariant,
  TextColor,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { Text, Button, BUTTON_VARIANT } from '../../component-library';
import Box from '../../ui/box';

export default function SwapActionTokenPopup({ onAccept }) {
  const t = useContext(I18nContext);

  const popoverRef = useRef();

  return (
    <Popover
      className="terms-of-use__popover"
      popoverRef={popoverRef}
      title="Earn MASK, get gasless swaps."
      centerTitle
      footerProps={{
        justifyContent: AlignItems.center,
        flexDirection: FLEX_DIRECTION.COLUMN,
      }}
      footer={
        <>
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            className="terms-of-use__button"
            onClick={onAccept}
            data-testid="terms-of-use-accept-button"
          >
            Continue to Swap
          </Button>
        </>
      }
    >
      <Box className="terms-of-use">
        <Box
          className="terms-of-use__content"
          marginBottom={2}
          marginLeft={4}
          marginRight={4}
          alignItems={AlignItems.center}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <img src="images/gasless.png" style={{ width: '80%' }} />
          <Text
            variant={TextVariant.bodySm}
            marginTop={2}
            paddingLeft={4}
            paddingRight={4}
            textAlign={TextAlign.Center}
          >
            Get MASK tokens when you swap to get gasless swaps on selected
            pairs.
          </Text>
        </Box>
      </Box>
    </Popover>
  );
}

SwapActionTokenPopup.propTypes = {
  onAccept: PropTypes.func.isRequired,
};
