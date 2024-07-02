export type HandlerWrapper = {
  methodNames: [string] | string[];
  hookNames: Record<string, boolean>;
};
