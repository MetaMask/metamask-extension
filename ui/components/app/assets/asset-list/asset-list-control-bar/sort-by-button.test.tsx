import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../../../store/background-connection';
import { AssetControls } from './asset-controls';
import { SortByButton } from './sort-by-button';
import { createMockState } from './control-bar-test-utils';

type TooltipProps = {
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
};

jest.mock('../../../../ui/tooltip', () => {
  const MockTooltip = ({ children, disabled, title }: TooltipProps) => (
    <div data-testid="tooltip" data-disabled={disabled} data-title={title}>
      {children}
    </div>
  );

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: MockTooltip,
  };
});

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

const renderSortByButton = (state: ReturnType<typeof createMockState>) => {
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetControls>
      <SortByButton />
    </AssetControls>,
    store,
  );
};

describe('SortByButton', () => {
  beforeEach(() => {
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('names the trigger with its purpose', async () => {
    const { findByTestId } = renderSortByButton(createMockState());

    expect(await findByTestId('sort-by-popover-toggle')).toHaveAttribute(
      'aria-label',
      messages.sortBy.message,
    );
  });

  it('tracks expanded state while the sort popover is open', async () => {
    const { findByTestId } = renderSortByButton(createMockState());

    const sortByButton = await findByTestId('sort-by-popover-toggle');
    expect(sortByButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(sortByButton);
    // Popper writes its position on the next tick.
    await act(async () => {
      await Promise.resolve();
    });
    expect(sortByButton).toHaveAttribute('aria-expanded', 'true');
  });
});
