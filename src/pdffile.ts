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

    public static convertTFileToPDFFile(tFile: TFile, binaryContent: ArrayBuffer): PDFFile {
        let pdfFile = new PDFFile;
        pdfFile.extension = tFile.extension
        pdfFile.path = tFile.path
        pdfFile.content = binaryContent
        return pdfFile
    }
}