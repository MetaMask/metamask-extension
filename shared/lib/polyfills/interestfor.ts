// Adapted from https://github.com/mfreed7/interestfor (BSD-3-Clause)

const attributeName = 'interestfor';
const interestEventName = 'interest';
const loseInterestEventName = 'loseinterest';
const interestDelayStartProp = '--interest-delay-start';
const interestDelayEndProp = '--interest-delay-end';
const interestDelayProp = '--interest-delay';
const dataField = '__interestForData';
const targetDataField = '__interestForTargetData';

const InterestState = {
  NoInterest: 'none',
  FullInterest: 'full',
} as const;

const Source = {
  Hover: 'hover',
  DeHover: 'dehover',
  Focus: 'focus',
  Blur: 'blur',
  Touch: 'touch',
} as const;

type InterestStateValue = (typeof InterestState)[keyof typeof InterestState];
type SourceValue = (typeof Source)[keyof typeof Source];

type InterestForElementData = {
  state: InterestStateValue;
  gainedTimer: ReturnType<typeof setTimeout> | null;
  lostTimer: ReturnType<typeof setTimeout> | null;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  anchorName: string | null;
  clearGainedTask: () => void;
  clearLostTask: () => void;
};

type InterestForTargetData = {
  invoker: Element;
  toggleListener?: (event: Event) => void;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    interestForPolyfillInstalled?: boolean;
    interestForUsePolyfillAlways?: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    InterestEvent?: typeof InterestEventPolyfill;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Element {
    [dataField]?: InterestForElementData;
    [targetDataField]?: InterestForTargetData | null;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Document {
    [dataField]?: {
      globalPropsStyle: HTMLStyleElement;
    };
  }
}

class InterestEventPolyfill extends Event {
  #source: Element | null | undefined;

  constructor(
    type: string,
    eventInit: EventInit & { source?: Element | null },
  ) {
    super(type, eventInit);
    const { source } = eventInit;
    if (
      source !== null &&
      source !== undefined &&
      !(source instanceof Element)
    ) {
      throw new TypeError('source must be an element');
    }
    this.#source = source;
  }

  get [Symbol.toStringTag]() {
    return 'InterestEvent';
  }

  get source() {
    const source = this.#source;
    if (!source) {
      return null;
    }

    const sourceRoot = getRootNode(source);
    if (sourceRoot !== getRootNode(this.target || document)) {
      return (sourceRoot as ShadowRoot).host ?? null;
    }

    return source;
  }
}

function getRootNode(node: Node | null | undefined): Node {
  if (node && typeof node.getRootNode === 'function') {
    return node.getRootNode();
  }
  if (node?.parentNode) {
    return getRootNode(node.parentNode);
  }
  return node ?? document;
}

function getInterestForTarget(el: Element) {
  const id = el.getAttribute(attributeName);
  return id ? document.getElementById(id) : null;
}

function getInterestInvoker(target: Element) {
  const invoker = target[targetDataField]?.invoker ?? null;
  return invoker && invoker[dataField]?.state !== InterestState.NoInterest
    ? invoker
    : null;
}

function parseTimeValue(val: string) {
  const normalized = val.trim();
  const secondsMatch = normalized.match(/^([\d.]+)s$/u);
  if (secondsMatch) {
    return parseFloat(secondsMatch[1]);
  }

  const millisecondsMatch = normalized.match(/^([\d.]+)ms$/u);
  if (millisecondsMatch) {
    return parseFloat(millisecondsMatch[1]) / 1000;
  }

  return parseFloat(normalized) || 0;
}

function getDelaySeconds(el: Element, prop: string) {
  const style = getComputedStyle(el);
  const longhandValue = style.getPropertyValue(prop).trim();

  if (longhandValue.toLowerCase() !== 'normal') {
    return parseTimeValue(longhandValue);
  }

  const shorthand = style.getPropertyValue(interestDelayProp).trim();
  if (shorthand && shorthand.toLowerCase() !== 'normal') {
    const parts = shorthand.split(/\s+/u).filter((part) => part.length > 0);
    if (parts.length > 0) {
      const firstValue = parts[0];
      const secondValue = parts.length > 1 ? parts[1] : firstValue;
      const valueFromShorthand =
        prop === interestDelayStartProp ? firstValue : secondValue;

      if (valueFromShorthand.toLowerCase() !== 'normal') {
        return parseTimeValue(valueFromShorthand);
      }
    }
  }

  return prop === interestDelayStartProp ? 0.5 : 0.25;
}

function initializeDataField(el: Element) {
  if (el[dataField]) {
    return;
  }

  el[dataField] = {
    state: InterestState.NoInterest,
    gainedTimer: null,
    lostTimer: null,
    longPressTimer: null,
    anchorName: null,
    clearGainedTask() {
      if (this.gainedTimer) {
        clearTimeout(this.gainedTimer);
        this.gainedTimer = null;
      }
    },
    clearLostTask() {
      if (this.lostTimer) {
        clearTimeout(this.lostTimer);
        this.lostTimer = null;
      }
    },
  };

  const target = getInterestForTarget(el);
  if (target) {
    setupAccessibility(el, target);
  }
}

const focusableSelector = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isPlainHint(target: Element) {
  if (target.getAttribute('popover')?.toLowerCase() !== 'hint') {
    return false;
  }

  if (target.querySelector(focusableSelector)) {
    return false;
  }

  const structuralSelector =
    'h1,h2,h3,h4,h5,h6,ul,ol,li,table,nav,header,footer,main,aside,article,section,form,blockquote,details,summary,dialog';
  if (target.querySelector(structuralSelector)) {
    return false;
  }

  const elementsWithRoles = target.querySelectorAll('[role]');
  for (const element of elementsWithRoles) {
    const role = element.getAttribute('role')?.toLowerCase();
    if (role && !['presentation', 'none', 'generic', 'image'].includes(role)) {
      return false;
    }
  }

  return true;
}

function setupAccessibility(invoker: Element, target: Element) {
  if (isPlainHint(target)) {
    invoker.setAttribute('aria-describedby', target.id);
    return;
  }

  invoker.setAttribute('aria-details', target.id);
  invoker.setAttribute('aria-expanded', 'false');
  if (!target.hasAttribute('role')) {
    target.setAttribute('role', 'tooltip');
  }
}

function applyState(invoker: Element, newState: InterestStateValue) {
  const data = invoker[dataField];
  if (!data) {
    return false;
  }

  const target = getInterestForTarget(invoker);
  if (!target) {
    return false;
  }

  if (newState !== InterestState.FullInterest) {
    throw new Error('Invalid state');
  }

  if (data.state !== InterestState.NoInterest) {
    throw new Error('Invalid state');
  }

  const shouldContinue = target.dispatchEvent(
    new InterestEventPolyfill(interestEventName, { source: invoker }),
  );
  if (!shouldContinue) {
    return false;
  }

  try {
    target.showPopover();
  } catch {
    // Popover API may be unavailable in some environments.
  }

  data.state = InterestState.FullInterest;
  if (target[targetDataField]) {
    target[targetDataField].invoker = invoker;
  } else {
    target[targetDataField] = { invoker };
  }

  if (target.hasAttribute('popover')) {
    const toggleListener = (event: Event) => {
      onPopoverToggle(event, target);
    };
    target[targetDataField].toggleListener = toggleListener;
    target.addEventListener('toggle', toggleListener);
  }

  invoker.classList.add('interest-source');
  target.classList.add('interest-target');

  if (!isPlainHint(target)) {
    invoker.setAttribute('aria-expanded', 'true');
  }

  if (
    getComputedStyle(invoker).anchorName === 'none' &&
    getComputedStyle(target).positionAnchor === 'auto'
  ) {
    const anchorName = `--interest-anchor-${Math.random().toString(36).substring(2)}`;
    (invoker as HTMLElement).style.anchorName = anchorName;
    (target as HTMLElement).style.positionAnchor = anchorName;
    data.anchorName = anchorName;
  }

  return true;
}

function clearState(invoker: Element, force = false) {
  const data = invoker[dataField];
  if (!data) {
    return;
  }

  data.clearGainedTask();
  data.clearLostTask();

  if (data.state === InterestState.NoInterest) {
    return;
  }

  const target = getInterestForTarget(invoker);
  if (!target) {
    data.state = InterestState.NoInterest;
    return;
  }

  const shouldContinue = target.dispatchEvent(
    new InterestEventPolyfill(loseInterestEventName, { source: invoker }),
  );
  if (!force && !shouldContinue) {
    return;
  }

  try {
    target.hidePopover();
  } catch {
    // Popover API may be unavailable in some environments.
  }

  if (target[targetDataField]?.toggleListener) {
    target.removeEventListener(
      'toggle',
      target[targetDataField].toggleListener,
    );
  }
  target[targetDataField] = null;
  invoker.classList.remove('interest-source');
  target.classList.remove('interest-target');

  if (!isPlainHint(target)) {
    invoker.setAttribute('aria-expanded', 'false');
  }

  if (data.anchorName) {
    (invoker as HTMLElement).style.anchorName = '';
    (target as HTMLElement).style.positionAnchor = '';
    data.anchorName = null;
  }

  data.state = InterestState.NoInterest;
}

function onPopoverToggle(event: Event, popover: Element) {
  if ((event as Event & { newState?: string }).newState === 'closed') {
    const invoker = popover[targetDataField]?.invoker;
    if (invoker) {
      gainOrLoseInterest(invoker, popover, InterestState.NoInterest);
    }
  }
}

function gainOrLoseInterest(
  invoker: Element,
  target: Element,
  newState: InterestStateValue,
) {
  if (!invoker || !target) {
    return false;
  }

  if (
    !invoker.isConnected ||
    getInterestForTarget(invoker) !== target ||
    (newState === InterestState.NoInterest &&
      getInterestInvoker(target) !== invoker)
  ) {
    return false;
  }

  if (newState !== InterestState.NoInterest) {
    const existing = getInterestInvoker(target);
    if (existing) {
      if (existing === invoker) {
        existing[dataField]?.clearLostTask();
        return false;
      }

      if (!gainOrLoseInterest(existing, target, InterestState.NoInterest)) {
        return false;
      }

      if (!invoker.isConnected || getInterestForTarget(invoker) !== target) {
        return false;
      }
    }

    return applyState(invoker, newState);
  }

  clearState(invoker);
  return true;
}

function scheduleInterestGainedTask(
  invoker: Element,
  newState: InterestStateValue,
) {
  const delay = getDelaySeconds(invoker, interestDelayStartProp) * 1000;
  if (!Number.isFinite(delay) || delay < 0) {
    return;
  }

  const data = invoker[dataField];
  if (!data) {
    return;
  }

  data.clearGainedTask();
  data.gainedTimer = setTimeout(() => {
    gainOrLoseInterest(
      invoker,
      getInterestForTarget(invoker) as Element,
      newState,
    );
  }, delay);
}

function scheduleInterestLostTask(invoker: Element) {
  const delay = getDelaySeconds(invoker, interestDelayEndProp) * 1000;
  if (!Number.isFinite(delay) || delay < 0) {
    return;
  }

  const data = invoker[dataField];
  if (!data) {
    return;
  }

  data.clearLostTask();
  data.lostTimer = setTimeout(() => {
    gainOrLoseInterest(
      invoker,
      getInterestForTarget(invoker) as Element,
      InterestState.NoInterest,
    );
  }, delay);
}

function handleInterestHoverOrFocus(el: Element, source: SourceValue) {
  if (!el.isConnected) {
    return;
  }

  const target = getInterestForTarget(el);
  if (!target) {
    const containingTarget = el.closest('.interest-target');
    if (containingTarget) {
      const upstreamInvoker = getInterestInvoker(containingTarget);
      if (upstreamInvoker) {
        if (source === Source.Hover || source === Source.Focus) {
          upstreamInvoker[dataField]?.clearLostTask();
        } else if (source === Source.Blur || !el.matches(':hover')) {
          scheduleInterestLostTask(upstreamInvoker);
        }
      }
    }
    return;
  }

  initializeDataField(el);
  const data = el[dataField];
  if (!data) {
    return;
  }

  const upstreamInvoker = getInterestInvoker(el);

  if (source === Source.Hover || source === Source.Focus) {
    data.clearLostTask();
    upstreamInvoker?.[dataField]?.clearLostTask();
    scheduleInterestGainedTask(el, InterestState.FullInterest);
    return;
  }

  data.clearGainedTask();
  if (data.state !== InterestState.NoInterest) {
    scheduleInterestLostTask(el);
  }

  if (upstreamInvoker) {
    upstreamInvoker[dataField]?.clearGainedTask();
    if (source === Source.Blur || !el.matches(':hover')) {
      scheduleInterestLostTask(upstreamInvoker);
    }
  }
}

function registerCustomProperties() {
  const style = document.createElement('style');
  style.textContent = `@property ${interestDelayStartProp} {syntax: " <time> | normal"; inherits: false; initial-value: normal;}
@property ${interestDelayEndProp} {syntax: " <time> | normal"; inherits: false; initial-value: normal;}
@property ${interestDelayProp} {syntax: "[ <time> | normal ]{1,2}"; inherits: false; initial-value: normal;}`;
  document.head.appendChild(style);
  document[dataField] = { globalPropsStyle: style };
}

function addEventHandlers(invokersWithInterest: Set<Element>) {
  const handler = (event: Event, source: SourceValue) => {
    let el = event.target as Element | null;
    while (el) {
      handleInterestHoverOrFocus(el, source);
      el = el.parentElement;
    }
  };

  document.body.addEventListener('mouseover', (event) =>
    handler(event, Source.Hover),
  );
  document.body.addEventListener('mouseout', (event) =>
    handler(event, Source.DeHover),
  );
  document.body.addEventListener('focusin', (event) =>
    handler(event, Source.Focus),
  );
  document.body.addEventListener('focusout', (event) =>
    handler(event, Source.Blur),
  );
  document.body.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      invokersWithInterest.forEach((invoker) => {
        clearState(invoker, true);
      });
    }
  });

  const longPressTime = 500;
  document.body.addEventListener('touchstart', (event) => {
    const invoker = (event.target as Element | null)?.closest(
      'button[interestfor]',
    );
    if (!invoker) {
      return;
    }

    initializeDataField(invoker);
    const data = invoker[dataField];
    if (!data) {
      return;
    }

    data.longPressTimer = setTimeout(() => {
      gainOrLoseInterest(
        invoker,
        getInterestForTarget(invoker) as Element,
        InterestState.FullInterest,
      );
      data.longPressTimer = null;
    }, longPressTime);
  });

  const cancelLongPress = (event: Event) => {
    const invoker = (event.target as Element | null)?.closest(
      'button[interestfor]',
    );
    if (invoker?.[dataField]?.longPressTimer) {
      clearTimeout(invoker[dataField].longPressTimer);
      invoker[dataField].longPressTimer = null;
    }
  };

  document.body.addEventListener('touchend', cancelLongPress);
  document.body.addEventListener('touchmove', cancelLongPress);
}

export function installInterestForPolyfill() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (window.interestForPolyfillInstalled) {
    return;
  }
  window.interestForPolyfillInstalled = true;

  const nativeSupported = Object.prototype.hasOwnProperty.call(
    HTMLButtonElement.prototype,
    'interestForElement',
  );

  if (nativeSupported && !window.interestForUsePolyfillAlways) {
    return;
  }

  if (nativeSupported) {
    const cancel = (event: Event) => {
      if (event.isTrusted) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    document.body.addEventListener(interestEventName, cancel, {
      capture: true,
    });
    document.body.addEventListener(loseInterestEventName, cancel, {
      capture: true,
    });
  }

  if (!window.InterestEvent) {
    window.InterestEvent = InterestEventPolyfill;
  }

  const invokersWithInterest = new Set<Element>();

  let initialized = false;
  const init = () => {
    if (initialized || !document.body) {
      return;
    }
    initialized = true;
    registerCustomProperties();
    addEventHandlers(invokersWithInterest);
  };

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
  }
}
