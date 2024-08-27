// Settings handling for the PDF Extract annotation plugin
import { AbstractTextComponent, App, DropdownComponent, PluginSettingTab, Setting } from "obsidian";
import PDFAnnotationPlugin from "src/main";
import { IIndexable } from "src/types";

export const TEMPLATE_VARIABLES = {
	highlightedText: 'Highlighted text from PDF',
	folder: 'Folder of PDF file',
	file: 'Binary content of file',
	filepath: 'Path of PDF file',
	pageNumber: 'Page number of annotation with reference to PDF pages',
	author: 'Author of annotation',
	body: 'Body of annotation',
    body_highlightedText: 'Body of annotation if any, otherwise highlighted text from PDF'
};

export class PDFAnnotationPluginSetting {
	public useStructuringHeadlines: boolean;
	public useFolderNames: boolean;
	public sortByTopic: boolean;
    // Page between which the plugin will be enabled
    public page_min: number;
    public page_max: number;
    // Mindmaps
    public mm_fl_tog: boolean;
    public mm_fl_suf: string;
    public mm_preamb: boolean;
    public mm_es_tog: boolean;
    public mm_es_suf: string;
    // External mindmaps
    public ext_fl_tog: boolean;
    public ext_fl_suf: string;
    public ext_es_tog: boolean;
    public ext_es_suf: string;
    // Template
	public noteTemplateExternalPDFs: string;
	public noteTemplateInternalPDFs: string;
	public highlightTemplateExternalPDFs: string;
	public highlightTemplateInternalPDFs: string;
    // Colors
    public level1RGB: number[];
    public level2RGB: number[];
    public level3RGB: number[];
    public summryRGB: number[];
    public imprttRGB: number[];
    public hueTol: number;
    public LumiTol: number;
    // Formats
    public lvl1_format: string;
    public lvl2_format: string;
    public lvl3_format: string;
    public sumr_format: string;
    public impt_format: string;
    public note_format: string;
    public note_preamb: string;
    // Icons
    public lvl1_icon: string;
    public lvl2_icon: string;
    public lvl3_icon: string;
    public sumr_icon: string;
    public impt_icon: string;
    public ext_lvl1_icon: string;
    public ext_lvl2_icon: string;
    public ext_lvl3_icon: string;
    public ext_sumr_icon: string;
    public ext_impt_icon: string;
    public unkn_icon: string;
    // Preambles
    public begin_prb: string;
    public pdf_f_prb: string;
    public perso_prb: string;
    public conds_prb: string;
    public detal_prb: string;
    public no_an_prb: string;

	constructor() {
		this.useStructuringHeadlines = true;
		this.useFolderNames = false;
		this.sortByTopic = false;
        this.page_min = 0;
        this.page_max = 0;
        this.mm_fl_tog = true;
        this.mm_fl_suf = "(mm)";
        this.mm_preamb = true;
        this.mm_es_tog = false;
        this.mm_es_suf = "(mm essential)";
        this.ext_fl_tog= false,
        this.ext_fl_suf= "(ext mm)",
        this.ext_es_tog= false,
        this.ext_es_suf= "(ext mm essential)"
		this.noteTemplateExternalPDFs =
			'{{body_highlightedText}}';
		this.noteTemplateInternalPDFs =
			'{{body_highlightedText}}';
		this.highlightTemplateExternalPDFs =
			'{{body_highlightedText}}';
		this.highlightTemplateInternalPDFs =
			'{{body_highlightedText}}';
        this.level1RGB = [255, 173, 91];
        this.level2RGB = [255, 255, 0];
        this.level3RGB = [209, 223, 235];
        this.summryRGB = [0, 255, 0];
        this.imprttRGB = [252, 54, 54];
        this.hueTol = 5;
        this.LumiTol = 30;
        this.lvl1_format = "";
        this.lvl2_format = "";
        this.lvl3_format = "";
        this.sumr_format = "**";
        this.impt_format = "==";
        this.note_format = "*";
        this.note_preamb = "Note:";
        this.lvl1_icon = "🟠";
        this.lvl2_icon = "🟡";
        this.lvl3_icon = "🔵";
        this.sumr_icon = "🟢";
        this.impt_icon = "🔴";
        this.ext_lvl1_icon = "📌";
        this.ext_lvl2_icon = "";
        this.ext_lvl3_icon = "🔷";
        this.ext_sumr_icon = "📝";
        this.ext_impt_icon = "⚠️";
        this.unkn_icon = "❔";
        // Other emojis: ⚫⚪🟣🟤❔
        this.begin_prb = `---
MOC: []
Source: \"[[{fileName}]]\"
Projets:
Notes liées:
Date: \" {dateTime}\"
tags:
    - \"#Type/Note/Info\"
---`;
        this.pdf_f_prb = `
---
## *Infos note*
### *Références*
- [[{fileName}]]

### *Liens*
- 

### *Concepts clés / Synthèse*
- 

---
\`\`\`table-of-contents
title:==**_Sommaire de la note :_**==
style:nestedOrderedList
\`\`\`
---
`;
        this.perso_prb = "### Synthèse perso";
        this.conds_prb = "### Format condensé";
        this.detal_prb = "### Format détaillé";
        this.no_an_prb = "- **Aucune annotation**";
	}
}



