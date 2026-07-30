export type SidepanelOpenerOptions = {
  isSidepanelPreferred: () => boolean;
};

export type PendingOpen = {
  resolve: (opened: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
};
