import {
	Editor,
	FileSystemAdapter,
	loadPdfJs,
	MarkdownView,
	Plugin,
	TFile,
	Vault,
	Notice,
} from "obsidian";


// Local modules
import { loadPDFFile } from "src/extractHighlight";
import { saveDataToFile } from "src/saveToFile";
import {
	PDFAnnotationPluginSetting,
	PDFAnnotationPluginSettingTab,
} from "src/settings";
import { IIndexable, PDFFile } from "src/types";

import * as fs from "fs";
import { Formatter } from "./formatting";

export default class PDFAnnotationPlugin extends Plugin {
	public settings: PDFAnnotationPluginSetting;
    public formatter: Formatter;

	sort(grandtotal) {
		const settings = this.settings;

		if (settings.sortByTopic && settings.useStructuringHeadlines) {
			grandtotal.forEach((anno) => {
				const lines = anno.body.split(/\r\n|\n\r|\n|\r/); // split by:     \r\n  \n\r  \n  or  \r
				anno.topic = lines[0]; // First line of contents
				anno.body = lines.slice(1).join("\r\n");
			});
		}

		grandtotal.sort(function (a1, a2) {
			if (settings.sortByTopic) {
				// sort by topic
				if (a1.topic > a2.topic) return 1;
				if (a1.topic < a2.topic) return -1;
			}

			if (settings.useFolderNames) {
				// then sort by folder
				if (a1.folder > a2.folder) return 1;
				if (a1.folder < a2.folder) return -1;
			}

			// then sort by file.name
			if (a1.file.name > a2.file.name) return 1;
			if (a1.file.name < a2.file.name) return -1;

			// then sort by page
			if (a1.pageNumber > a2.pageNumber) return 1;
			if (a1.pageNumber < a2.pageNumber) return -1;

			// they are on the same, page, sort (descending) by minY
			// if quadPoints are undefined, use minY from the rect-angle
			if (a1.rect[1] > a2.rect[1]) return -1;
			if (a1.rect[1] < a2.rect[1]) return 1;
			return 0;
		});
	}

	// Function when called from a PDF file
	async loadSinglePDFFile(file: TFile) {
		const pdfjsLib = await loadPdfJs();
		const containingFolder = file.parent.name;
		const grandtotal = []; // array that will contain all fetched Annotations
		const desiredAnnotations =
			this.settings.parsedSettings.desiredAnnotations;
		const exportPath = this.settings.exportPath;
		console.log("loading from file ", file);
		const content = await this.app.vault.readBinary(file);
		const pages = await loadPDFFile(
			PDFFile.convertTFileToPDFFile(file, content),
			this.settings.page_min,
			this.settings.page_max,
			pdfjsLib,
			containingFolder,
			grandtotal,
			desiredAnnotations
		);
		this.sort(grandtotal);

		// Get file name/path
		let filePath = file.path.replace(".pdf", "");
		if (exportPath != "") {
			// Export in the export path
			filePath = exportPath + file.name.replace(".pdf", "");
		}

		// Add page number in file name in case part of the PDF is loaded
		if (pages[0] != 0) {
			// Only part of the PDF is loaded
			filePath += `, p.${pages[0]}-${pages[1]}`;
		}

		// First file: detailed & condensed versions
		// File name
		const l_fileName_1 = filePath + ".md";
		// Generate annotations
		const finalMarkdown = this.formatter.format(
			grandtotal,
			true,
			true,
			false
		);
		// Save annotations in file
		await saveDataToFile(l_fileName_1, finalMarkdown);
		// Open file
		await this.app.workspace.openLinkText(l_fileName_1, "", true);
	}

