declare module '@babel/code-frame' {
  type Location = {
    start: { line: number; column: number };
    end?: { line: number; column: number };
  };

  type CodeFrameOptions = {
    message?: string;
    highlightCode?: boolean;
    linesAbove?: number;
    linesBelow?: number;
    forceColor?: boolean;
  };

  export function codeFrameColumns(
    source: string,
    location: Location,
    options?: CodeFrameOptions,
  ): string;
}
