/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { TagUrl } from './tag-url';

describe('TagUrl', () => {
  it('should render the label inside the TagUrl', () => {
    const { getByTestId, container } = render(
      <TagUrl data-testid="tag-url" label="https://app.uniswap.org" />,
    );
    expect(getByTestId('tag-url')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render the button if there is a actionButtonLabel inside the tag', () => {
    render(
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        actionButtonLabel="Permissions"
      />,
    );

    expect(screen.getByText('Permissions').closest('a')).toBeDefined();
  });

  it('should render correct Avatar in TagUrl', () => {
    render(
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        actionButtonLabel="Permissions"
        src="https://1inch.exchange/assets/favicon/favicon-32x32.png"
      />,
    );
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute(
      'src',
      'https://1inch.exchange/assets/favicon/favicon-32x32.png',
    );
  });

  it('should render lock icon if showLockIcon is true', () => {
    const { container } = render(
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        actionButtonLabel="Permissions"
        showLockIcon
      />,
    );

    expect(
      container.getElementsByClassName('mm-tag-url__lock-icon'),
    ).toHaveLength(1);
  });

  it('should render avatar with custom props', () => {
    const container = (
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        actionButtonLabel="Permissions"
        avatarFaviconProps={{
          'data-testid': 'fallback avatar',
          name: '',
        }}
      />
    );

    expect(container.props.avatarFaviconProps['data-testid']).toStrictEqual(
      'fallback avatar',
    );
  });

  it('should render Text inside Tag url with custom label props', () => {
    const container = (
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        actionButtonLabel="Permissions"
        labelProps={{
          className: 'tag-url label',
        }}
      />
    );

    expect(container.props.labelProps.className).toStrictEqual('tag-url label');
  });

  it('should render Button with custom label props', () => {
    const container = (
      <TagUrl
        data-testid="tag-url"
        label="https://app.uniswap.org"
        actionButtonLabel="Permissions"
        actionButtonProps={{
          className: 'tag-url button',
        }}
      />
    );

    expect(container.props.actionButtonProps.className).toStrictEqual(
      'tag-url button',
    );
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <TagUrl
        label="app.uniswap.org"
        data-testid="tag-url"
        className="test-class"
      />,
    );
    expect(getByTestId('tag-url')).toHaveClass('test-class');
  });
});
