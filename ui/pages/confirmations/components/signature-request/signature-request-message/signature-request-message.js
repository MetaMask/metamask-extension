import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { I18nContext } from '../../../../../contexts/i18n';
import Box from '../../../../../components/ui/box';
import { Text } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  Color,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  TextColor,
  FontWeight,
} from '../../../../../helpers/constants/design-system';
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
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      onScroll={debounce(setMessageIsScrolledAtBottom, 25)}
      className="signature-request-message"
    >
      {messageIsScrollable ? (
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          borderColor={BorderColor.borderDefault}
          backgroundColor={BackgroundColor.backgroundDefault}
          color={Color.iconDefault}
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
        backgroundColor={BackgroundColor.backgroundDefault}
        paddingBottom={3}
        paddingTop={3}
        paddingRight={3}
        margin={2}
        borderRadius={BorderRadius.XL}
        borderColor={BorderColor.borderMuted}
        className="signature-request-message__root"
        ref={setMessageRootRef}
      >
        <Text
          fontWeight={FontWeight.Bold}
          color={TextColor.textDefault}
          marginLeft={4}
        >
          {primaryType}
        </Text>
        <SignatureRequestData data={data.value} />
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
