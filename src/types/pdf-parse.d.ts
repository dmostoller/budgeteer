declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    [key: string]: unknown;
  }

  interface PDFMetadata {
    _metadata?: {
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: { pageIndex: number; pageNum: number }) => string;
    max?: number;
    version?: string;
  }

  function pdf(
    dataBuffer: Buffer | ArrayBuffer | Uint8Array,
    options?: PDFOptions,
  ): Promise<PDFData>;

  export = pdf;
}
