declare module 'pdfjs-dist' {
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getTextContent(): Promise<PDFTextContent>;
  }

  export interface PDFTextContent {
    items: Array<{ str: string }>;
  }

  export function getDocument(data: Uint8Array): PDFDocumentLoadingTask;

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
}

declare module 'pdfjs-dist/build/pdf' {
  export interface GlobalWorkerOptions {
    workerSrc: string;
  }
}
