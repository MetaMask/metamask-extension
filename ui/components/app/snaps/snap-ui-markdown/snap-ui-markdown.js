import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Text,
} from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';

const Paragraph = (props) => (
  <Text
    {...props}
    variant={TextVariant.bodyMd}
    className="snap-ui-markdown__text"
    overflowWrap={OverflowWrap.Anywhere}
    color={TextColor.inherit}
  />
);

const Link = ({ onClick, children, ...rest }) => (
  <ButtonLink
    {...rest}
    onClick={onClick}
    externalLink
    size={ButtonLinkSize.Inherit}
    endIconName={IconName.Export}
    className="snap-ui-markdown__link"
  >
    {children}
  </ButtonLink>
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
            <Link onClick={() => handleLinkClick(href)}>{value ?? href}</Link>
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

Link.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
};
