export type BoxRect = {
  moduleId: string;
  top: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type BoxModel = {
  rect: BoxRect;
  dependencyBoxRects: BoxRect[];
  dependentBoxRects: BoxRect[];
};
