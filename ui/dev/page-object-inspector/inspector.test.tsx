import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PageObjectInspector } from './inspector';
import { writeInspectorSettings } from './mode';
import {
  CONFLICT_ATTRIBUTE,
  OWNER_ATTRIBUTE,
  SELECTOR_ID_ATTRIBUTE,
  type PageObjectIndex,
  type Selector,
} from './types';

function selector(partial: Partial<Selector> & { id: string }): Selector {
  return {
    kind: 'testId',
    propertyName: 'sendButton',
    line: 12,
    isDynamic: false,
    value: 'eth-overview-send',
    ...partial,
  };
}

function stubPathname(pathname: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname },
  });
}

function moveMouse(id: string, clientX: number, clientY: number) {
  act(() => {
    fireEvent.mouseMove(document.getElementById(id) as HTMLElement, {
      clientX,
      clientY,
    });
  });
}

const index: PageObjectIndex = {
  pageObjects: [
    {
      className: 'HomePage',
      relativePath: 'pages/home/homepage.ts',
      extendsClass: null,
      selectors: [
        selector({ id: 'HomePage.sendButton' }),
        selector({
          id: 'HomePage.legacy',
          kind: 'css',
          value: '.mm-box',
          propertyName: 'legacy',
        }),
      ],
    },
  ],
};

describe('PageObjectInspector', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    jest.useFakeTimers();
    stubPathname('/notification.html');
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders nothing until a view is turned on', () => {
    const { container } = render(<PageObjectInspector index={index} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the outline empty tooltip in popup mode', () => {
    writeInspectorSettings({ hover: false, outline: true });
    render(<PageObjectInspector index={index} />);

    expect(
      screen.getByText(
        'Each owned element is tinted in its owner\u2019s colour.',
      ),
    ).toBeInTheDocument();
  });

  it('describes the hovered owner in the popup tooltip', () => {
    writeInspectorSettings({ hover: true, outline: false });
    document.body.innerHTML = `
      <button id="send" ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.sendButton"></button>
    `;

    render(<PageObjectInspector index={index} />);

    moveMouse('send', 20, 20);

    expect(screen.getByText('HomePage')).toBeInTheDocument();
    expect(screen.getByText('.sendButton')).toBeInTheDocument();
    expect(screen.getByText('pages/home/homepage.ts:12')).toBeInTheDocument();
  });

  it('pins the hovered element after dwelling', () => {
    writeInspectorSettings({ hover: true, outline: false });
    document.body.innerHTML = `
      <button id="send" ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.sendButton"></button>
    `;
    stubPathname('/home.html');
    render(<PageObjectInspector index={index} />);

    moveMouse('send', 40, 40);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /pin/iu }));
    });
    expect(screen.getByText('Pinned (1/5)')).toBeInTheDocument();
    expect(screen.getAllByText('HomePage').length).toBeGreaterThan(0);
  });

  it('clears the hover target when the pointer leaves owned elements', () => {
    writeInspectorSettings({ hover: true, outline: false });
    document.body.innerHTML = `
      <button id="send" ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.sendButton"></button>
      <div id="empty">empty</div>
    `;

    render(<PageObjectInspector index={index} />);

    moveMouse('send', 10, 10);
    expect(screen.getByText('HomePage')).toBeInTheDocument();

    moveMouse('empty', 80, 80);
    expect(
      screen.getByText(
        'Hover an element. Nothing here means no page object covers it.',
      ),
    ).toBeInTheDocument();
  });

  it('shows conflicting owners in the tooltip', () => {
    writeInspectorSettings({ hover: true, outline: false });
    document.body.innerHTML = `
      <button id="send" ${OWNER_ATTRIBUTE}="HomePage" ${SELECTOR_ID_ATTRIBUTE}="HomePage.sendButton" ${CONFLICT_ATTRIBUTE}="HomePage,SendPage"></button>
    `;

    render(<PageObjectInspector index={index} />);

    moveMouse('send', 15, 15);

    expect(screen.getByText(/also claimed by\s+SendPage/u)).toBeInTheDocument();
  });
});
