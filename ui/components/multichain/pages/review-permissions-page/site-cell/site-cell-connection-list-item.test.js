import React from 'react';
import { render } from '@testing-library/react';
import { SiteCellConnectionListItem } from './site-cell-connection-list-item';
import { IconName } from '../../../../component-library';

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
      />
    );
    expect(container).toMatchSnapshot();
  });
});
