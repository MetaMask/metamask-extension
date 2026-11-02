import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import { ScrollContainer } from './scroll-container';
import { ScrollToTop } from './scroll-to-top';

const mockStore = configureMockStore();

function renderScroll(accountGroupId: string) {
  return (
    <Provider
      store={mockStore({
        metamask: { selectedAccountGroup: accountGroupId },
      })}
    >
      <MemoryRouter
        initialEntries={['/']}
        future={{
          // Flag names are defined by React Router.
          // eslint-disable-next-line @typescript-eslint/naming-convention
          v7_startTransition: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollContainer
          data-testid="scroller"
          style={{ height: 100, overflow: 'auto' }}
        >
          <ScrollToTop />
          <div style={{ height: 1000 }} />
        </ScrollContainer>
      </MemoryRouter>
    </Provider>
  );
}

describe('ScrollToTop', () => {
  it('resets scroll when the selected account changes without a route change', () => {
    const { getByTestId, rerender } = render(renderScroll('entropy:wallet/0'));

    const scroller = getByTestId('scroller');
    scroller.scrollTop = 240;
    expect(scroller.scrollTop).toBe(240);

    rerender(renderScroll('entropy:wallet/1'));

    expect(scroller.scrollTop).toBe(0);
  });
});
