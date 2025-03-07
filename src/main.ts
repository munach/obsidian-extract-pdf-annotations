import {
	compile as compileTemplate,
	TemplateDelegate as Template,
} from "handlebars";
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
import { loadPDFFile } from "src/extractHighlight";
import {
	ANNOTS_TREATED_AS_HIGHLIGHTS,
	PDFAnnotationPluginSetting,
	PDFAnnotationPluginSettingTab,
} from "src/settings";
import { IIndexable, PDFFile } from "src/types";

import * as fs from "fs";
import { PDFAnnotationPluginFormatter } from "./formatter";

export default class PDFAnnotationPlugin extends Plugin {
	public settings: PDFAnnotationPluginSetting;
	public formatter: PDFAnnotationPluginFormatter;

	// Template compilation options
	private templateSettings = {
		noEscape: true,
	};

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

	async loadSinglePDFFile(pdfFile: TFile) {
		const pdfjsLib = await loadPdfJs();
		const containingFolder = pdfFile.parent.name;
		const grandtotal = []; // array that will contain all fetched Annotations
		const desiredAnnotations =
			this.settings.parsedSettings.desiredAnnotations;
		console.log("loading from file ", pdfFile);
		const content = await this.app.vault.readBinary(pdfFile);
		await loadPDFFile(
			PDFFile.convertTFileToPDFFile(pdfFile, content),
			pdfjsLib,
			containingFolder,
			grandtotal,
			desiredAnnotations
		);
		this.sort(grandtotal);

		// Check if one file per annotation should be created
		if (this.settings.oneNotePerAnnotation) {
			grandtotal.forEach((anno, index) => {
				const note = this.formatter.format([anno], false);
				const fileNameOfExportNote =
					this.getResolvedOneNotePerAnnotationExportName(pdfFile, index+1) + ".md";
				const filePathOfExportNote = this.getResolvedExportPath(pdfFile, fileNameOfExportNote);
				this.saveHighlightsToFileAndOpenIt(filePathOfExportNote, note);
			});
		} else {
			const finalMarkdown = this.formatter.format(grandtotal, false);
			const fileNameOfExportNote =
				this.getResolvedExportName(pdfFile) + ".md";
			const filePathOfExportNote = this.getResolvedExportPath(
				pdfFile,
				fileNameOfExportNote
			);
			await this.saveHighlightsToFileAndOpenIt(
				filePathOfExportNote,
				finalMarkdown
			);
		}
	}

	async loadAnnotationsFromSinglePDFFileFromClipboardPath(
		filePathFromClipboard: string
	) {
		const grandtotal = []; // array that will contain all fetched Annotations
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
				const fileName = filePathSplits.last();
				const extension = fileName.split(".").last();
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
				await loadPDFFile(
					file,
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
		return grandtotal;
	}

	async onload() {
		this.loadSettings();
		this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));

		this.formatter = new PDFAnnotationPluginFormatter(this.settings);

		this.addCommand({
			id: "extract-annotations-single",
			name: "Extract PDF Annotations on single file",
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

		this.addCommand({
			id: "extract-annotations-single-from-clipboard-path",
			name: "Extract PDF Annotations on single file from path in clipboard",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const clipText = await navigator.clipboard.readText();
				const grandtotal =
					await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(
						clipText
					);
				this.sort(grandtotal);
				editor.replaceSelection(
					this.formatter.format(grandtotal, true)
				);
			},
		});

		this.addCommand({
			id: "extract-annotations",
			name: "Extract PDF Annotations",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const file = this.app.workspace.getActiveFile();
				if (file == null) return;
				const folder = file.parent;
				const grandtotal = []; // array that will contain all fetched Annotations
				const desiredAnnotations =
					this.settings.parsedSettings.desiredAnnotations;

				const pdfjsLib = await loadPdfJs();
				editor.replaceSelection(
					"Extracting PDF Comments from " + folder.name + "\n"
				);

				const promises = []; // when all Promises will be resolved.

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
					this.formatter.format(grandtotal, false)
				);
			},
		});
	}

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
					"exportName",
					"desiredAnnotations",
					"noteTemplateExternalPDFs",
					"noteTemplateInternalPDFs",
					"highlightTemplateExternalPDFs",
					"highlightTemplateInternalPDFs",
					"oneNotePerAnnotation",
					"oneNotePerAnnotationExportName",
					"overwriteExistingNotes",
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

	get exportNameTemplate(): Template {
		return compileTemplate(this.settings.exportName, this.templateSettings);
	}

	get oneNotePerAnnotationExportNameTemplate(): Template {
		return compileTemplate(this.settings.oneNotePerAnnotationExportName, this.templateSettings);
	}

	getTemplateVariablesForExportName(
		file: TFile
	): Record<string, any> {
		const shortcuts = {
			filename: file.basename
		};

		return { file: file, ...shortcuts };
	}

	getTemplateVariablesForOneNotePerAnnotationExportName(
		file: TFile,
		counter: number
	): Record<string, any> {
		const shortcuts = {
			filename: file.basename,
			counter: counter,
		};

		return { file: file, ...shortcuts };
	}

	getResolvedExportName(file: TFile): string {
		return this.exportNameTemplate(
			this.getTemplateVariablesForExportName(file)
		);
	}

	getResolvedOneNotePerAnnotationExportName(file: TFile, counter): string {
		return this.oneNotePerAnnotationExportNameTemplate(
			this.getTemplateVariablesForOneNotePerAnnotationExportName(file, counter)
		);
	}

	getResolvedExportPath(pdfFile: TFile, fileNameOfExportNote: string): string {
		const exportPath = this.settings.exportPath;
		// Check if export path should be dynamic=next to PDF (./) or static=from settings (path/)
		let filePathOfExportNote = "";
		if (exportPath === "./") {
			filePathOfExportNote = pdfFile.path.replace(
				pdfFile.name,
				fileNameOfExportNote
			);
		} else {
			filePathOfExportNote = exportPath + fileNameOfExportNote;
		}
		return filePathOfExportNote;
	}

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