	async loadSinglePDFFileClipboard(clipText: string) {
		const { pages, grandtotal } =
			await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(
				clipText
			);
		this.sort(grandtotal);

		// Get input file name
		// Find the last occurrence of "/" or "\"
		const lastSlashIndex_1 = clipText.lastIndexOf("/");
		const lastSlashIndex_2 = clipText.lastIndexOf("\\");
		let lastSlashIndex = Math.max(lastSlashIndex_1, lastSlashIndex_2);
		// Extract the part after the last "/" or "\"
		let fileName = clipText.substring(lastSlashIndex + 1);
		// Remove all extra double quotes
		fileName = fileName.replace(/"/g, "");
		if (fileName.endsWith(".pdf")) {
			// Remove the extension in name
			fileName = fileName.slice(0, -4);
		}

		// Get output file path
		let filePath = "";
		const exportPath = this.settings.exportPath;
		const file = this.app.workspace.getActiveFile();

		if (exportPath != "") {
			// Export in the export path
			filePath = exportPath;
		} else if (file != null) {
			// Get the current's file path
			filePath = file.path;
			// Remove file name in the path
			// Find the last occurrence of "/"
			lastSlashIndex = filePath.lastIndexOf("/");
			// Remove the part after the last "/"
			if (lastSlashIndex !== -1) {
				filePath = filePath.substring(0, lastSlashIndex + 1);
			}
		}
		// else: no file opened: the file will be created in the vaulter's root

		// Set file pah/name
		filePath += fileName;

		// Add page number in file name in case part of the PDF is loaded
		if (pages[0] != 0) {
			// Only part of the PDF is loaded
			filePath += `, p ${pages[0]}-${pages[1]}`;
		}

		// First file: detailed & condensed versions
		// File name
		const l_fileName_1 = filePath + ".md";
		// Generate annotations
		const finalMarkdown = this.formatter.format(
			grandtotal,
			true,
			true,
			false
		);
		// Save annotations in file
		await saveDataToFile(l_fileName_1, finalMarkdown);
		// Open file
		await this.app.workspace.openLinkText(l_fileName_1, "", true);
	}

	async loadAnnotationsFromSinglePDFFileFromClipboardPath(
		filePathFromClipboard: string
	) {
		const grandtotal = []; // array that will contain all fetched Annotations
		let pages = [];
		try {
			const filePathWithoutQuotes = filePathFromClipboard.replace(
				/"/g,
				""
			);
			const stats = fs.statSync(filePathWithoutQuotes);
			if (stats.isFile()) {
				const pdfjsLib = await loadPdfJs();
				const binaryContent = await FileSystemAdapter.readLocalFile(
					filePathWithoutQuotes
				);
				const filePathWithSlashs: string =
					filePathWithoutQuotes.replace(/\\/g, "/");
				const filePathSplits: string[] = filePathWithSlashs.split("/");
				const fileName = filePathSplits.last() || "UNDEFINED";
				const extension = fileName.split(".").last() || "pdf";
				const encodedFilePath = encodeURI(
					"file://" + filePathWithoutQuotes
				);
				const file: PDFFile = new PDFFile(
					fileName,
					binaryContent,
					extension,
					encodedFilePath
				);
				const containingFolder = filePathWithSlashs.slice(
					0,
					filePathWithSlashs.lastIndexOf("/")
				);
				const desiredAnnotations =
					this.settings.parsedSettings.desiredAnnotations;
				pages = await loadPDFFile(
					file,
					this.settings.page_min,
					this.settings.page_max,
					pdfjsLib,
					containingFolder,
					grandtotal,
					desiredAnnotations
				);
			} else {
				console.log("Data in clipboard is no file.");
			}
		} catch (error) {
			console.log("Data in clipboard could not be read as filepath.");
			console.error(error);
		}
		return { pages, grandtotal };
	}

	// Function when plugin is loaded
	async onload() {
		this.loadSettings();
		this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));
        this.formatter = new Formatter(this.settings);

