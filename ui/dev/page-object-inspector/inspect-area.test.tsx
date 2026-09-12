import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { InspectArea } from './inspect-area';
import {
  CONFLICT_ATTRIBUTE,
  OWNER_ATTRIBUTE,
  SELECTOR_ID_ATTRIBUTE,
} from './types';
import type { PinnedElement, Selector } from './types';

function selector(partial: Partial<Selector> & { id: string }): Selector {
  return {
    kind: 'testId',
    propertyName: 'el',
    line: 10,
    isDynamic: false,
    value: 'home-btn',
    ...partial,
  };
}

function pin(
  partial: Partial<PinnedElement> & { selector: Selector },
): PinnedElement {
  return {
    ownerClassName: 'HomePage',
    relativePath: 'pages/home/homepage.ts',
    conflictingClassNames: [],
    isUncovered: false,
    ...partial,
  };
}

describe('InspectArea', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the empty inspect and pinned states', () => {
    render(
      <InspectArea
        target={null}
        pinnedElements={[]}
        result={null}
        onUnpin={jest.fn()}
        onHighlight={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        'Hover an element to inspect its page object ownership.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Pinned (0/5)')).toBeInTheDocument();
    expect(
      screen.getByText('Hover 0.5s then click Pin to save element info here.'),
    ).toBeInTheDocument();
  });

  it('describes the hovered target, including ancestor and conflict details', () => {
    render(
      <InspectArea
        target={{
          ownerClassName: 'HomePage',
          relativePath: 'pages/home/homepage.ts',
          selector: selector({
            id: 'HomePage.sendButton',
            propertyName: 'sendButton',
            kind: 'xpath',
            value: '//button',
          }),
          conflictingClassNames: ['HomePage', 'NetworkManager'],
          isAncestorFallback: true,
        }}
        pinnedElements={[]}
        result={null}
        onUnpin={jest.fn()}
        onHighlight={jest.fn()}
      />,
    );

    expect(screen.getByText('HomePage')).toBeInTheDocument();
    expect(screen.getByText('.sendButton')).toBeInTheDocument();
    expect(screen.getByText('(nearest ancestor)')).toBeInTheDocument();
    expect(
      screen.getByText(/Also claimed by:\s*NetworkManager/u),
    ).toBeInTheDocument();
    expect(
      screen.getByText('TODO - Migrate to data-testid'),
    ).toBeInTheDocument();
  });

  it('shows a testId badge for a good locator', () => {
    render(
      <InspectArea
        target={{
          ownerClassName: 'HomePage',
          relativePath: 'pages/home/homepage.ts',
          selector: selector({ id: 'HomePage.send', propertyName: 'send' }),
          conflictingClassNames: [],
          isAncestorFallback: false,
        }}
        pinnedElements={[]}
        result={null}
        onUnpin={jest.fn()}
        onHighlight={jest.fn()}
      />,
    );

    expect(screen.getByText('testId')).toBeInTheDocument();
  });

  it('renders uncovered, conflicting, and ancestor pinned rows', () => {
    const onUnpin = jest.fn();
    const onHighlight = jest.fn();

    render(
      <InspectArea
        target={null}
        pinnedElements={[
          pin({
            selector: selector({ id: 'uncovered' }),
            isUncovered: true,
            uncoveredTestId: 'mystery',
          }),
          pin({
            ownerClassName: 'SendPage',
            selector: selector({
              id: 'SendPage.continue',
              propertyName: 'continue',
              kind: 'xpath',
              value: '//button',
            }),
            conflictingClassNames: ['SendPage', 'HomePage'],
            isAncestorFallback: true,
          }),
        ]}
        result={null}
        onUnpin={onUnpin}
        onHighlight={onHighlight}
      />,
    );

    expect(
      screen.getByText('No page object covers this element.'),
    ).toBeInTheDocument();
    expect(screen.getByText('data-testid="mystery"')).toBeInTheDocument();
    expect(screen.getByText('SendPage')).toBeInTheDocument();
    expect(
      screen.getByText(/Also claimed by:\s*HomePage/u),
    ).toBeInTheDocument();

    fireEvent.mouseEnter(
      screen.getByText('SendPage').closest('div') as HTMLElement,
    );
    expect(onHighlight).toHaveBeenCalledWith('SendPage.continue', 'cyan');

    fireEvent.click(screen.getAllByTitle('Unpin')[0]);
    expect(onUnpin).toHaveBeenCalledWith(0);
  });

  it('opens the owned and conflicting lists from the tab strip', () => {
    const onHighlight = jest.fn();
    document.body.innerHTML = `
      <button ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.send" data-testid="eth-overview-send"></button>
      <button ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.send" data-testid="eth-overview-send"></button>
      <div ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.legacy"></div>
      <span ${OWNER_ATTRIBUTE}="SendPage" ${SELECTOR_ID_ATTRIBUTE}="SendPage.continue" ${CONFLICT_ATTRIBUTE}="SendPage,HomePage" data-testid="continue"></span>
    `;

    render(
      <InspectArea
        target={null}
        pinnedElements={[]}
        result={{ stamped: 3, conflicts: 1, failed: 0, unsupported: 0 }}
        onUnpin={jest.fn()}
        onHighlight={onHighlight}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /4 owned/u }));
    expect(screen.getByText('Owned Selectors (4)')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(
      screen.getByText('TODO - Migrate to data-testid'),
    ).toBeInTheDocument();

    fireEvent.mouseEnter(
      screen.getByText('HomePage.send').parentElement as HTMLElement,
    );
    expect(onHighlight).toHaveBeenCalledWith('HomePage.send', 'cyan');
    fireEvent.mouseLeave(
      screen.getByText('HomePage.send').parentElement as HTMLElement,
    );
    expect(onHighlight).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: /1 conflicting/u }));
    expect(screen.getByText('Conflicting Selectors (1)')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Multiple page objects claim the same element. Only one should own it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('SendPage')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /1 conflicting/u }));
    fireEvent.click(screen.getByRole('button', { name: /4 owned/u }));
    expect(screen.getByText('Owned Selectors (4)')).toBeInTheDocument();
  });
});
