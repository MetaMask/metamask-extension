import React from 'react';
import { render } from '@testing-library/react';
import { NotificationDetail } from './notification-detail';

describe('NotificationDetail', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <NotificationDetail
        icon={<span>Icon</span>}
        primaryTextLeft={<span>Primary Text Left</span>}
        secondaryTextLeft={<span>Secondary Text Left</span>}
      />,
    );

    expect(getByText('Primary Text Left')).toBeInTheDocument();
    expect(getByText('Secondary Text Left')).toBeInTheDocument();
  });

  it('renders primaryTextRight and secondaryTextRight when provided', () => {
    const { getByText } = render(
      <NotificationDetail
        icon={<span>Icon</span>}
        primaryTextLeft={<span>Primary Text Left</span>}
        primaryTextRight={<span>Primary Text Right</span>}
        secondaryTextLeft={<span>Secondary Text Left</span>}
        secondaryTextRight={<span>Secondary Text Right</span>}
      />,
    );

    expect(getByText('Primary Text Right')).toBeInTheDocument();
    expect(getByText('Secondary Text Right')).toBeInTheDocument();
  });
});
