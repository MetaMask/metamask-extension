/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { BadgeWrapper } from './badge-wrapper';
import {
  BadgeWrapperPosition,
  BadgeWrapperAnchorElementShape,
} from './badge-wrapper.types';

describe('BadgeWrapper', () => {
  it('should render correctly', () => {
    const { getByText, container } = render(
      <BadgeWrapper badge={<div data-testid="badge">badge</div>}>
        content
      </BadgeWrapper>,
    );
    expect(getByText('content')).toBeDefined();
    expect(getByText('badge')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render with additional className', () => {
    const { getByTestId } = render(
      <BadgeWrapper data-testid="badge-wrapper" className="test-class">
        content
      </BadgeWrapper>,
    );
    expect(getByTestId('badge-wrapper')).toHaveClass('test-class');
  });

  it('should render badge positions correctly', () => {
    const { getByTestId, getByText } = render(
      <>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-default' }}
        >
          content default
        </BadgeWrapper>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-top-right' }}
          position={BadgeWrapperPosition.topRight}
        >
          content top-right
        </BadgeWrapper>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-top-left' }}
          position={BadgeWrapperPosition.topLeft}
        >
          content top-left
        </BadgeWrapper>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-bottom-right' }}
          position={BadgeWrapperPosition.bottomRight}
        >
          content bottom-right
        </BadgeWrapper>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-bottom-left' }}
          position={BadgeWrapperPosition.bottomLeft}
        >
          content bottom-left
        </BadgeWrapper>
      </>,
    );
    expect(getByText('content default')).toBeDefined();
    expect(getByTestId('badge-default')).toHaveClass(
      'mm-badge-wrapper__badge-container--circular-top-right',
    );
    expect(getByText('content top-right')).toBeDefined();
    expect(getByTestId('badge-top-right')).toHaveClass(
      'mm-badge-wrapper__badge-container--circular-top-right',
    );
    expect(getByText('content top-left')).toBeDefined();
    expect(getByTestId('badge-top-left')).toHaveClass(
      'mm-badge-wrapper__badge-container--circular-top-left',
    );
    expect(getByText('content bottom-right')).toBeDefined();
    expect(getByTestId('badge-bottom-right')).toHaveClass(
      'mm-badge-wrapper__badge-container--circular-bottom-right',
    );
    expect(getByText('content bottom-left')).toBeDefined();
    expect(getByTestId('badge-bottom-left')).toHaveClass(
      'mm-badge-wrapper__badge-container--circular-bottom-left',
    );
  });

  it('should render the badge with custom position', () => {
    const { getByTestId, getByText } = render(
      <BadgeWrapper
        badge={<div>badge</div>}
        badgeContainerProps={{ 'data-testid': 'badge-custom' }}
        positionObj={{
          top: '-10px',
          right: '-10px',
        }}
      >
        content custom
      </BadgeWrapper>,
    );
    expect(getByText('content custom')).toBeDefined();
    expect(getByTestId('badge-custom')).not.toHaveClass(
      'mm-badge-wrapper__badge-container--circular-top-right',
    );
    expect(getByTestId('badge-custom')).toHaveStyle({
      top: '-10px',
      right: '-10px',
    });
  });

  it('should render badge anchor element shape correctly', () => {
    const { getByTestId, getByText } = render(
      <>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-circular' }}
        >
          content circular
        </BadgeWrapper>
        <BadgeWrapper
          badge={<div>badge</div>}
          badgeContainerProps={{ 'data-testid': 'badge-rectangular' }}
          anchorElementShape={BadgeWrapperAnchorElementShape.rectangular}
        >
          content rectangular
        </BadgeWrapper>
      </>,
    );
    expect(getByText('content circular')).toBeDefined();
    expect(getByTestId('badge-circular')).toHaveClass(
      'mm-badge-wrapper__badge-container--circular-top-right',
    );
    expect(getByText('content rectangular')).toBeDefined();
    expect(getByTestId('badge-rectangular')).toHaveClass(
      'mm-badge-wrapper__badge-container--rectangular-top-right',
    );
  });
});
