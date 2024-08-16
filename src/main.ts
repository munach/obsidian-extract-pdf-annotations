import {
	compile as compileTemplate,
	TemplateDelegate as Template
} from 'handlebars';
import { Editor, FileSystemAdapter, loadPdfJs, MarkdownView, Plugin, TFile, Vault } from 'obsidian';
import { loadPDFFile } from 'src/extractHighlight';
import { PDFAnnotationPluginSetting, PDFAnnotationPluginSettingTab } from 'src/settings';
import { IIndexable, PDFFile } from 'src/types';

import * as fs from 'fs';

export default class PDFAnnotationPlugin extends Plugin {

	public settings: PDFAnnotationPluginSetting;

	// Template compilation options
	private templateSettings = {
		noEscape: true,
	};

	sort(grandtotal) {
		const settings = this.settings

		if (settings.sortByTopic && settings.useStructuringHeadlines) {
			grandtotal.forEach((anno) => {
				const lines = anno.body.split(/\r\n|\n\r|\n|\r/); // split by:     \r\n  \n\r  \n  or  \r
				anno.topic = lines[0]; // First line of contents
				anno.body = lines.slice(1).join('\r\n')
			})
		}

		grandtotal.sort(function (a1, a2) {
			if (settings.sortByTopic) {
				// sort by topic
				if (a1.topic > a2.topic) return 1
				if (a1.topic < a2.topic) return -1
			}

			if (settings.useFolderNames) {
				// then sort by folder  
				if (a1.folder > a2.folder) return 1
				if (a1.folder < a2.folder) return -1
			}

			// then sort by file.name  
			if (a1.file.name > a2.file.name) return 1
			if (a1.file.name < a2.file.name) return -1

			// then sort by page
			if (a1.pageNumber > a2.pageNumber) return 1
			if (a1.pageNumber < a2.pageNumber) return -1

			// they are on the same, page, sort (descending) by minY
			// if quadPoints are undefined, use minY from the rect-angle
			if (a1.rect[1] > a2.rect[1]) return -1
			if (a1.rect[1] < a2.rect[1]) return 1
			return 0
		})
	}

	format(grandtotal, isExternalFile) {
		// now iterate over the annotations printing topics, then folder, then comments...
		let text = ''
		let topic = ''
		let currentFolder = ''
		// console.log("all annots", grandtotal)
		grandtotal.forEach((a) => {
			// print main Title when Topic changes (and settings allow)
			if (this.settings.useStructuringHeadlines) {
				if (this.settings.sortByTopic) {
					if (topic != a.topic) {
						topic = a.topic
						currentFolder = ''
						text += `# ${topic}\n`
					}
				}

				if (this.settings.useFolderNames) {
					if (currentFolder != a.folder) {
						currentFolder = a.folder
						text += `## ${currentFolder}\n`
					}
				} else {
					if (currentFolder != a.file.name) {
						currentFolder = a.file.name
						text += `## ${currentFolder}\n`
					}
				}
			}

			if (a.subtype === 'Text' || a.subtype === 'FreeText') {
				if (isExternalFile) {
					text += this.getContentForNoteFromExternalPDF(a)
				} else {
					text += this.getContentForNoteFromInternalPDF(a)
				}

			} else {
				if (isExternalFile) {
					text += this.getContentForHighlightFromExternalPDF(a)
				} else {
					text += this.getContentForHighlightFromInternalPDF(a)
				}
			}
		})

		if (grandtotal.length == 0) return '*No Annotations*'
		else return text
	}

