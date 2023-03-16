import { App, PluginSettingTab, Setting } from "obsidian";
import PDFAnnotationPlugin from "./main";

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

	}
}