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
    bodyOrHighlightedText: 'Body of annotation if any, otherwise highlighted text from PDF'
};

export const SUPPORTED_ANNOTS = {
  Text: 'Text-Annotation (Note)',
  Highlight: 'Highlighted text',
  Underline: 'Underlined text',
  Squiggly: "Squiggly underlined text",
  FreeText: "Free text added to the pdf"
};

export const ANNOTS_TREATED_AS_HIGHLIGHTS = ['Highlight', 'Underline', 'Squiggly'];

export class PDFAnnotationPluginSetting {
    public useStructuringHeadlines: boolean;
    public useFolderNames: boolean;
    public sortByTopic: boolean;
    public exportPath: string;
    // Page between which the plugin will be enabled
    public page_min: number;
    public page_max: number;
    // Desired annotations
    public desiredAnnotations: string;
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
    // Link to page/file
    public lnk_tog: boolean;
    public lnk_cmd: string;

    public parsedSettings: {
        desiredAnnotations: string[];
    }

    constructor() {
        this.useStructuringHeadlines = true;
        this.useFolderNames = false;
        this.sortByTopic = false;
        this.page_min = 0;
        this.page_max = 0;
        this.exportPath = '';
        this.desiredAnnotations = "Text, Highlight, Underline";
        this.noteTemplateExternalPDFs = "{{bodyOrHighlightedText}} [🔗]()";
        this.noteTemplateInternalPDFs = "{{bodyOrHighlightedText}} [🔗]()";
        this.highlightTemplateExternalPDFs = "{{bodyOrHighlightedText}} [🔗]()";
        this.highlightTemplateInternalPDFs = "{{bodyOrHighlightedText}} [🔗]()";
            '{{highlightedText}} // {{body}} highlighted by {{author}} at page {{pageNumber}} on [[{{filepath}}]]';
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
Source: "[[{fileName}]]"
Date: "{dateTime}"
tags:
    - "#Type/Note/Info"
---`;
        this.pdf_f_prb = `
---
## *Note infos*
### *Références*
- [[{fileName}]]

### *Links*
-

### *Keys concepts*
-

---
\`\`\`table-of-contents
title:==**_Sommaire de la note :_**==
style:nestedOrderedList
\`\`\`
---
`;
        this.perso_prb  = "### Personal summary";
        this.conds_prb  = "### Condensed format";
        this.detal_prb  = "### Detailed format";
        this.no_an_prb  = "- **No annotation**";
        this.lnk_tog    = false;
        this.lnk_cmd    = "[🔗](obsidian://shell-commands?execute=CMD_ID_FROM_SHELL_COMMANDS&_page_number={{page_number}}&_file_path={{file_path}})";

        this.parsedSettings = {
            desiredAnnotations: this.parseCommaSeparatedStringToArray(this.desiredAnnotations)
        };
    }// end of constructor


    public parseCommaSeparatedStringToArray(desiredAnnotations: string): string[] {
        return desiredAnnotations.split(',').map((item) => item.trim());
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
                if (settingsKey === 'desiredAnnotations') {
                    this.plugin.settings.parsedSettings.desiredAnnotations = this.plugin.settings.parseCommaSeparatedStringToArray(value);
                }
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


        // Export path
        new Setting(containerEl)
            .setName('Notes export path')
            .setDesc('The path to which the notes, including the extracted annotations, will be exported. The path should be relative to the vault root. Paths must end with a \'/\'. Leave blank to export to the vault root.')
            .addText((input) => this.buildValueInput(input, 'exportPath'));


        containerEl.createEl('h3', { text: 'Desired annotations' });
        const desiredAnnotationsInstructionsEl = containerEl.createEl('p');
        desiredAnnotationsInstructionsEl.append(
          createSpan({
            text:
              'You can specify which types of annotations should be extracted by the plugin. ' +
              'List the types exactly as listed here, separated by commas. ' +
              'The plugin supports the following types of annotations: '
          }),
        );

        const desiredAnnotationsVariableUl = containerEl.createEl('ul');
        Object.entries(SUPPORTED_ANNOTS).forEach((variableData) => {
            const [key, description] = variableData,
                desiredAnnotationsVariableItem = desiredAnnotationsVariableUl.createEl('li');

            desiredAnnotationsVariableItem.createEl('span', {
                cls: 'text-monospace',
                text: key,
            });

            desiredAnnotationsVariableItem.createEl('span', {
                text: description ? ` — ${description}` : '',
            });
        });

    new Setting(containerEl)
      .setName('The following types of annotations should be extracted:')
      .addTextArea((input) => {
        input.inputEl.style.width = '100%';
        input.inputEl.style.height = '10em';
        this.buildValueInput(input, 'desiredAnnotations');
      });

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
            .setDesc('Text inserted at the file\'s beginning. \nThe marker {dateTime} will be replaced by\nthe date/Time in "DD/MM/YYYY @HH:mm" format')
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


        // COMMAND-LINK
        containerEl.createEl('h4', { text: 'LINK: Command' });
        containerEl.createEl('span', { text:
'You can add here a command so that a link is created at the beginning of each annotation to open the PDF file at the annotation\'s page.\
To do this:'});
        containerEl.createEl('li', { text: 'Install the Shell commands plugin.'});
        const l_shell = containerEl.createEl('li', { text: 'Create a new shell command with the path to a PDF viewer that accepts the page number as argument, such as PDF XChange Editor.'});
        const l_nested_01 = l_shell.createEl('ul');
        l_nested_01.createEl('li', { text: 'This shell command may look like this: "YOUR_PATH_TO_PDFXEdit.exe" /A "page={{_page_number}}" "{{_file_path}}"'});
        const l_var = containerEl.createEl('li', { text: 'Create variables for this shell command in the "Variables" tab:'});
        const l_nested_02 = l_var.createEl('ul');
        l_nested_02.createEl('li', { text: 'page_number'});
        l_nested_02.createEl('li', { text: 'file_path'});
        containerEl.createEl('li', { text: 'Copy the shell command by clicking on 🔗.'});
        containerEl.createEl('li', { text: 'Paste it below in "Command to add", adding {{page_number}} and {{file_path}} where needed.'});
        containerEl.createEl('li', { text: 'Set "Add the command link"'});

        // Link command toggle
        new Setting(containerEl)
            .setName('Link-command: Add the command link')
            .setDesc('If enabled, a link will be added to annotations as indicated below',)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.lnk_tog).onChange((value) => {
                    this.plugin.settings.lnk_tog = value;
                    this.plugin.saveData(this.plugin.settings);

                }),
            );

        new Setting(containerEl)
            .setName('Link-command: Command to add')
            .setDesc('Command to add to the link so that (for instance) the PDF file is opened at the specified page. \
Use {{page_number}} where the page should be placed, and \
{{file_path}} where the PDF file name/path should be placed. \
Eg.: [🔗](obsidian://shell-commands?execute=CMD_ID_FROM_SHELL_COMMANDS&_page_number={{page_number}}&_file_path={{file_path}})')
            .addTextArea(text => text
                .setValue(this.plugin.settings.lnk_cmd)
                .onChange(async (value) => {
                    this.plugin.settings.lnk_cmd = value;
                    await this.plugin.saveData(this.plugin.settings);
                }),
            );
    }
}
