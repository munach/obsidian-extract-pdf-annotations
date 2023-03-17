import { App, PluginSettingTab, Setting } from "obsidian";
import PDFAnnotationPlugin from "./main";

export const TEMPLATE_VARIABLES = {
    highlightedText: 'Highlighted text'
  };

export class PDFAnnotationPluginSetting {
	public useStructuringHeadlines: boolean;
	public useFolderNames: boolean;
	public sortByTopic: boolean;

	constructor() {
		this.useStructuringHeadlines = true;
		this.useFolderNames = true;
		this.sortByTopic = true;
	}
}

export class PDFAnnotationPluginSettingTab extends PluginSettingTab {
	plugin: PDFAnnotationPlugin;

	constructor(app: App, plugin: PDFAnnotationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
            containerEl.createEl('h3', { text: 'Template settings' });
            const templateInstructionsEl = containerEl.createEl('p');
            templateInstructionsEl.append(
              createSpan({
                text:
                  'The following settings determine how the highlights and notes created by ' +
                  'the plugin will be rendered. There are four types that you can specify, ' + 
                  'because you might want to have other templates for highlights and notes ' +
                  'which include links to external files. The following variables are available:',
              }),
            );

            const templateVariableUl = containerEl.createEl('ul', {
                attr: { id: 'pdfAnnotationTemplateVariables' },
              });
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
	}
}