import { TFile } from "obsidian";

export class PDFFile {
    /**
     * @public
     */
    extension: string;
    /**
     * @public
     */
    path: string;
    /**
     * @public
     */
    content: ArrayBuffer;
    /**
     * @public
     */
    name: string;

    constructor(name: string, binaryContent: ArrayBuffer, extension: string, path: string) {
        this.name = name;
        this.content = binaryContent;
        this.extension = extension;
        this.path = path;
    }

    public static convertTFileToPDFFile(tFile: TFile, binaryContent: ArrayBuffer): PDFFile {
        let pdfFile = new PDFFile(tFile.name, binaryContent, tFile.extension, tFile.path);
        return pdfFile
    }
}

export interface IIndexable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}
