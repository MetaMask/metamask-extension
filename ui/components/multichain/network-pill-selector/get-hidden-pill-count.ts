/**
 * How many trailing pills to hide so the rest fit on one row with the toggle.
 * Returns 0 when every pill fits without a toggle.
 *
 * @param widths - Width of each pill, in display order.
 * @param available - Width of the row.
 * @param gap - Gap between items.
 * @param toggleWidth - Width of the toggle, or 0 before it has been rendered.
 * @returns The number of trailing pills that do not fit.
 */
export const getHiddenPillCount = (
  widths: number[],
  available: number,
  gap: number,
  toggleWidth: number,
): number => {
  if (widths.length === 0) {
    return 0;
  }

  const rowWidth = (count: number) =>
    widths.slice(0, count).reduce((sum, width) => sum + width, 0) +
    gap * Math.max(count - 1, 0);

  if (rowWidth(widths.length) <= available) {
    return 0;
  }

  const reserve = toggleWidth > 0 ? toggleWidth + gap : 0;
  let visible = 0;
  for (let count = 1; count <= widths.length; count++) {
    if (rowWidth(count) + reserve > available) {
      break;
    }
    visible = count;
  }
  return Math.max(widths.length - visible, 1);
};
