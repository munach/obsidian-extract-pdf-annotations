import {
	compile as compileTemplate,
	TemplateDelegate as Template,
} from "handlebars";
import {
	ANNOTS_TREATED_AS_HIGHLIGHTS,
	PDFAnnotationPluginSetting,
} from "./settings";

export class PDFAnnotationPluginFormatter {
	private settings: PDFAnnotationPluginSetting;

	// Template compilation options
	private templateSettings = {
		noEscape: true,
	};

	constructor(settings: PDFAnnotationPluginSetting) {
		this.settings = settings;
	}

	format(grandtotal, isExternalFile) {
		// now iterate over the annotations printing topics, then folder, then comments...
		let text = "";
		let topic = "";
		let currentFolder = "";
		// console.log("all annots", grandtotal)
		grandtotal.forEach((anno) => {
			// print main Title when Topic changes (and settings allow)
			if (this.settings.useStructuringHeadlines) {
				if (this.settings.sortByTopic) {
					if (topic != anno.topic) {
						topic = anno.topic;
						currentFolder = "";
						text += `# ${topic}\n`;
					}
				}

				if (this.settings.useFolderNames) {
					if (currentFolder != anno.folder) {
						currentFolder = anno.folder;
						text += `## ${currentFolder}\n`;
					}
				} else {
					if (currentFolder != anno.file.name) {
						currentFolder = anno.file.name;
						text += `## ${currentFolder}\n`;
					}
				}
			}

			if (ANNOTS_TREATED_AS_HIGHLIGHTS.includes(anno.subtype)) {
				if (isExternalFile) {
					text += this.getContentForHighlightFromExternalPDF(anno);
				} else {
					text += this.getContentForHighlightFromInternalPDF(anno);
				}
			} else {
				if (isExternalFile) {
					text += this.getContentForNoteFromExternalPDF(anno);
				} else {
					text += this.getContentForNoteFromInternalPDF(anno);
				}
			}
		});

		if (grandtotal.length == 0) return "*No Annotations*";
		else return text;
	}

	get noteFromExternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.noteTemplateExternalPDFs,
			this.templateSettings
		);
	}

	get noteFromInternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.noteTemplateInternalPDFs,
			this.templateSettings
		);
	}

	get highlightFromExternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.highlightTemplateExternalPDFs,
			this.templateSettings
		);
	}

	get highlightFromInternalPDFsTemplate(): Template {
		return compileTemplate(
			this.settings.highlightTemplateInternalPDFs,
			this.templateSettings
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
			body: annotation.body,
		};

		return { annotation: annotation, ...shortcuts };
	}

	getContentForNoteFromExternalPDF(annotation: any): string {
		return this.noteFromExternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation)
		);
	}

	getContentForNoteFromInternalPDF(annotation: any): string {
		return this.noteFromInternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation)
		);
	}

	getContentForHighlightFromExternalPDF(annotation: any): string {
		return this.highlightFromExternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation)
		);
	}

	getContentForHighlightFromInternalPDF(annotation: any): string {
		return this.highlightFromInternalPDFsTemplate(
			this.getTemplateVariablesForAnnotation(annotation)
		);
	}
}
