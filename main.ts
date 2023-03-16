import { App, Editor, MarkdownView, TFile, Vault, Plugin, PluginSettingTab, Setting, loadPdfJs, FileSystemAdapter } from 'obsidian';
import { loadPDFFile } from 'src/extractHighlight'
import { PDFFile } from 'src/pdffile'
const fs = require('fs');


function template(strings, ...keys) {
	return (function (...values) {
		const dict = values[values.length - 1] || {};
		const result = [strings[0]];
		keys.forEach(function (key, i) {
			const value = Number.isInteger(key) ? values[key] : dict[key];
			result.push(value, strings[i + 1]);
		});
		return result.join('');
	});
}

// templates for different types of Annotations
const highlighted = template`> ${'highlightedText'}

${'body'}
			    
* *highlighted by ${'author'} at page ${'pageNumber'} on [[${'filepath'}]]*

`

const highlightedWithExternalFilePath = template`> ${'highlightedText'}

${'body'}
			    
* *highlighted by ${'author'} at page ${'pageNumber'} on ${'filepath'}*

`

const note = template`${'body'}
  
* *noted by ${'author'} at page ${'pageNumber'} on [[${'filepath'}]]*

`

const noteWithExternalFilePath = template`${'body'}
  
* *noted by ${'author'} at page ${'pageNumber'} on ${'filepath'}*

`


export default class PDFAnnotationPlugin extends Plugin {

	public settings: PDFAnnotationPluginSetting;

	sort(grandtotal) {
		const settings = this.settings

		if (settings.sortByTopic) {
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

	format(grandtotal) {
		// now iterate over the annotations printing topics, then folder, then comments...
		let text = ''
		let topic = ''
		let currentFolder = ''
		// console.log("all annots", grandtotal)
		grandtotal.forEach((a) => {
			// print main Title when Topic changes (and settings allow)
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

			if (a.subtype == 'Text') {
				if (a.filepath.startsWith('file')) {
					text += noteWithExternalFilePath(a)
				} else {
					text += note(a)
				}

			} else {
				if (a.filepath.startsWith('file')) {
					text += highlightedWithExternalFilePath(a)
				} else {
					text += highlighted(a)
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
		console.log('loading from file ', file)
		const content = await this.app.vault.readBinary(file)
		await loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), pdfjsLib, containingFolder, grandtotal)
		this.sort(grandtotal)
		const finalMarkdown = this.format(grandtotal)

		let filePath = file.name.replace(".pdf", ".md");
		filePath = "Annotations for " + filePath;
		await this.saveHighlightsToFile(filePath, finalMarkdown);
		await this.app.workspace.openLinkText(filePath, '', true);
	}

	async loadAnnotationsFromSinglePDFFileFromClipboardPath(filePathFromClipboard: string) {
		const grandtotal = [] // array that will contain all fetched Annotations
		try {
			const filePathWithoutQuotes = filePathFromClipboard.replace(/\"/g, '');
			const stats = fs.statSync(filePathWithoutQuotes);
			if (stats.isFile()) {
				const pdfjsLib = await loadPdfJs()
				const binaryContent = await FileSystemAdapter.readLocalFile(filePathWithoutQuotes)
				const filePathWithSlashs: string = filePathWithoutQuotes.replace(/\\/g, '/');
				const filePathSplits: string[] = filePathWithSlashs.split('/');
				const fileName = filePathSplits.last();
				const extension = fileName.split('.').last();
				const encodedFilePath = encodeURI('file://' + filePathWithoutQuotes)
				const file: PDFFile = new PDFFile(fileName, binaryContent, extension, encodedFilePath);
				const containingFolder = filePathWithSlashs.slice(0, filePathWithSlashs.lastIndexOf('/'));
				await loadPDFFile(file, pdfjsLib, containingFolder, grandtotal)
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
				let grandtotal = await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(clipText)
				this.sort(grandtotal)
				editor.replaceSelection(this.format(grandtotal))
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

				const pdfjsLib = await loadPdfJs()
				editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

				const promises = [] // when all Promises will be resolved. 

				Vault.recurseChildren(folder, async (file) => {
					// visit all Childern of parent folder of current active File
					if (file instanceof TFile) {
						if (file.extension === 'pdf') {
							promises.push(
								this.app.vault.readBinary(file).then((content) =>
									loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), pdfjsLib, file.parent.name, grandtotal))
							)
						}
					}
				})
				await Promise.all(promises)
				this.sort(grandtotal)
				editor.replaceSelection(this.format(grandtotal))
			}
		})
	}


	loadSettings() {
		this.settings = new PDFAnnotationPluginSetting();
		(async () => {
			const loadedSettings = await this.loadData();
			if (loadedSettings) {
				this.settings.useFolderNames = loadedSettings.useFolderNames;
				this.settings.sortByTopic = loadedSettings.sortByTopic;
			}
		})();
	}

	onunload() {
		console.log('onloading plugin')
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



class PDFAnnotationPluginSetting {
	public useFolderNames: boolean;
	public sortByTopic: boolean;

	constructor() {
		this.useFolderNames = true;
		this.sortByTopic = true;
	}
}

class PDFAnnotationPluginSettingTab extends PluginSettingTab {
	plugin: PDFAnnotationPlugin;

	constructor(app: App, plugin: PDFAnnotationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Use Folder Name')
			.setDesc(
				'If enabled, uses the PDF\'s folder name (instead of the PDF-Filename) for sorting',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.useFolderNames).onChange((value) => {
					this.plugin.settings.useFolderNames = value;
					this.plugin.saveData(this.plugin.settings);

				}),
			);

		new Setting(containerEl)
			.setName('Sort by Topic')
			.setDesc(
				'If enabled, uses the notes first line as Topic for primary sorting',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.sortByTopic).onChange((value) => {
					this.plugin.settings.sortByTopic = value;
					this.plugin.saveData(this.plugin.settings);
				}),
			);

	}
}


