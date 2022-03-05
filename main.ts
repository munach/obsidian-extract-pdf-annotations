import { App, Editor, MarkdownView, TFile, Vault, Plugin, PluginSettingTab, Setting, loadPdfJs } from 'obsidian';


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

${'contents'}
			    
* *highlighted by ${'title'} at page ${'pageNumber'} on [[${'filepath'}]]*

`

const note = template`${'contents'}
  
* *noted by ${'title'} at page ${'pageNumber'} on [[${'filepath'}]]*

`


const SUPPORTED_ANNOTS = ['Text', 'Highlight', 'Underline'];


export default class PDFAnnotationPlugin extends Plugin {

	public settings: PDFAnnotationPluginSetting;

	// load the PDFpage, then get all Annotations
	// we look only at SUPPORTED_ANNOTS (Text, Underline, Highlight)
	// if its a underline or highlight, we fetch the TextContent under the 'Rect' Element of the highlghts. 
	async loadPage(page, pagenum : number, file: TFile, containingFolder : string, editor : Editor, total) {
		// console.log('page', pagenum, page)
		const settings = this.settings
		let annotations = await page.getAnnotations()
		// console.log('Annotations', annotations)

		annotations = annotations.filter(function (anno) {
					return SUPPORTED_ANNOTS.indexOf(anno.subtype) >= 0;
				});

		if (annotations.length > 0) {
			editor.replaceSelection('PDF Page ' + pagenum + ' on ' + file.name + ' has ' + annotations.length + ' Annots.\n')
		}

		const content = await page.getTextContent({ normalizeWhitespace: true })
		// sort text elements
		content.items.sort(function (a1, a2) {							
			if (a1.transform[5] > a2.transform[5]) return -1    // y coord. descending
			if (a1.transform[5] < a2.transform[5]) return 1
			if (a1.transform[4] > a2.transform[4]) return 1    // x coord. ascending
			if (a1.transform[4] < a2.transform[4]) return -1				
			return 0
		})


		annotations.map(async function (anno) {
			if (anno.subtype == 'Highlight' || anno.subtype == 'Underline') {

				// get bounding box (we use rect, instead of quadPoints, this ist simpler...)
				const minx = (anno.rect[0] < anno.rect[2] ? anno.rect[0] : anno.rect[2])
				const maxx = (anno.rect[0] < anno.rect[2] ? anno.rect[2] : anno.rect[0])
				const miny = (anno.rect[1] < anno.rect[3] ? anno.rect[1] : anno.rect[3])
				const maxy = (anno.rect[1] < anno.rect[3] ? anno.rect[3] : anno.rect[1])

				const mycontent = content.items.filter(function (x) {
					// TODO: if bounding box is withing text line, we miss the line
					if (x.width == 0) return false      // eliminate empty stuff
					if (!((miny <= x.transform[5]) && (x.transform[5] <= maxy))) return false  // y coordinate not in box
					if ((minx <= x.transform[4]) && (x.transform[4] <= maxx)) return true     // x coordinate withng box
					if ((x.transform[4] <= minx) && (x.transform[4] + x.width >= minx))		// x+width is right crosses the box
					return false
				})
				// console.log('in box', mycontent)

				let r = '???'
				if (mycontent.length > 0) {
					r = ''
					let y = mycontent[0].transform[5]  // y coordinate of current line, initialize with first line 

					mycontent.forEach((textContent) => {
						if (textContent.transform[5] != y) {  
							// new line
							y = textContent.transform[5]
							if (r.endsWith('-')) {
								r = r.slice(0,-1) + textContent.str
							} else {
								r += ' ' + textContent.str
							}
						} else {
							r += textContent.str
						}
					});
				} else {
					console.warn ('No highlighted text found.')
					console.log(`${file.name} (Page ${pagenum}) rect ${minx} < x < ${maxx}, ${miny} < y < ${maxy}`)
					console.log("content", content)
				}

				// console.log('lines', r)
				// editor.replaceSelection(`\n> ${r}\n`)
				anno.highlightedText = r
			}
			const lines = anno.contents.split(/\r\n|\n\r|\n|\r/); // split by:     \r\n  \n\r  \n  or  \r
			anno.topic = lines[0]; // First line of contents
			if (settings.sortByTopic) {
				anno.contents = lines.slice(1).join('\r\n')
			}
			anno.folder = containingFolder
			anno.file = file
			anno.filepath = file.path		// we need a direct string property in the templates 
			anno.pageNumber = pagenum
			total.push(anno)
		});
	}

	sort (grandtotal) {
		const settings = this.settings
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
		const settings = this.settings
		console.log("all annots", grandtotal)
		grandtotal.forEach((a) => {
		// print main Title when Topic changes (and settings allow)
		if (settings.sortByTopic) {
			if (topic != a.topic) {
				topic = a.topic
				currentFolder = ''
				text += `# ${topic}\n`
			}
		}

		if (settings.useFolderNames) {
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
				text += note(a)
			} else {
				text += highlighted(a)
			}
		})
		return text
	}

	async onload() {
		this.loadSettings();
		this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));

		this.addCommand({
			id: 'extract-annotations',
			name: 'Extract and insert Annotations',
			editorCallback: async (editor: Editor, view: MarkdownView) => { 
				const folder = this.app.workspace.getActiveFile().parent
				const grandtotal = [] // array that will contain all fetched Annotations kj

				const pdfjsLib = await loadPdfJs()
				editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

				const promises = [] // when all Promises will be resolved. 

				Vault.recurseChildren(folder, async (file) => {
					// visit all Childern of parent folder of current active File
					if (file instanceof TFile) {
						if (file.extension === 'pdf') {
							const containingFolder = file.parent.name;
							promises.push(
								this.app.vault.readBinary(file).then(async (content) => {
									return await pdfjsLib.getDocument(content).promise
								}).then(async (pdf : PDFDocumentProxy ) => {
									// console.log("The pdf", pdf)
									for (let i = 1; i <= pdf.numPages; i++) {
										const page = await pdf.getPage(i)
										this.loadPage(page, i, file, containingFolder,editor, grandtotal)
									}						
								})) 
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
			} else {
				await this.saveData(this.settings);
			}
		})();
	}

	onunload() {}

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
        const {containerEl} = this;

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


