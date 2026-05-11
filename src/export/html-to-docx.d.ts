declare module 'html-to-docx' {
  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString: string | null,
    options?: Record<string, any>,
    footerHTMLString?: string | null,
  ): Promise<Buffer>;
  export = HTMLtoDOCX;
}
