import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';
import { NotificationListSnapButton } from '../../../multichain/notification-list-snap-button/notification-list-snap-button';

const Paragraph = (props) => (
  <Text
    {...props}
    variant={TextVariant.bodyMd}
    className="snap-ui-markdown__text"
    overflowWrap={OverflowWrap.Anywhere}
    color={TextColor.textDefault}
    textVariant={TextVariant.bodyMd}
  />
);

export const SnapUIMarkdown = ({ children, markdown }) => {
  const [redirectUrl, setRedirectUrl] = useState(undefined);

  if (markdown === false) {
    return <Paragraph>{children}</Paragraph>;
  }

  const handleLinkClick = (url) => {
    setRedirectUrl(url);
  };

  const handleModalClose = () => {
    setRedirectUrl(undefined);
  };

  return (
    <>
      <SnapLinkWarning
        isOpen={Boolean(redirectUrl)}
        onClose={handleModalClose}
        url={redirectUrl}
      />
      <ReactMarkdown
        allowedElements={['p', 'strong', 'em', 'a']}
        components={{
          p: Paragraph,
          a: ({ children: value, href }) => (
            <NotificationListSnapButton
              onClick={() => handleLinkClick(href)}
              text={value ?? href}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </>
  );
};

SnapUIMarkdown.propTypes = {
  children: PropTypes.string,
  markdown: PropTypes.bool,
};
