import React from 'react';
import { render } from '@testing-library/react';
import { IconName } from '../../../../component-library';
import { SiteCellConnectionListItem } from './site-cell-connection-list-item';

describe('SiteCellConnectionListItem', () => {
  it('renders correctly with required props', () => {
    const { container } = render(
      <SiteCellConnectionListItem
        title="Title"
        iconName={IconName.Wallet}
        connectedMessage="Connected Message"
        unconnectedMessage="Unconnected Message"
        isConnectFlow
        onClick={() => null}
        content={<div>Content</div>}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