export class PDFAnnotationPluginSettingTab extends PluginSettingTab {
	plugin: PDFAnnotationPlugin;

	constructor(app: App, plugin: PDFAnnotationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	addValueChangeCallback<T extends HTMLTextAreaElement | HTMLInputElement>(
		component: AbstractTextComponent<T> | DropdownComponent,
		settingsKey: string,
		cb?: (value: string) => void,
	): void {
		component.onChange(async (value) => {
			(this.plugin.settings as IIndexable)[settingsKey] = value;
			this.plugin.saveSettings().then(() => {
				if (cb) {
					cb(value);
				}
			});
		});
	}

	buildValueInput<T extends HTMLTextAreaElement | HTMLInputElement>(
		component: AbstractTextComponent<T> | DropdownComponent,
		settingsKey: string,
		cb?: (value: string) => void,
	): void {
		component.setValue((this.plugin.settings as IIndexable)[settingsKey]);
		this.addValueChangeCallback(component, settingsKey, cb);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Use structuring headlines')
			.setDesc(
				'If disabled, no structuring headlines will be shown. Just the annotations in the specified template style.',
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.useStructuringHeadlines).onChange((value) => {
					this.plugin.settings.useStructuringHeadlines = value;
					this.plugin.saveData(this.plugin.settings);
				}),
			);

        // Setting: Folder name instead of file name
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


        // Setting: use 1st line as Topic
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


        // PAGES between which the plugin will be enabled
		containerEl.createEl('h3', { text: 'Pages to extract' });
        // PAGE min:
        new Setting(containerEl)
            .setName('1st page')
            .setDesc('First page to extract annotations from. \nDefault: 0 (i.e. first page)')
            .addText(text => text
                .setValue(this.plugin.settings.page_min.toString())
                .onChange(async (value) => {
                    this.plugin.settings.page_min = parseInt(value);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );

        // PAGE max:
        new Setting(containerEl)
            .setName('Last page')
            .setDesc('Last page to extract annotations up to. \nDefault: 0 (i.e. last page)')
            .addText(text => text
                .setValue(this.plugin.settings.page_max.toString())
                .onChange(async (value) => {
                    this.plugin.settings.page_max = parseInt(value);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // MINDMAPS
        containerEl.createEl('h3', { text: 'Mindmaps to generate' });
        // Full Obsidian mindmap toggle
        new Setting(containerEl)
            .setName('From PDF: Generate full Obsidian mindmap')
            .setDesc('If enabled, generate the full mindmap for Obsidian when calling the plugin from a PDF file',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mm_fl_tog).onChange((value) => {
                    this.plugin.settings.mm_fl_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


        // Full Obsidian mindmap file's suffixe
        new Setting(containerEl)
            .setName('File suffixes: Full Obsidian mindmap')
            .setDesc('File\'s suffixe for the Obsidian mindmap file.\nDefault: (mm)')
            .addText(text => text
                .setValue(this.plugin.settings.mm_fl_suf)
                .onChange(async (value) => {
                    this.plugin.settings.mm_fl_suf = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Mindmap preamble
        new Setting(containerEl)
            .setName('Obsidian mindmap: Add a level')
            .setDesc('If enabled, add a level containing all nodes to save space',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mm_preamb).onChange((value) => {
                    this.plugin.settings.mm_preamb = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


        // Essential mindmap toggle
        new Setting(containerEl)
            .setName('From PDF: Generate essentials Obsidian mindmap')
            .setDesc('If enabled, generate the Obsidian mindmap with essentials (special levels) annotations when calling the plugin from a PDF file',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.mm_es_tog).onChange((value) => {
                    this.plugin.settings.mm_es_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


        // Mindmap of essentials file's suffixe
        new Setting(containerEl)
            .setName('File suffixes: Obsidian Mindmap of essentials')
            .setDesc('File\'s suffixe for the Obsidian mindmap with only essentials (special levels) annotations.\nDefault: (mm essential)')
            .addText(text => text
                .setValue(this.plugin.settings.mm_es_suf)
                .onChange(async (value) => {
                    this.plugin.settings.mm_es_suf = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );



        // EXTERNAL MINDMAPS
        // Full external-mindmap toggle
        new Setting(containerEl)
            .setName('From PDF: Generate full file for external mindmap')
            .setDesc('If enabled, generate the full file for external mindmap when calling the plugin from a PDF file',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.ext_fl_tog).onChange((value) => {
                    this.plugin.settings.ext_fl_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


        // Full external-mindmap file's suffixe
        new Setting(containerEl)
            .setName('File suffixes: Full external-mindmap')
            .setDesc('File\'s suffixe for the external-mindmap file.\nDefault: (ext mm)')
            .addText(text => text
                .setValue(this.plugin.settings.ext_fl_suf)
                .onChange(async (value) => {
                    this.plugin.settings.ext_fl_suf = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Essential external mindmap toggle
        new Setting(containerEl)
            .setName('From PDF: Generate essentials file for external mindmap')
            .setDesc('If enabled, generate the file for external mindmap with essentials (special levels) annotations when calling the plugin from a PDF file',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.ext_es_tog).onChange((value) => {
                    this.plugin.settings.ext_es_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );


        // Mindmap of essentials file's suffixe
        new Setting(containerEl)
            .setName('File suffixes: File for external mindmap of essentials')
            .setDesc('File\'s suffixe for the external-mindmap with only essentials (special levels) annotations.\nDefault: (ext mm essential)')
            .addText(text => text
                .setValue(this.plugin.settings.ext_es_suf)
                .onChange(async (value) => {
                    this.plugin.settings.ext_es_suf = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


		containerEl.createEl('h3', { text: 'Template settings' });
		const templateInstructionsEl = containerEl.createEl('p');
		templateInstructionsEl.append(
			createSpan({
				text:
					'The following settings determine how the highlights and notes created by ' +
					'the plugin will be rendered. There are four types that you can specify, ' +
					'because you might want to have other templates for highlights and notes ' +
					'which include links to external files. Templates are interpreted using ',
			}),
		);
		templateInstructionsEl.append(
			createEl('a', {
				text: 'Handlebars',
				href: 'https://handlebarsjs.com/guide/expressions.html',
			}),
		);
		templateInstructionsEl.append(
			createSpan({
				text: ' syntax. The following variables are available:',
			}),
		);

		const templateVariableUl = containerEl.createEl('ul');
		Object.entries(TEMPLATE_VARIABLES).forEach((variableData) => {
			const [key, description] = variableData,
				templateVariableItem = templateVariableUl.createEl('li');

			templateVariableItem.createEl('span', {
				cls: 'text-monospace',
				text: '{{' + key + '}}',
			});

			templateVariableItem.createEl('span', {
				text: description ? ` — ${description}` : '',
			});
		});

		new Setting(containerEl)
			.setName('Template for notes of PDFs outside Obsidian:')
			.addTextArea((input) => {
				input.inputEl.style.width = '100%';
				input.inputEl.style.height = '5em';
				this.buildValueInput(input, 'noteTemplateExternalPDFs')
			});
		new Setting(containerEl)
			.setName('Template for notes of PDFs inside Obsidian:')
			.addTextArea((input) => {
				input.inputEl.style.width = '100%';
				input.inputEl.style.height = '5em';
				this.buildValueInput(input, 'noteTemplateInternalPDFs');
			}

			);
		new Setting(containerEl)
			.setName('Template for highlights of PDFs outside Obsidian:')
			.addTextArea((input) => {
				input.inputEl.style.width = '100%';
				input.inputEl.style.height = '5em';
				this.buildValueInput(input, 'highlightTemplateExternalPDFs')
			});
		new Setting(containerEl)
			.setName('Template for highlights of PDFs inside Obsidian:')
			.addTextArea((input) => {
				input.inputEl.style.width = '100%';
				input.inputEl.style.height = '5em';
				this.buildValueInput(input, 'highlightTemplateInternalPDFs');
			});


		containerEl.createEl('h3', { text: 'PDF annotations extraction settings' });
		containerEl.createEl('h4', { text: 'LEVELS: Colors and tolerances' });
        // LEVELS: RGB VALUES, HUE TOLERANCE, LUMI TOLERANCE
        // LEVEL 1: Color
        new Setting(containerEl)
            .setName('Color: Level 1')
            .setDesc('R,G,B values for level 1 (separated by commas). \nDefault: Orange (255,173, 91)')
            .addText(text => text
                .setValue(this.plugin.settings.level1RGB[0] + "," + this.plugin.settings.level1RGB[1] + "," + this.plugin.settings.level1RGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.level1RGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // LEVEL 2: Color
        new Setting(containerEl)
            .setName('Color: Level 2')
            .setDesc('R,G,B values for level 2 (separated by commas).\nDefault: Yellow (255,255,  0)')
            .addText(text => text
                .setValue(this.plugin.settings.level2RGB[0] + "," + this.plugin.settings.level2RGB[1] + "," + this.plugin.settings.level2RGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.level2RGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // LEVEL 3: Color
        new Setting(containerEl)
            .setName('Color: Level 3')
            .setDesc('R,G,B values for level 3 (separated by commas).\nDefault: Light blue (209,223,235)')
            .addText(text => text
                .setValue(this.plugin.settings.level3RGB[0] + "," + this.plugin.settings.level3RGB[1] + "," + this.plugin.settings.level3RGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.level3RGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // SUMMARY: Color
        new Setting(containerEl)
            .setName('Color: Special level (1)')
            .setDesc('R,G,B values for special level (1) such as summaries (separated by commas).\nDefault: Green (  0, 255,  0)')
            .addText(text => text
                .setValue(this.plugin.settings.summryRGB[0] + "," + this.plugin.settings.summryRGB[1] + "," + this.plugin.settings.summryRGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.summryRGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // IMPORTANT: Color
        new Setting(containerEl)
            .setName('Color: Special level (2)')
            .setDesc('R,G,B values for special level (2) such as important annot. (separated by commas).\nDefault: Red (252, 54, 54)')
            .addText(text => text
                .setValue(this.plugin.settings.imprttRGB[0] + "," + this.plugin.settings.imprttRGB[1] + "," + this.plugin.settings.imprttRGB[2])
                .onChange(async (value) => {
                    this.plugin.settings.imprttRGB = value.split(',').map(Number);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Hue tolerance
        new Setting(containerEl)
            .setName('Color: Hue tolerance (%)')
            .setDesc('Indicate the hue tolerance (in %) to recognize the colors.\nDefault: 5')
            .addText(text => text
                .setValue(this.plugin.settings.hueTol.toString())
                .onChange(async (value) => {
                    this.plugin.settings.hueTol = parseInt(value);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Luminosity tolerance
        new Setting(containerEl)
            .setName('Color: Luminosity tolerance (%)')
            .setDesc('Indicate the luminosity tolerance (in %) to recognize the colors.\nDefault: 30')
            .addText(text => text
                .setValue(this.plugin.settings.LumiTol.toString())
                .onChange(async (value) => {
                    this.plugin.settings.LumiTol = parseInt(value);
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // FORMATS
		containerEl.createEl('h4', { text: 'LEVELS: Formatting' });
        // Level 1
        new Setting(containerEl)
            .setName('Format: Level 1')
            .setDesc('Indicate the format for level 1 annotations.\nDefault: [Empty]')
            .addText(text => text
                .setValue(this.plugin.settings.lvl1_format)
                .onChange(async (value) => {
                    this.plugin.settings.lvl1_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Level 2
        new Setting(containerEl)
            .setName('Format: Level 2')
            .setDesc('Indicate the format for level 2 annotations.\nDefault: [Empty]')
            .addText(text => text
                .setValue(this.plugin.settings.lvl2_format)
                .onChange(async (value) => {
                    this.plugin.settings.lvl2_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Level 3
        new Setting(containerEl)
            .setName('Format: Level 3')
            .setDesc('Indicate the format for level 3 annotations.\nDefault: [Empty]')
            .addText(text => text
                .setValue(this.plugin.settings.lvl3_format)
                .onChange(async (value) => {
                    this.plugin.settings.lvl3_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Summary
        new Setting(containerEl)
            .setName('Format: Summary')
            .setDesc('Indicate the format for summary annotations.\nDefault: **')
            .addText(text => text
                .setValue(this.plugin.settings.sumr_format)
                .onChange(async (value) => {
                    this.plugin.settings.sumr_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Important
        new Setting(containerEl)
            .setName('Format: Important')
            .setDesc('Indicate the format for important annotations.\nDefault: ==')
            .addText(text => text
                .setValue(this.plugin.settings.impt_format)
                .onChange(async (value) => {
                    this.plugin.settings.impt_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Notes
        new Setting(containerEl)
            .setName('Format: Notes')
            .setDesc('Indicate the format for notes.\nDefault: _')
            .addText(text => text
                .setValue(this.plugin.settings.note_format)
                .onChange(async (value) => {
                    this.plugin.settings.note_format = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // NOTE PREAMBLE
        new Setting(containerEl)
            .setName('Preamble: Notes')
            .setDesc('Indicate the notes\'preamble.\nDefault: **Note:**')
            .addText(text => text
                .setValue(this.plugin.settings.note_preamb)
                .onChange(async (value) => {
                    this.plugin.settings.note_preamb = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // ICONS
		containerEl.createEl('h4', { text: 'LEVELS: Icons' });
        // Level 1
        new Setting(containerEl)
            .setName('Icons: Level 1')
            .setDesc('Indicate the icon for level 1 annotations.\nDefault: 🟠')
            .addText(text => text
                .setValue(this.plugin.settings.lvl1_icon)
                .onChange(async (value) => {
                    this.plugin.settings.lvl1_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Level 2
        new Setting(containerEl)
            .setName('Icons: Level 2')
            .setDesc('Indicate the icon for level 2 annotations.\nDefault: 🟡')
            .addText(text => text
                .setValue(this.plugin.settings.lvl2_icon)
                .onChange(async (value) => {
                    this.plugin.settings.lvl2_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Level 3
        new Setting(containerEl)
            .setName('Icons: Level 3')
            .setDesc('Indicate the icon for level 3 annotations.\nDefault: 🔵')
            .addText(text => text
                .setValue(this.plugin.settings.lvl3_icon)
                .onChange(async (value) => {
                    this.plugin.settings.lvl3_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Summmary
        new Setting(containerEl)
            .setName('Icons: Summary')
            .setDesc('Indicate the icon for summaries annotations.\nDefault: 🟢')
            .addText(text => text
                .setValue(this.plugin.settings.sumr_icon)
                .onChange(async (value) => {
                    this.plugin.settings.sumr_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Important
        new Setting(containerEl)
            .setName('Icons: Important')
            .setDesc('Indicate the icon for important annotations.\nDefault: 🔴')
            .addText(text => text
                .setValue(this.plugin.settings.impt_icon)
                .onChange(async (value) => {
                    this.plugin.settings.impt_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // External mindmap: Level 1
        new Setting(containerEl)
            .setName('Icons (ext. mm): Level 1')
            .setDesc('Indicate the icon for level 1 annotations for external mindmap.\nDefault: 📌')
            .addText(text => text
                .setValue(this.plugin.settings.ext_lvl1_icon)
                .onChange(async (value) => {
                    this.plugin.settings.ext_lvl1_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // External mindmap: Level 2
        new Setting(containerEl)
            .setName('Icons (ext. mm): Level 2')
            .setDesc('Indicate the icon for level 2 annotations for external mindmaps.\nDefault: [None]')
            .addText(text => text
                .setValue(this.plugin.settings.ext_lvl2_icon)
                .onChange(async (value) => {
                    this.plugin.settings.ext_lvl2_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // External mindmap: Level 3
        new Setting(containerEl)
            .setName('Icons (ext. mm): Level 3')
            .setDesc('Indicate the icon for level 3 annotations for external mindmaps.\nDefault: 🔷')
            .addText(text => text
                .setValue(this.plugin.settings.ext_lvl3_icon)
                .onChange(async (value) => {
                    this.plugin.settings.ext_lvl3_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // External mindmap: Summmary
        new Setting(containerEl)
            .setName('Icons (ext. mm): Summary')
            .setDesc('Indicate the icon for summaries annotations for external mindmaps.\nDefault: 📝')
            .addText(text => text
                .setValue(this.plugin.settings.ext_sumr_icon)
                .onChange(async (value) => {
                    this.plugin.settings.ext_sumr_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // External mindmap: Important
        new Setting(containerEl)
            .setName('Icons (ext. mm): Important')
            .setDesc('Indicate the icon for important annotations for external mindmaps.\nDefault: ⚠️')
            .addText(text => text
                .setValue(this.plugin.settings.ext_impt_icon)
                .onChange(async (value) => {
                    this.plugin.settings.ext_impt_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Unknown
        new Setting(containerEl)
            .setName('Icons: Unknown')
            .setDesc('Indicate the icon for unknown\'s level annotations.\nDefault: ❔')
            .addText(text => text
                .setValue(this.plugin.settings.unkn_icon)
                .onChange(async (value) => {
                    this.plugin.settings.unkn_icon = value + " ";
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // PREAMBLES
		containerEl.createEl('h4', { text: 'FILES: Preambles' });
        // File's beginning
        new Setting(containerEl)
            .setName('Preambles: File beginning')
            .setDesc('Text inserted at the file\'s beginning. \nThe marker {dateTime} will be replaced by\nthe date/Time in \"DD/MM/YYYY @HH:mm\" format')
            .addTextArea(text => {
                text.inputEl.style.width = '100%'
                text.inputEl.style.height = '200px'
                text.setValue(this.plugin.settings.begin_prb)
                text.onChange(async (value) => {
                    this.plugin.settings.begin_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                });
            });


        // PDF file preamble
        new Setting(containerEl)
            .setName('Preambles: PDF')
            .setDesc('Text inserted at each new PDF.\nThe marker {fileName} will be replaced by\nthe PDF file name')
            .addTextArea(text => {
                text.inputEl.style.width = '100%'
                text.inputEl.style.height = '250px'
                text.setValue(this.plugin.settings.pdf_f_prb)
                text.onChange(async (value) => {
                    this.plugin.settings.pdf_f_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                });
            });


        containerEl.createEl('h4', { text: 'TITLES: Preambles' });
        // Manual personal annotations preamble
        new Setting(containerEl)
            .setName('Preambles: Manual personal annotations')
            .setDesc('Preamble for manual annotations to add to the extracted ones.\nDefault: ### Synthèse perso')
            .addText(text => text
                .setValue(this.plugin.settings.perso_prb)
                .onChange(async (value) => {
                    this.plugin.settings.perso_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Condensed annotations preamble
        new Setting(containerEl)
            .setName('Preambles: Condensed')
            .setDesc('Preamble for the condensed annotations.\nDefault: ### Format condensé')
            .addText(text => text
                .setValue(this.plugin.settings.conds_prb)
                .onChange(async (value) => {
                    this.plugin.settings.conds_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // Detailed annotations preamble
        new Setting(containerEl)
            .setName('Preambles: Detailed')
            .setDesc('Preamble for the detailed annotations.\nDefault: ### Format détaillé')
            .addText(text => text
                .setValue(this.plugin.settings.detal_prb)
                .onChange(async (value) => {
                    this.plugin.settings.detal_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


        // No annotation preamble
        new Setting(containerEl)
            .setName('Preambles: No annotation')
            .setDesc('Preamble in case there is no annotation.\nDefault: - **Aucune annotation**')
            .addText(text => text
                .setValue(this.plugin.settings.no_an_prb)
                .onChange(async (value) => {
                    this.plugin.settings.no_an_prb = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );


	}
}
