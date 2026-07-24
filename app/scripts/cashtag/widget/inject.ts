import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../../shared/constants/messages';
import { findCashtagAnchors, symbolFromCashtagAnchor } from '../lib/helpers';
import type { AssetData, InterestAnchor, InterestEvent } from '../lib/types';
import { injectPageStyles, loadCssText, removePageStyles } from '../lib/ui';
import { mountWidget } from './widget';

const widgetPageStyleAttr = 'data-mm-cashtag-widget-css';
const anchorNameProp = 'anchor-name';
const positionAnchorProp = 'position-anchor';
const activeAnchorVar = '--mm-cashtag-invoker';

type WidgetHandle = {
  shadowHost: HTMLElement;
  show: (data: AssetData) => void;
  stop: () => void;
};

export async function injectWidget() {
  await injectPageStyles(
    'scripts/cashtag/widget/page.css',
    widgetPageStyleAttr,
  );

  const css = await loadCssText('scripts/cashtag/widget/widget.css');
  const shadowHost = document.createElement('div');
  shadowHost.id = 'mm-cashtag-popover';
  shadowHost.setAttribute('popover', 'hint');
  shadowHost.popover = 'hint';
  shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);

  const shadow = shadowHost.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css.replaceAll(':root', ':host');
  const mountNode = document.createElement('div');
  shadow.append(style, mountNode);

  document.documentElement.appendChild(shadowHost);
  const widget = mountWidget(mountNode);

  return {
    shadowHost,
    show(data: AssetData) {
      widget.render({
        data,
        onSwap: () => {
          browser.runtime
            .sendMessage({
              type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
              body: { caipAssetId: data.caipAssetId },
            })
            .catch(() => undefined);
        },
        onDisable: () => {
          window.dispatchEvent(new CustomEvent('mm-cashtag-disable'));
          if (shadowHost.matches(':popover-open')) {
            shadowHost.hidePopover();
          }
        },
      });
    },
    stop() {
      widget.unmount();
      shadowHost.remove();
      removePageStyles(widgetPageStyleAttr);
    },
  } satisfies WidgetHandle;
}

export function bindWidgetTriggers(
  widget: WidgetHandle,
  assetsByTicker: Map<string, AssetData>,
) {
  const mounted = new Set<InterestAnchor>();
  const popoverId = widget.shadowHost.id;
  let lastSource: HTMLElement | null = null;

  const onInterest = (event: Event) => {
    const { source } = event as InterestEvent;
    if (!(source instanceof HTMLAnchorElement)) {
      return;
    }

    if (lastSource && lastSource !== source) {
      lastSource.style.removeProperty(anchorNameProp);
    }
    source.style.setProperty(anchorNameProp, activeAnchorVar);
    widget.shadowHost.style.setProperty(positionAnchorProp, activeAnchorVar);
    lastSource = source;

    const data = assetsByTicker.get(symbolFromCashtagAnchor(source));
    if (data) {
      widget.show(data);
    }
  };

  widget.shadowHost.addEventListener('interest', onInterest);

  const bind = (element: HTMLAnchorElement) => {
    const interestAnchor = element as InterestAnchor;
    if (mounted.has(interestAnchor)) {
      return;
    }
    interestAnchor.setAttribute('interestfor', popoverId);
    interestAnchor.interestForElement = widget.shadowHost;
    mounted.add(interestAnchor);
  };

  const scan = (root: ParentNode) => {
    for (const { element } of findCashtagAnchors(root, assetsByTicker)) {
      bind(element);
    }
  };

  const prune = () => {
    for (const invoker of mounted) {
      if (invoker.isConnected) {
        continue;
      }
      if (lastSource === invoker) {
        lastSource = null;
      }
      invoker.style.removeProperty(anchorNameProp);
      invoker.removeAttribute('interestfor');
      invoker.interestForElement = null;
      mounted.delete(invoker);
    }
  };

  scan(document);

  const observer = new MutationObserver((mutations) => {
    let removed = false;
    for (const mutation of mutations) {
      if (mutation.removedNodes.length) {
        removed = true;
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scan(node as Element);
        }
      }
    }
    if (removed) {
      prune();
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return {
    stop() {
      observer.disconnect();
      widget.shadowHost.removeEventListener('interest', onInterest);
      for (const invoker of mounted) {
        invoker.style.removeProperty(anchorNameProp);
        invoker.removeAttribute('interestfor');
        invoker.interestForElement = null;
      }
      mounted.clear();
      lastSource = null;
    },
  };
}
