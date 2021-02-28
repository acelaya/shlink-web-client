declare module 'event-source-polyfill' {
  declare class EventSourcePolyfill {
    public onmessage?: ({ data }: { data: string }) => void;
    public onerror?: ({ status }: { status: number }) => void;
    public close: Function;
    public constructor(hubUrl: URL, options?: any);
  }
}

declare module 'csvjson' {
  export declare class CsvJson {
    public toObject<T>(content: string): T[];
    public toCSV<T>(data: T[], options: { headers: string }): string;
  }
}

declare module '*.png'
