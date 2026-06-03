export type ThrottledOrigin = {
  rejections: number;
  lastRejection: number;
};

export type ThrottledOrigins = {
  [origin: string]: ThrottledOrigin;
};

export type ThrottledOriginsState = {
  throttledOrigins: ThrottledOrigins;
};
