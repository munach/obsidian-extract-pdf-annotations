import {
	AbstractTextComponent,
	App,
	DropdownComponent,
	PluginSettingTab,
	Setting,
} from "obsidian";
import PDFAnnotationPlugin from "src/main";
import { IIndexable } from "src/types";

export const TEMPLATE_VARIABLES = {
	highlightedText: "Highlighted text from PDF",
	folder: "Folder of PDF file",
	file: "Binary content of file",
	filepath: "Path of PDF file",
	pageNumber: "Page number of annotation with reference to PDF pages",
	author: "Author of annotation",
	body: "Body of annotation",
};

export const SUPPORTED_ANNOTS = {
	Text: "Text-Annotation (Note)",
	Highlight: "Highlighted text",
	Underline: "Underlined text",
	Squiggly: "Squiggly underlined text",
	FreeText: "Free text added to the pdf",
};

export const ANNOTS_TREATED_AS_HIGHLIGHTS = [
	"Highlight",
	"Underline",
	"Squiggly",
];

export class PDFAnnotationPluginSetting {
	public useStructuringHeadlines: boolean;
	public useFolderNames: boolean;
	public sortByTopic: boolean;
	public exportPath: string;
	public exportName: string;
	public desiredAnnotations: string;
	public noteTemplateExternalPDFs: string;
	public noteTemplateInternalPDFs: string;
	public highlightTemplateExternalPDFs: string;
	public highlightTemplateInternalPDFs: string;
	public oneNotePerAnnotation: boolean;
	public oneNotePerAnnotationExportName: string;
	public parsedSettings: {
		desiredAnnotations: string[];
	};

	constructor() {
		this.useStructuringHeadlines = true;
		this.useFolderNames = true;
		this.sortByTopic = true;
		this.exportPath = "";
		this.exportName = "Annotations for {{filename}}";
		this.desiredAnnotations = "Text, Highlight, Underline";
		this.noteTemplateExternalPDFs =
			"{{body}}\n" +
			"\n" +
			"* *noted by {{author}} at page {{pageNumber}} on {{filepath}}*\n" +
			"\n";
		this.noteTemplateInternalPDFs =
			"{{body}}\n" +
			"\n" +
			"* *noted by {{author}} at page {{pageNumber}} on [[{{filepath}}]]*\n" +
			"\n";
		this.highlightTemplateExternalPDFs =
			"> {{highlightedText}}\n" +
			"\n" +
			"{{body}}\n" +
			"\n" +
			"* *highlighted by {{author}} at page {{pageNumber}} on {{filepath}}*\n" +
			"\n";
		this.highlightTemplateInternalPDFs =
			"> {{highlightedText}}\n" +
			"\n" +
			"{{body}}\n" +
			"\n" +
			"* *highlighted by {{author}} at page {{pageNumber}} on [[{{filepath}}]]*\n" +
			"\n";
		this.oneNotePerAnnotation = false;
		this.oneNotePerAnnotationExportName = "Annotations for {{filename}}-{{counter}}";
		this.parsedSettings = {
			desiredAnnotations: this.parseCommaSeparatedStringToArray(
				this.desiredAnnotations
			),
		};
	}

