export const openWindow = (url: string, target: string) => {
  window.open(url, target || '_blank', 'noopener');
};
