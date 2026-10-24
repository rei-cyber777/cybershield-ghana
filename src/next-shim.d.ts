declare module 'next/headers' {
  export interface CookieItem {
    name: string;
    value: string;
  }
  export interface CookieStore {
    getAll(): CookieItem[];
    set(name: string, value: string, options?: Record<string, unknown>): void;
  }
  export function cookies(): Promise<CookieStore>;
}

declare module 'next/server' {
  export interface NextCookies {
    getAll(): Array<{ name: string; value: string }>;
    set(name: string, value: string, options?: Record<string, unknown>): void;
  }
  export interface NextRequest {
    headers: Headers;
    cookies: NextCookies;
  }
  export class NextResponse {
    cookies: NextCookies;
    static next(init?: { request?: { headers?: Headers } | NextRequest }): NextResponse;
  }
}