	async loadSinglePDFFile(file: TFile) {
		const pdfjsLib = await loadPdfJs()
		const containingFolder = file.parent.name;
		const grandtotal = [] // array that will contain all fetched Annotations
		const desiredAnnotations = this.settings.parsedSettings.desiredAnnotations;
		console.log('loading from file ', file)
		const content = await this.app.vault.readBinary(file)
		await loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), pdfjsLib, containingFolder, grandtotal, desiredAnnotations)
		this.sort(grandtotal)
		const finalMarkdown = this.format(grandtotal, false)

		let filePath = file.name.replace(".pdf", ".md");
		filePath = "Annotations for " + filePath;
		await this.saveHighlightsToFile(filePath, finalMarkdown);
		await this.app.workspace.openLinkText(filePath, '', true);
	}

	async loadAnnotationsFromSinglePDFFileFromClipboardPath(filePathFromClipboard: string) {
		const grandtotal = [] // array that will contain all fetched Annotations
		try {
			const filePathWithoutQuotes = filePathFromClipboard.replace(/"/g, '');
			const stats = fs.statSync(filePathWithoutQuotes);
			if (stats.isFile()) {
				const pdfjsLib = await loadPdfJs();
				const binaryContent = await FileSystemAdapter.readLocalFile(filePathWithoutQuotes);
				const filePathWithSlashs: string = filePathWithoutQuotes.replace(/\\/g, '/');
				const filePathSplits: string[] = filePathWithSlashs.split('/');
				const fileName = filePathSplits.last();
				const extension = fileName.split('.').last();
				const encodedFilePath = encodeURI('file://' + filePathWithoutQuotes)
				const file: PDFFile = new PDFFile(fileName, binaryContent, extension, encodedFilePath);
				const containingFolder = filePathWithSlashs.slice(0, filePathWithSlashs.lastIndexOf('/'));
				const desiredAnnotations = this.settings.parsedSettings.desiredAnnotations;
				await loadPDFFile(file, pdfjsLib, containingFolder, grandtotal, desiredAnnotations)
			} else {
				console.log('Data in clipboard is no file.');
			}
		} catch (error) {
			console.log('Data in clipboard could not be read as filepath.');
			console.error(error);
		}
		return grandtotal;
	}


	async onload() {
		this.loadSettings();
		this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));


		this.addCommand({
			id: 'extract-annotations-single',
			name: 'Extract PDF Annotations on single file',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file != null && file.extension === 'pdf') {
					if (!checking) {
						// load file if (not only checking) && conditions are valid
						this.loadSinglePDFFile(file)
					}
					return true
				} else {
					return false
				}
			}
		})

		this.addCommand({
			id: 'extract-annotations-single-from-clipboard-path',
			name: 'Extract PDF Annotations on single file from path in clipboard',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const clipText = await navigator.clipboard.readText()
				const grandtotal = await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(clipText)
				this.sort(grandtotal)
				editor.replaceSelection(this.format(grandtotal, true))
			}
		})

		this.addCommand({
			id: 'extract-annotations',
			name: 'Extract PDF Annotations',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const file = this.app.workspace.getActiveFile()
				if (file == null) return
				const folder = file.parent
				const grandtotal = [] // array that will contain all fetched Annotations
				const desiredAnnotations = this.settings.parsedSettings.desiredAnnotations;

				const pdfjsLib = await loadPdfJs()
				editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

				const promises = [] // when all Promises will be resolved. 

				Vault.recurseChildren(folder, async (file) => {
					// visit all Childern of parent folder of current active File
					if (file instanceof TFile) {
						if (file.extension === 'pdf') {
							promises.push(
								this.app.vault.readBinary(file).then((content) =>
									loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), pdfjsLib, file.parent.name, grandtotal, desiredAnnotations))
							)
						}
					}
				})
				await Promise.all(promises)
				this.sort(grandtotal)
				editor.replaceSelection(this.format(grandtotal, false))
			}
		})
	}


	loadSettings() {
		this.settings = new PDFAnnotationPluginSetting();
		(async () => {
			const loadedSettings = await this.loadData();
			if (loadedSettings) {
				const toLoad = [
					'useStructuringHeadlines',
					'useFolderNames',
					'sortByTopic',
					'desiredAnnotations',
					'noteTemplateExternalPDFs',
					'noteTemplateInternalPDFs',
					'highlightTemplateExternalPDFs',
					'highlightTemplateInternalPDFs'
				];
				toLoad.forEach((setting) => {
					if (setting in loadedSettings) {
						(this.settings as IIndexable)[setting] = loadedSettings[setting];
					}
				});
				this.settings.parsedSettings = {
					desiredAnnotations: this.settings.parseCommaSeparatedStringToArray(this.settings.desiredAnnotations)
				};
			}
		})();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	onunload() { }

	get noteFromExternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.noteTemplateExternalPDFs,
			this.templateSettings,
		);
	}

	get noteFromInternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.noteTemplateInternalPDFs,
			this.templateSettings,
		);
	}

	get highlightFromExternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.highlightTemplateExternalPDFs,
			this.templateSettings,
		);
	}

	get highlightFromInternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.highlightTemplateInternalPDFs,
			this.templateSettings,
		);
	}

	getTemplateVariablesForAnnotation(annotation: any): Record<string, any> {
		const shortcuts = {
			highlightedText: annotation.highlightedText,
			folder: annotation.folder,
			file: annotation.file,
			filepath: annotation.filepath,
			pageNumber: annotation.pageNumber,
			author: annotation.author,
			body: annotation.body
		};

		return { annotation: annotation, ...shortcuts };
	}


	getContentForNoteFromExternalPDF(annotation: any): string {
		return this.noteFromExternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation),
		);
	}

	getContentForNoteFromInternalPDF(annotation: any): string {
		return this.noteFromInternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation),
		);
	}

	getContentForHighlightFromExternalPDF(annotation: any): string {
		return this.highlightFromExternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation),
		);
	}

	getContentForHighlightFromInternalPDF(annotation: any): string {
		return this.highlightFromInternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation),
		);
	}

	async saveHighlightsToFile(filePath: string, mdString: string) {
		const fileExists = await this.app.vault.adapter.exists(filePath);
		if (fileExists) {
			await this.appendHighlightsToFile(filePath, mdString);
		} else {
			await this.app.vault.create(filePath, mdString);
		}
	}

	async appendHighlightsToFile(filePath: string, note: string) {
		let existingContent = await this.app.vault.adapter.read(filePath);
		if (existingContent.length > 0) {
			existingContent = existingContent + '\r\r';
		}
		await this.app.vault.adapter.write(filePath, existingContent + note);
	}

}






