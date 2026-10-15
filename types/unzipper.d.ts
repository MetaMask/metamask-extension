import type { Readable } from 'stream';

declare module 'unzipper' {
  /**
   * Represents a source from which ZIP data can be streamed.
   */
  export interface Source {
    stream(offset: number, length: number): Readable;
    size(): Promise<number>;
  }

  /**
   * Optional configuration for reading ZIP files.
   */
  export interface Options {
    tailSize?: number;
  }

  /**
   * Represents the central directory structure of the ZIP file.
   * This is part of unzipper’s internal API.
   */
  export interface CentralDirectory {
    files: unknown[];
    comment: string;
  }

  export namespace Open {
    /**
     * Opens a ZIP file from a custom source.
     *
     * @param source - A custom data source providing stream and size methods.
     * @param options - Optional configuration for reading ZIP files.
     * @returns A promise resolving to a CentralDirectory instance.
     */
    function custom(source: Source, options?: Options): Promise<CentralDirectory>;
  }
}
