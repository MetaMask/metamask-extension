import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import classnames from 'classnames';
import { I18nContext } from '../../../../contexts/i18n';
import { getMetaMaskIdentities, getAccountName } from '../../../../selectors';
import Address from '../../transaction-decoding/components/decoding/address';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
  COLORS,
  FONT_WEIGHT,
  FLEX_DIRECTION,
} from '../../../../helpers/constants/design-system';

export default function SignatureRequestMessage({
  data,
  onMessageScrolled,
  setMessageRootRef,
  messageRootRef,
  messageIsScrollable,
}) {
  const t = useContext(I18nContext);
  const [messageIsScrolled, setMessageIsScrolled] = useState(false);
  const identities = useSelector(getMetaMaskIdentities);
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

  const renderNode = (renderData) => {
    return (
      <Box className="signature-request-message__node">
        {Object.entries(renderData).map(([label, value], i) => (
          <Box
            className={classnames('signature-request-message__node', {
              'signature-request-message__node-leaf':
                typeof value !== 'object' || value === null,
            })}
            key={i}
          >
            <Typography
              as="span"
              color={COLORS.TEXT_DEFAULT}
              marginLeft={4}
              fontWeight={
                typeof value === 'object'
                  ? FONT_WEIGHT.BOLD
                  : FONT_WEIGHT.NORMAL
              }
            >
              {label.charAt(0).toUpperCase() + label.slice(1)}:{' '}
            </Typography>
            {typeof value === 'object' && value !== null ? (
              renderNode(value)
            ) : (
              <Typography
                as="span"
                color={COLORS.TEXT_DEFAULT}
                marginLeft={4}
                className="signature-request-message__node__value"
              >
                {isValidHexAddress(value, {
                  mixedCaseUseChecksum: true,
                }) ? (
                  <Box
                    color={COLORS.INFO_DEFAULT}
                    className="signature-request-message__node__value__address"
                  >
                    <Address
                      addressOnly
                      checksummedRecipientAddress={toChecksumHexAddress(value)}
                      recipientName={getAccountName(identities, value)}
                    />
                  </Box>
                ) : (
                  `${value}`
                )}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  const renderScrollButton = () => {
    return (
      <Box
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        color={COLORS.ICON_DEFAULT}
        onClick={() => {
          setMessageIsScrolled(true);
          onMessageScrolled();
          messageRootRef?.scrollTo(0, messageRootRef?.scrollHeight);
        }}
        className="signature-request-message__scroll-button"
        data-testid="signature-request-scroll-button"
      >
        <i className="fa fa-arrow-down" title={t('scrollDown')} />
      </Box>
    );
  };

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      onScroll={debounce(setMessageIsScrolledAtBottom, 25)}
      className="signature-request-message"
    >
      {messageIsScrollable ? renderScrollButton() : null}
      <div className="signature-request-message__root" ref={setMessageRootRef}>
        <Box
          color={COLORS.TEXT_DEFAULT}
          marginLeft={4}
          className="signature-request-message__title"
        >
          {t('signatureRequest1')}
        </Box>
        {renderNode(data)}
      </div>
    </Box>
  );
}

SignatureRequestMessage.propTypes = {
  data: PropTypes.object.isRequired,
  onMessageScrolled: PropTypes.func,
  setMessageRootRef: PropTypes.func,
  messageRootRef: PropTypes.object,
  messageIsScrollable: PropTypes.bool,
};
