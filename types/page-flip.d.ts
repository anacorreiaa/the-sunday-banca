declare module 'page-flip' {
  export class PageFlip {
    constructor(el: HTMLElement, settings: Record<string, unknown>);
    loadFromHTML(items: NodeListOf<Element> | HTMLElement[]): void;
    on(event: string, cb: (e: { data: number }) => void): this;
    flipNext(corner?: string): void;
    flipPrev(corner?: string): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    destroy(): void;
  }
}