	public parseCommaSeparatedStringToArray(
		desiredAnnotations: string
	): string[] {
		return desiredAnnotations.split(",").map((item) => item.trim());
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
		cb?: (value: string) => void
	): void {
		component.onChange(async (value) => {
			(this.plugin.settings as IIndexable)[settingsKey] = value;
			this.plugin.saveSettings().then(() => {
				if (settingsKey === "desiredAnnotations") {
					this.plugin.settings.parsedSettings.desiredAnnotations =
						this.plugin.settings.parseCommaSeparatedStringToArray(
							value
						);
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
		cb?: (value: string) => void
	): void {
		component.setValue((this.plugin.settings as IIndexable)[settingsKey]);
		this.addValueChangeCallback(component, settingsKey, cb);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h3", { text: "Desired annotations" });
		const desiredAnnotationsInstructionsEl = containerEl.createEl("p");
		desiredAnnotationsInstructionsEl.append(
			createSpan({
				text:
					"You can specify which types of annotations should be extracted by the plugin. " +
					"List the types exactly as listed here, separated by commas. " +
					"The plugin supports the following types of annotations: ",
			})
		);

		const desiredAnnotationsVariableUl = containerEl.createEl("ul");
		Object.entries(SUPPORTED_ANNOTS).forEach((variableData) => {
			const [key, description] = variableData,
				desiredAnnotationsVariableItem =
					desiredAnnotationsVariableUl.createEl("li");

			desiredAnnotationsVariableItem.createEl("span", {
				cls: "text-monospace",
				text: key,
			});

			desiredAnnotationsVariableItem.createEl("span", {
				text: description ? ` — ${description}` : "",
			});
		});

		new Setting(containerEl)
			.setName("The following types of annotations should be extracted:")
			.addTextArea((input) => {
				input.inputEl.style.width = "100%";
				input.inputEl.style.height = "10em";
				this.buildValueInput(input, "desiredAnnotations");
			});

		containerEl.createEl("h3", { text: "Styling settings" });
		containerEl.createEl("h4", { text: "Template settings" });
		const templateInstructionsEl = containerEl.createEl("p");
		templateInstructionsEl.append(
			createSpan({
				text:
					"The following settings determine how the highlights and notes created by " +
					"the plugin will be rendered. There are four types that you can specify, " +
					"because you might want to have other templates for highlights and notes " +
					"which include links to external files. Templates are interpreted using ",
			})
		);
		templateInstructionsEl.append(
			createEl("a", {
				text: "Handlebars",
				href: "https://handlebarsjs.com/guide/expressions.html",
			})
		);
		templateInstructionsEl.append(
			createSpan({
				text: " syntax. The following variables are available:",
			})
		);

		const templateVariableUl = containerEl.createEl("ul");
		Object.entries(TEMPLATE_VARIABLES).forEach((variableData) => {
			const [key, description] = variableData,
				templateVariableItem = templateVariableUl.createEl("li");

			templateVariableItem.createEl("span", {
				cls: "text-monospace",
				text: "{{" + key + "}}",
			});

			templateVariableItem.createEl("span", {
				text: description ? ` — ${description}` : "",
			});
		});

		new Setting(containerEl)
			.setName("Template for notes of PDFs outside Obsidian:")
			.addTextArea((input) => {
				input.inputEl.style.width = "100%";
				input.inputEl.style.height = "10em";
				this.buildValueInput(input, "noteTemplateExternalPDFs");
			});
		new Setting(containerEl)
			.setName("Template for notes of PDFs inside Obsidian:")
			.addTextArea((input) => {
				input.inputEl.style.width = "100%";
				input.inputEl.style.height = "10em";
				this.buildValueInput(input, "noteTemplateInternalPDFs");
			});
		new Setting(containerEl)
			.setName("Template for highlights of PDFs outside Obsidian:")
			.addTextArea((input) => {
				input.inputEl.style.width = "100%";
				input.inputEl.style.height = "10em";
				this.buildValueInput(input, "highlightTemplateExternalPDFs");
			});
		new Setting(containerEl)
			.setName("Template for highlights of PDFs inside Obsidian:")
			.addTextArea((input) => {
				input.inputEl.style.width = "100%";
				input.inputEl.style.height = "10em";
				this.buildValueInput(input, "highlightTemplateInternalPDFs");
			});

		containerEl.createEl("h4", { text: "Structure settings" });
		new Setting(containerEl)
			.setName("Use structuring headlines")
			.setDesc(
				"If disabled, no structuring headlines will be shown. Just the annotations in the specified template style."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useStructuringHeadlines)
					.onChange((value) => {
						this.plugin.settings.useStructuringHeadlines = value;
						this.plugin.saveData(this.plugin.settings);
					})
			);

		new Setting(containerEl)
			.setName("Use Folder Name")
			.setDesc(
				"If enabled, uses the PDF's folder name (instead of the PDF-Filename) for sorting"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useFolderNames)
					.onChange((value) => {
						this.plugin.settings.useFolderNames = value;
						this.plugin.saveData(this.plugin.settings);
					})
			);

		new Setting(containerEl)
			.setName("Sort by Topic")
			.setDesc(
				"If enabled, uses the notes first line as Topic for primary sorting"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.sortByTopic)
					.onChange((value) => {
						this.plugin.settings.sortByTopic = value;
						this.plugin.saveData(this.plugin.settings);
					})
			);

		containerEl.createEl("h3", {
			text: "Settings for `Extract PDF Annotations on single file`",
		});
		new Setting(containerEl)
			.setName("Notes export path")
			.setDesc(
				"The path to which the notes, including the extracted annotations, will be exported. The path can be dynamic './' to create a note next to the PDF or it has to be relative to the vault root. Paths must end with a '/'. Leave blank to export to the vault root."
			)
			.addText((input) => this.buildValueInput(input, "exportPath"));
		new Setting(containerEl)
			.setName("Notes export name")
			.setDesc(
				"The name of the note to which the notes, including the extracted annotations, will be exported. You can use the variable '{{filename}}' to use the PDF's filename and combine it with prefix or suffix. If you don't use the variable all notes will be exported to the same file until you change the name."
			)
			.addText((input) => this.buildValueInput(input, "exportName"));
		new Setting(containerEl)
			.setName("One note per annotation")
			.setDesc(
				"If enabled, every annotation is exported to a separate note."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.oneNotePerAnnotation)
					.onChange((value) => {
						this.plugin.settings.oneNotePerAnnotation = value;
						oneNotePerAnnotationExportName.settingEl.style.display = value ? "block" : "none";
						this.plugin.saveData(this.plugin.settings);
					})
			);
		const oneNotePerAnnotationExportName = new Setting(containerEl)
			.setName("One note per annotation - export name")
			.setDesc(
				"The name of the notes to which each extracted annotation will be exported. You can use the variable '{{filename}}' to use the PDF's filename and combine it with prefix or suffix. Additionally you should use the variable '{{counter}}' to add the index of the exported annotation."
			)
			.addText((input) => this.buildValueInput(input, "oneNotePerAnnotationExportName"));
		oneNotePerAnnotationExportName.settingEl.style.display = this.plugin.settings.oneNotePerAnnotation ? "block" : "none";
	}
}