		// Command when called from a PDF file
		this.addCommand({
			id: "extract-annotations-single",
			name: "Extract PDF Annotations: On single PDF file",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file != null && file.extension === "pdf") {
					if (!checking) {
						// load file if (not only checking) && conditions are valid
						this.loadSinglePDFFile(file);
					}
					return true;
				} else {
					return false;
				}
			},
		});

		// Command when the PDF path is in the clipboard
		this.addCommand({
			id: "extract-annotations-single-from-clipboard-path",
			name: "Extract PDF Annotations: On single file from path in clipboard 📋",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				// The following is executed when calling from a .md file
				let clipText = "";
				try {
					clipText = await navigator.clipboard.readText();
				} catch (error) {
					console.error(
						"Extract PDF: Failed to read clipboard:",
						error
					);
				}
				try {
					if (clipText != "") {
						// Check that the clipboard indeed contains a pdf file
						//  => Do not check in case of "extension masked" option in File explorer
						// const extIndex = clipText.lastIndexOf(".");
						// const extName = clipText.substring(extIndex + 1);
						// if(extName.toLowerCase() === '.pdf') {
						//  const {pages, grandtotal} = await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(clipText)
						//  this.sort(grandtotal)
						//  editor.replaceSelection(this.format(grandtotal, false, false, true, true, false))
						// }
						// else {
						//  console.log("Extract PDF: Not a pdf file in the clipboard");
						// }
						// const {pages, grandtotal} = await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(clipText)
						// this.sort(grandtotal)
						// editor.replaceSelection(this.format(grandtotal, false, false, true, true, false))

						this.loadSinglePDFFileClipboard(clipText);
					}
				} catch (error) {
					console.error(
						"Extract PDF: Failed to process the PDF:",
						error
					);
				}
			},
		});

		// Command when called from a md file:
		// Annotation as detailed & condensed formats
		this.addCommand({
			id: "extract-annotations",
			name: "Extract PDF Annotations. From .md file",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const file = this.app.workspace.getActiveFile();
				if (file == null) return;
				const folder = file.parent;
				const grandtotal = []; // array that will contain all fetched Annotations

				const pdfjsLib = await loadPdfJs();
				// editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

				const promises = []; // when all Promises will be resolved.
				const desiredAnnotations =
					this.settings.parsedSettings.desiredAnnotations;

				Vault.recurseChildren(folder, async (file) => {
					// visit all Childern of parent folder of current active File
					if (file instanceof TFile) {
						if (file.extension === "pdf") {
							promises.push(
								this.app.vault
									.readBinary(file)
									.then((content) =>
										loadPDFFile(
											PDFFile.convertTFileToPDFFile(
												file,
												content
											),
											this.settings.page_min,
											this.settings.page_max,
											pdfjsLib,
											file.parent.name,
											grandtotal,
											desiredAnnotations
										)
									)
							);
						}
					}
				});

				await Promise.all(promises);
				this.sort(grandtotal);
				editor.replaceSelection(
					this.formatter.format(grandtotal, true, true, false)
				);
			},
		});
	}

	// Load settings from settings pane
	loadSettings() {
		this.settings = new PDFAnnotationPluginSetting();
		(async () => {
			const loadedSettings = await this.loadData();
			if (loadedSettings) {
				const toLoad = [
					"useStructuringHeadlines",
					"useFolderNames",
					"sortByTopic",
					"exportPath",
					"desiredAnnotations",
					"noteTemplateExternalPDFs",
					"noteTemplateInternalPDFs",
					"highlightTemplateExternalPDFs",
					"highlightTemplateInternalPDFs",
					"page_min",
					"page_max",
					"level1RGB",
					"level2RGB",
					"level3RGB",
					"summryRGB",
					"imprttRGB",
					"hueTol",
					"LumiTol",
					"lvl1_format",
					"lvl2_format",
					"lvl3_format",
					"sumr_format",
					"impt_format",
					"note_format",
					"note_preamb",
					"lvl1_icon",
					"lvl2_icon",
					"lvl3_icon",
					"sumr_icon",
					"impt_icon",
					"ext_lvl1_icon",
					"ext_lvl2_icon",
					"ext_lvl3_icon",
					"ext_sumr_icon",
					"ext_impt_icon",
					"unkn_icon",
					"begin_prb",
					"pdf_f_prb",
					"perso_prb",
					"conds_prb",
					"detal_prb",
					"no_an_prb",
					"ext_fl_tog",
					"ext_fl_suf",
					"ext_es_tog",
					"ext_es_suf",
					"lnk_tog",
					"lnk_cmd",
				];
				toLoad.forEach((setting) => {
					if (setting in loadedSettings) {
						(this.settings as IIndexable)[setting] =
							loadedSettings[setting];
					}
				});
				this.settings.parsedSettings = {
					desiredAnnotations:
						this.settings.parseCommaSeparatedStringToArray(
							this.settings.desiredAnnotations
						),
				};
			}
		})();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	onunload() {}

	async saveHighlightsToFileAndOpenIt(filePath: string, mdString: string) {
		const fileExists = await this.app.vault.adapter.exists(filePath);
		if (fileExists) {
			await this.appendHighlightsToFile(filePath, mdString);
		} else {
			try {
				await this.app.vault.create(filePath, mdString);
				await this.app.workspace.openLinkText(filePath, "", true);
			} catch (error) {
				console.error(error);
				new Notice(
					"Error creating note with annotations, because the notes export path is invalid. Please check the file path in the settings. Folders must exist."
				);
			}
		}
	}

	async appendHighlightsToFile(filePath: string, note: string) {
		let existingContent = await this.app.vault.adapter.read(filePath);
		if (existingContent.length > 0) {
			existingContent = existingContent + "\r\r";
		}
		await this.app.vault.adapter.write(filePath, existingContent + note);
	}
}
