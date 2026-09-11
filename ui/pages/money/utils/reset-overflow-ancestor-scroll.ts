/**
 * Money Home, Activity, and details share RootLayout's overflow container,
 * so scroll from the previous page would otherwise carry over.
 *
 * @param element - A node on the destination page.
 */
export function resetOverflowAncestorScroll(element: HTMLElement | null): void {
  let node = element;
  while (node) {
    node.scrollTop = 0;
    node = node.parentElement;
  }
}
