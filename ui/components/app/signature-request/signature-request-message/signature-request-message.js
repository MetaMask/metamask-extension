import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { I18nContext } from '../../../../contexts/i18n';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
  COLORS,
  FONT_WEIGHT,
  FLEX_DIRECTION,
  SIZES,
} from '../../../../helpers/constants/design-system';
import SignatureRequestData from '../signature-request-data';

export default function SignatureRequestMessage({
  data,
  onMessageScrolled,
  setMessageRootRef,
  messageRootRef,
  messageIsScrollable,
  primaryType,
}) {
  const t = useContext(I18nContext);
  const [messageIsScrolled, setMessageIsScrolled] = useState(false);
  const setMessageIsScrolledAtBottom = () => {
    if (!messageRootRef || messageIsScrolled) {
      return;
    }

    const { scrollTop, offsetHeight, scrollHeight } = messageRootRef;
    const isAtBottom = Math.round(scrollTop) + offsetHeight >= scrollHeight;

    if (isAtBottom) {
      setMessageIsScrolled(true);
      onMessageScrolled();
    }
  };

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      onScroll={debounce(setMessageIsScrolledAtBottom, 25)}
      className="signature-request-message"
    >
      {messageIsScrollable ? (
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          justifyContent={JUSTIFY_CONTENT.CENTER}
          borderColor={COLORS.BORDER_DEFAULT}
          backgroundColor={COLORS.BACKGROUND_DEFAULT}
          color={COLORS.ICON_DEFAULT}
          onClick={() => {
            setMessageIsScrolled(true);
            onMessageScrolled();
            messageRootRef?.scrollTo(0, messageRootRef?.scrollHeight);
          }}
          className="signature-request-message__scroll-button"
          data-testid="signature-request-scroll-button"
        >
          <i className="fa fa-arrow-down" aria-label={t('scrollDown')} />
        </Box>
      ) : null}
      <Box
        backgroundColor={COLORS.BACKGROUND_DEFAULT}
        paddingBottom={3}
        paddingTop={3}
        paddingRight={3}
        margin={2}
        borderRadius={SIZES.XL}
        borderColor={COLORS.BORDER_MUTED}
        className="signature-request-message__root"
        ref={setMessageRootRef}
      >
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          color={COLORS.TEXT_DEFAULT}
          marginLeft={4}
          className="signature-request-message__title"
        >
          {primaryType}
        </Typography>
        <SignatureRequestData data={data} />
      </Box>
    </Box>
  );
}

SignatureRequestMessage.propTypes = {
  data: PropTypes.object.isRequired,
  onMessageScrolled: PropTypes.func,
  setMessageRootRef: PropTypes.func,
  messageRootRef: PropTypes.object,
  messageIsScrollable: PropTypes.bool,
  primaryType: PropTypes.string,
};
