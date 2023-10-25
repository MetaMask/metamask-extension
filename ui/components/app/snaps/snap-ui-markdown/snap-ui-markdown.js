import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {
  TextVariant,
  OverflowWrap,
} from '../../../../helpers/constants/design-system';
import { ButtonLink, IconName, Text } from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';

const Paragraph = (props) => (
  <Text
    {...props}
    variant={TextVariant.bodyMd}
    className="snap-ui-markdown__text"
    overflowWrap={OverflowWrap.BreakWord}
  />
);

const Link = ({ onClick, children, ...rest }) => (
  <ButtonLink
    {...rest}
    onClick={onClick}
    externalLink
    endIconName={IconName.Export}
    className="snap-ui-markdown__link"
  >
    {children}
  </ButtonLink>
);

export const SnapUIMarkdown = ({ children, markdown }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(undefined);

  if (markdown === false) {
    return <Paragraph>{children}</Paragraph>;
  }

  const handleLinkClick = (url) => {
    setRedirectUrl(url);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setRedirectUrl(undefined);
  };

  return (
    <>
      <SnapLinkWarning
        isOpen={isModalOpen}
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
