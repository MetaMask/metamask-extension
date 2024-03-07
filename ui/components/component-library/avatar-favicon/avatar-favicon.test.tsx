/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { IconName } from '..';
import { AvatarFaviconSize } from './avatar-favicon.types';
import { AvatarFavicon } from '.';

describe('AvatarFavicon', () => {
  const args = {
    src: './images/eth_logo.svg',
    name: 'test',
  };

  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarFavicon name="test" data-testid="avatar-favicon" />,
    );
    expect(getByTestId('avatar-favicon')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render image of Avatar Favicon', () => {
    render(<AvatarFavicon data-testid="avatar-favicon" {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.src);
  });

  it('should render fallback image if no ImageSource is provided', () => {
    const { container } = render(
      <AvatarFavicon name="test" data-testid="avatar-favicon" />,
    );
    expect(container.getElementsByClassName('mm-icon')).toHaveLength(1);
  });

  it('should render fallback image with custom fallbackIconProps if no ImageSource is provided', () => {
    const container = (
      <AvatarFavicon
        name="test"
        data-testid="avatar-favicon"
        fallbackIconProps={{
          'data-testid': 'fallback-icon',
          name: IconName.Global,
        }}
      />
    );
    expect(container.props.fallbackIconProps['data-testid']).toStrictEqual(
      'fallback-icon',
    );
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <AvatarFavicon
          size={AvatarFaviconSize.Xs}
          data-testid={AvatarFaviconSize.Xs}
          {...args}
        />
        <AvatarFavicon
          size={AvatarFaviconSize.Sm}
          data-testid={AvatarFaviconSize.Sm}
          {...args}
        />
        <AvatarFavicon
          size={AvatarFaviconSize.Md}
          data-testid={AvatarFaviconSize.Md}
          {...args}
        />
        <AvatarFavicon
          size={AvatarFaviconSize.Lg}
          data-testid={AvatarFaviconSize.Lg}
          {...args}
        />
        <AvatarFavicon
          size={AvatarFaviconSize.Xl}
          data-testid={AvatarFaviconSize.Xl}
          {...args}
        />
      </>,
    );
    expect(getByTestId(AvatarFaviconSize.Xs)).toHaveClass(
      `mm-avatar-base--size-${AvatarFaviconSize.Xs}`,
    );
    expect(getByTestId(AvatarFaviconSize.Sm)).toHaveClass(
      `mm-avatar-base--size-${AvatarFaviconSize.Sm}`,
    );
    expect(getByTestId(AvatarFaviconSize.Md)).toHaveClass(
      `mm-avatar-base--size-${AvatarFaviconSize.Md}`,
    );
    expect(getByTestId(AvatarFaviconSize.Lg)).toHaveClass(
      `mm-avatar-base--size-${AvatarFaviconSize.Lg}`,
    );
    expect(getByTestId(AvatarFaviconSize.Xl)).toHaveClass(
      `mm-avatar-base--size-${AvatarFaviconSize.Xl}`,
    );
  });

  it('should render with custom classname', () => {
    const { getByTestId } = render(
      <AvatarFavicon
        className="mm-avatar-favicon--test"
        data-testid="classname"
        {...args}
      />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-avatar-favicon--test');
  });
  it('should forward a ref to the root html element', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<AvatarFavicon {...args} ref={ref} />);
    expect(ref.current).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(ref.current!.nodeName).toBe('DIV');
  });
});
