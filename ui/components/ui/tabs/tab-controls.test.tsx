import React, { useEffect, useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { AppLayoutProvider } from '../../../contexts/app-layout';
import { TabControls } from './tab-controls';
import { Tab } from './tab';
import { Tabs } from './tabs';

let controlMounts = 0;

const Controls = () => {
  useEffect(() => {
    controlMounts += 1;
  }, []);

  return <div data-testid="controls">filters</div>;
};

const TabRow = ({ isWideLayout }: { isWideLayout: boolean }) => (
  <AppLayoutProvider isWideLayout={isWideLayout}>
    <Tabs hasTabEndSlot activeTab="tokens" onTabClick={() => undefined}>
      <Tab tabKey="tokens" name="Tokens">
        <TabControls>
          <Controls />
        </TabControls>
        <div data-testid="token-list">tokens</div>
      </Tab>
      <Tab tabKey="nfts" name="NFTs">
        <TabControls>
          <div data-testid="nft-controls">nfts</div>
        </TabControls>
      </Tab>
    </Tabs>
  </AppLayoutProvider>
);

describe('TabControls', () => {
  beforeEach(() => {
    controlMounts = 0;
  });

  it('keeps the controls in the tab panel when the layout is narrow', () => {
    const { getByTestId } = render(<TabRow isWideLayout={false} />);

    expect(getByTestId('controls').closest('.tab-end-slot')).toBeNull();
    expect(getByTestId('token-list').closest('.tab-end-slot')).toBeNull();
  });

  it('moves the controls to the end of the tab row when the layout is wide', () => {
    const { getByTestId } = render(<TabRow isWideLayout />);

    expect(getByTestId('controls').closest('.tab-end-slot')).not.toBeNull();
    expect(getByTestId('token-list').closest('.tab-end-slot')).toBeNull();
  });

  it('keeps the same control bar mounted when the layout becomes wide', () => {
    const Harness = () => {
      const [isWideLayout, setIsWideLayout] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsWideLayout(true)}>
            widen
          </button>
          <TabRow isWideLayout={isWideLayout} />
        </>
      );
    };

    const { getByRole, getByTestId } = render(<Harness />);

    expect(controlMounts).toBe(1);

    fireEvent.click(getByRole('button', { name: 'widen' }));

    expect(controlMounts).toBe(1);
    expect(getByTestId('controls').closest('.tab-end-slot')).not.toBeNull();
  });
});
