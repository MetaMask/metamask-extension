import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {
  TextVariant,
  OverflowWrap,
  TextColor,
  Display,
} from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import SnapLinkWarning from '../snap-link-warning';
import useSnapNavigation from '../../../../hooks/snaps/useSnapNavigation';

const Paragraph = (props) => (
  <Text
    {...props}
    variant={TextVariant.bodyMd}
    className="snap-ui-markdown__text"
    data-testid="snap-ui-markdown-text"
    overflowWrap={OverflowWrap.Anywhere}
    color={TextColor.inherit}
  />
);

const Link = ({ onClick, children, isMetaMaskUrl, ...rest }) => {
  return (
    <ButtonLink
      {...rest}
      as="a"
      onClick={onClick}
      externalLink={!isMetaMaskUrl}
      size={ButtonLinkSize.Inherit}
      display={Display.Inline}
      className="snap-ui-markdown__link"
    >
      {children}
      {!isMetaMaskUrl && (
        <Icon name={IconName.Export} size={IconSize.Inherit} marginLeft={1} />
      )}
    </ButtonLink>
  );
};

const isMetaMaskUrl = (href) => href.startsWith('metamask:');

export const SnapUIMarkdown = ({ children, markdown }) => {
  const [redirectUrl, setRedirectUrl] = useState(undefined);
  const { navigate } = useSnapNavigation();

  if (markdown === false) {
    return <Paragraph>{children}</Paragraph>;
  }

  const linkTransformer = (href) => {
    if (isMetaMaskUrl(href)) {
      return href;
    }
    return ReactMarkdown.uriTransformer(href);
  };

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
        transformLinkUri={linkTransformer}
        components={{
          p: Paragraph,
          a: ({ children: value, href }) => {
            return (
              <Link
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMetaMaskUrl(href)) {
                    navigate(href);
                  } else {
                    handleLinkClick(href);
                  }
                }}
                isMetaMaskUrl={isMetaMaskUrl(href)}
              >
                {value ?? href}
              </Link>
            );
          },
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
  isMetaMaskUrl: PropTypes.bool,
};
