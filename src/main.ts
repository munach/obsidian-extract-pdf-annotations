// npm install obsidian
// npm install color-convert
//
// To run:
//      npm install -g typescript
//      npm install --save-dev @types/codemirror @types/dom-to-image @types/estree @types/node @types/randomcolor @types/resolve @types/tern
//      npm run build


import {
	compile as compileTemplate,
	TemplateDelegate as Template
} from 'handlebars';
import { Editor, FileSystemAdapter, loadPdfJs, MarkdownView, Plugin, TFile, Vault } from 'obsidian';
import convert from 'color-convert';    // For color conversion

// Local modules
import { loadPDFFile } from 'src/extractHighlight';
import { saveDataToFile } from 'src/saveToFile';
import { PDFAnnotationPluginSetting, PDFAnnotationPluginSettingTab } from 'src/settings';
import { IIndexable, PDFFile } from 'src/types';



// Formatting
const title_lvl1 = "##### ";
const lvl2_prefix = "- ";
const lvl3_prefix = "	- ";
const sumr_prefix = "- ";
const impt_prefix = "- ";


function getColorName(i_RGB: number[])
{
    let l_HSL = convert.rgb.hsl(i_RGB);
    let l_hue = l_HSL[0];
    let l_return = "";

    if( (l_hue  <= 20) )
    { l_return = "Red"; }
    else if (   (l_hue >   20)  &&
                (l_hue <=  55)  )
    { l_return = "Orange"; }
    else if (   (l_hue >   55)  &&
                (l_hue <=  70)  )
    { l_return = "Yellow"; }
    else if (   (l_hue >   70)   &&
                (l_hue <= 160)   )
    { l_return = "Green"; }
    else if (   (l_hue >  160)   &&
                (l_hue <= 195)   )
    { l_return = "Cyan"; }
    else if (   (l_hue >  195)   &&
                (l_hue <= 240)   )
    { l_return = "Blue"; }
    else if (   (l_hue >  240)   &&
                (l_hue <= 270)   )
    { l_return = "Indigo"; }
    else if (   (l_hue >  270)   &&
                (l_hue <= 300)   )
    { l_return = "Violet"; }
    else if (   (l_hue >  300)   &&
                (l_hue <= 330)   )
    { l_return = "Magenta"; }
    else
    { l_return = "Red"; }

    return l_return;
}



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


	format(grandtotal, i_isForMindmap: boolean, i_isForExtMindmap: boolean, i_isGetNrml: boolean, i_isGetLow: boolean, isExternalFile) {
        // Args:
        // grandtotal:          list of annotations
        // i_isForMindmap:      true if extraction for Obsidian's mindmap
        // i_isForExtMindmap:   true if extraction for an external mindmap (FreeMind, ...)
        // i_isGetNrml:         true if extraction of normal priority infos (yellow)
        // i_isGetLow:          true if extraction of low    priority infos (light blue)
        // isExternalFile 		true if the PDF file's path to extract annotations from is indicated in the clipboard

		// now iterate over the annotations printing topics, then folder, then comments...
		let text = ''
		let topic = ''
        if (i_isForMindmap == false) { var text_dt = ''; }
        let text_cd         = '';
        //let text_3 = '';
        let currentFileName = '';
		//let currentFolder = ''
        let currentFolderName = "";
        //let currentFullPath = "";
        let l_pageNumber    = 0;
        // let l_previousLevel = "";
        let l_isPrevBullet  = false;
        let color_lvl1      = convert.rgb.hsl(this.settings.level1RGB);
        let color_lvl2      = convert.rgb.hsl(this.settings.level2RGB);
        let color_lvl3      = convert.rgb.hsl(this.settings.level3RGB);
        let color_sumr      = convert.rgb.hsl(this.settings.summryRGB);
        let color_impt      = convert.rgb.hsl(this.settings.imprttRGB);
        let color_lvl1Hue   = color_lvl1[0];
        let color_lvl2Hue   = color_lvl2[0];
        let color_lvl3Hue   = color_lvl3[0];
        let color_sumrHue   = color_sumr[0];
        let color_imptHue   = color_impt[0];
        let color_lvl1Lum   = color_lvl1[2];
        let color_lvl2Lum   = color_lvl2[2];
        let color_lvl3Lum   = color_lvl3[2];
        let color_sumrLum   = color_sumr[2];
        let color_imptLum   = color_impt[2];
        let color_maxHue    = 360;
        let color_maxLum    = 100;
        let lvl1_format     = this.settings.lvl1_format;
        let lvl2_format     = this.settings.lvl2_format;
        let lvl3_format     = this.settings.lvl3_format;
        let sumr_format     = this.settings.sumr_format;
        let impt_format     = this.settings.impt_format;
        let note_format     = this.settings.note_format;
        let note_preamb     = this.settings.note_preamb+" ";
        let lvl1_icon       = this.settings.lvl1_icon+" ";
        let lvl2_icon       = this.settings.lvl2_icon+" ";
        let lvl3_icon       = this.settings.lvl3_icon+" ";
        let sumr_icon       = this.settings.sumr_icon+" ";
        let impt_icon       = this.settings.impt_icon+" ";
        let ext_lvl1_icon   = this.settings.ext_lvl1_icon+" ";
        let ext_lvl2_icon   = this.settings.ext_lvl2_icon+" ";
        let ext_lvl3_icon   = this.settings.ext_lvl3_icon+" ";
        let ext_sumr_icon   = this.settings.ext_sumr_icon+" ";
        let ext_impt_icon   = this.settings.ext_impt_icon+" ";
        let unkn_icon       = this.settings.unkn_icon+" ";

        let l_levelPrefix = "";
        let l_levelFormat = "";
        let l_levelIcon = "";
        let l_annoToReport = true;
        let l_title_lvl1 = "\n"+title_lvl1;
        let l_note_sfx = "";

        let l_lvl2_prefix = lvl2_prefix;
        let l_lvl3_prefix = lvl3_prefix;
        let l_sumr_prefix = sumr_prefix;
        let l_impt_prefix = impt_prefix;
        if (i_isForExtMindmap) {
            l_title_lvl1  = "\n"
            l_lvl2_prefix = "	" + lvl2_prefix.substring(0, lvl2_prefix.length - 2);
            l_lvl3_prefix = "	" + lvl3_prefix.substring(0, lvl3_prefix.length - 2);
            l_sumr_prefix = "	" + sumr_prefix.substring(0, sumr_prefix.length - 2);
            l_impt_prefix = "	" + impt_prefix.substring(0, impt_prefix.length - 2);
        }

		// console.log("all annots", grandtotal)


        if (i_isForMindmap) {// Mindmap format
            text = `---

mindmap-plugin: basic

---
`;
        }
        else {// Not Mindmap format
            // Get date and time:
            const l_date = new Date();
            const l_day = String(l_date.getDate()).padStart(2, '0');
            const l_month = String(l_date.getMonth() + 1).padStart(2, '0');
            const l_year = String(l_date.getFullYear());
            const l_hours = String(l_date.getHours()).padStart(2, '0');
            const l_minutes = String(l_date.getMinutes()).padStart(2, '0');
            const l_dateTime = `${l_year}/${l_month}/${l_day} ${l_hours}:${l_minutes}`

            // Set beginning of file
            text = this.settings.begin_prb.replace('{dateTime}', l_dateTime);
        }


		grandtotal.forEach((a) => {
            // PROCESS EACH ANNOTATION

			// print main Title when Topic changes (and settings allow)
			if (this.settings.useStructuringHeadlines) {
				// ➡️ Structuring headlines will be shown

				if (this.settings.sortByTopic) {
					if (topic != a.topic) {
						topic = a.topic
                    currentFileName = ''
                    //text += `# ${topic}\n`
                    text += `\n# ${topic}\n`;
					}
				}

	            // FILE PREAMBLE: Create preamble in case the the file/folder name changes
				if (this.settings.useFolderNames) {
	                if (currentFileName != a.folder) {
	                    currentFileName = a.file.name;
	                    currentFolderName = a.folder;
	                    if(i_isForExtMindmap == true) {
	                        text += "\n**Reference :** [[" + currentFileName + "]]\n\n\n---\n";
	                    }
	                    else if (i_isForMindmap == false) {
	                        text += this.settings.pdf_f_prb.replace("{fileName}",currentFileName);

	                    }
	                    else {
	                        text += "### [[" + currentFileName + "]]\n";
	                        if(this.settings.mm_preamb)
	                        { text += "#### _\n"; }
	                    }
					}
				} else {
	                if (currentFileName != a.file.name) {
	                    currentFileName = a.file.name;
	                    currentFolderName = a.folder;
	                    if(i_isForExtMindmap == true) {
	                        text += "\n**Reference :** [[" + currentFileName + "]]\n\n\n";
	                    }
	                    else if (i_isForMindmap == false) {
	                        text += this.settings.pdf_f_prb.replace("{fileName}",currentFileName);
	                    }
	                    else {
	                        text += "### [[" + currentFileName + "]]\n";
	                        if(this.settings.mm_preamb)
	                        { text += "#### _\n"; }
						}
					}
				}
			}


			// ➡️ PAGE NB: Add page number if needed
			if ((l_pageNumber != a.pageNumber) && (i_isForMindmap == false) && (i_isForExtMindmap == false))
			{// Annotations on a different page
				text_dt += "\n#### Page " + a.pageNumber + "\n";
				l_pageNumber = a.pageNumber;
				// In case of a page change, do not add a line before a level 1 title
				l_title_lvl1 = title_lvl1;
			}
			//else: Same page, nothing to do


			// ➡️ COLORS: Set variables depending on color
				// Get current annotation's color hue & lumi
			let annotColor    = convert.rgb.hsl(a.color);
			let annotColorHue = annotColor[0];
			let annotColorLum = annotColor[2];
			l_note_sfx        = ""

				// Test if current annotation is recognized
			l_annoToReport = true;
			if( (Math.abs((100*(annotColorHue-color_lvl1Hue))/color_maxHue) <= this.settings.hueTol)  &&
				(Math.abs((100*(annotColorLum-color_lvl1Lum))/color_maxLum) <= this.settings.LumiTol) )
			{// Color for LEVEL 1
				l_levelPrefix = l_title_lvl1;
				//l_previousLevel = lvl2_prefix;
				l_isPrevBullet = false;
				l_levelFormat = lvl1_format;
				if (i_isForExtMindmap == false)
				{   l_levelIcon = lvl1_icon; }
				else {
					l_levelIcon = ext_lvl1_icon;
					l_note_sfx  = " (p." + a.pageNumber + ")";
				}
			}
			else if( (Math.abs((100*(annotColorHue-color_lvl2Hue))/color_maxHue) <= this.settings.hueTol)  &&
						(Math.abs((100*(annotColorLum-color_lvl2Lum))/color_maxLum) <= this.settings.LumiTol) )
			{// Color for LEVEL 2
				if (i_isGetNrml) {// Annotation to report
					l_levelPrefix = l_lvl2_prefix;
					// l_previousLevel = l_levelPrefix;
					l_isPrevBullet = true;
					l_levelFormat = lvl2_format;
					if (i_isForExtMindmap == false)
					{   l_levelIcon = lvl2_icon; }
					else
					{   l_levelIcon = ext_lvl2_icon; }
				}
				else { l_annoToReport = false; }
			}
			else if( (Math.abs((100*(annotColorHue-color_lvl3Hue))/color_maxHue) <= this.settings.hueTol)  &&
						(Math.abs((100*(annotColorLum-color_lvl3Lum))/color_maxLum) <= this.settings.LumiTol) )
			{// Color for LEVEL 3
				if (i_isGetLow) {// Annotation to report
					l_levelPrefix = l_lvl3_prefix;
					// l_previousLevel = l_levelPrefix;
					if (l_isPrevBullet == false) {// We have a bullet level 2 but there was no level 1: Add one
						text_cd += l_lvl2_prefix + "_{Low importance} :_\n";
					}
					l_isPrevBullet = true;
					l_levelFormat = lvl3_format;
					if (i_isForExtMindmap == false)
					{   l_levelIcon = lvl3_icon; }
					else
					{   l_levelIcon = ext_lvl3_icon; }
				}
				else { l_annoToReport = false; }
			}
			else if( (Math.abs((100*(annotColorHue-color_sumrHue))/color_maxHue) <= this.settings.hueTol)  &&
						(Math.abs((100*(annotColorLum-color_sumrLum))/color_maxLum) <= this.settings.LumiTol) )
			{// Color for SUMMARY
				//l_levelPrefix = l_previousLevel;
				l_levelPrefix = l_sumr_prefix;
				// l_previousLevel = l_levelPrefix;
				l_isPrevBullet = true;
				l_levelFormat = sumr_format;
				if (i_isForExtMindmap == false)
				{   l_levelIcon = sumr_icon; }
				else
				{   l_levelIcon = ext_sumr_icon; }
			}
			else if( (Math.abs((100*(annotColorHue-color_imptHue))/color_maxHue) <= this.settings.hueTol)  &&
						(Math.abs((100*(annotColorLum-color_imptLum))/color_maxLum) <= this.settings.LumiTol) )
			{// Color for IMPORTANT ANNOTATION
				//l_levelPrefix = l_previousLevel;
				l_levelPrefix = l_impt_prefix;
				// l_previousLevel = l_levelPrefix;
				l_isPrevBullet = true;
				l_levelFormat = impt_format;
				if (i_isForExtMindmap == false)
				{   l_levelIcon = impt_icon; }
				else
				{   l_levelIcon = ext_impt_icon; }
			}
			else {// UNKNOWN color
				if (i_isGetNrml && i_isGetLow) {// Annotation to report
					l_levelPrefix = "- ";
					// l_previousLevel = l_levelPrefix;
					l_isPrevBullet = true;
					l_levelIcon = unkn_icon;
					// No level format
				}
				else { l_annoToReport = false; }
			}


			// ➡️ ANNOTATION: Add current annotation to detailed/condensed strings
			if (l_annoToReport) {// Annotation to report
				let l_details = "";
				if (a.subtype == 'Text') {  // ▶️ Annotation: Note
					if (isExternalFile) {
						l_details = this.getContentForNoteFromExternalPDF(a)
					} else {
						l_details = this.getContentForNoteFromInternalPDF(a)
					}
				} else {                    // ▶️ Annotation: Highlight or underline
					if (isExternalFile) {
						l_details = this.getContentForHighlightFromExternalPDF(a)
					} else {
						l_details = this.getContentForHighlightFromInternalPDF(a)
					}
				}

				// ▶️ Remove leading whitespace / new line
				while ((l_details.substring(0, 1) == " ") || (l_details.substring(0, 1) == "\n"))
				{   l_details = l_details.substring(1); }
				// ▶️ Remove trailing whitespace / new line
				while ((l_details.substring(l_details.length - 1) == " ") || (l_details.substring(l_details.length - 1) == "\n"))
				{   l_details = l_details.substring(0, l_details.length - 1); }

				// ▶️ Replace carriage returns (\r or \n)
				if(i_isForExtMindmap == false) {
					// Replace by <br>
					// Note: doesn't work with l_details.replace('\r',"<br>")
					// l_details.replace('\r',"<br>");
					// l_details.replace('\n',"<br>");
					if( (l_details.includes('\r'))  ||
						(l_details.includes('\n'))  )
					{// There is/are carriage return(s)
						// Replace \r
						let l_note = l_details.split('\r');
						l_details = "";
						for (let i = 0; i < l_note.length; i++) {
							l_details += l_note[i];
							if(i < l_note.length-1)
							{   l_details += "<br>"; }
						}
						// Replace \n
						l_note = l_details.split('\n');
						l_details = "";
						for (let i = 0; i < l_note.length; i++) {
							l_details += l_note[i];
							if(i < l_note.length-1)
							{   l_details += "<br>"; }
						}
					}
				}

				// ▶️ Level 1 -> Title: do not set a format (except italics for a Note)
				if (l_levelPrefix == l_title_lvl1) {
					if ((i_isForMindmap == false) && (i_isForExtMindmap == false))
					{   text_dt += l_title_lvl1; }
					if(i_isForExtMindmap)
					{   text_cd += l_title_lvl1;}
					else
					{   text_cd += '\n'+title_lvl1; }

					// Highlight, and not text(=Note)
					if (a.subtype != 'Text')
					{   l_levelFormat = ""; }
				}
				else {// ▶️ Not level 1
					if ((i_isForMindmap == false) && (i_isForExtMindmap == false))
					{   text_dt += "> "; }

					/*if (a.subtype == 'Text')    // Note
					{   text_cd += "- "; }
					else                        // Highlight, and not text(=Note)*/
					{   text_cd += l_levelPrefix; }
				}

                if (a.subtype == 'Text') {  // ▶️ Note
                    if ((i_isForMindmap == false) && (i_isForExtMindmap == false))
                    {   text_dt += l_levelFormat + note_preamb + note_format + l_levelIcon + l_details + note_format + l_levelFormat + l_note_sfx + "\n"; }
                    if((i_isForExtMindmap == false))
                    {   text_cd += l_levelFormat + note_preamb + note_format + l_levelIcon + l_details + note_format + l_levelFormat + l_note_sfx + "\n";}
                    else
                    {   text_cd += note_preamb + l_levelIcon + l_details + l_note_sfx + "\n";}
                } else {                    // ▶️ Annotation: Highlight or underline
                    if (i_isForMindmap == false)
                    {   text_dt += l_levelIcon + l_levelFormat + l_details + l_levelFormat + l_note_sfx + "\n"; }
                    if((i_isForExtMindmap == false))
                    {   text_cd     += l_levelIcon + l_levelFormat + l_details + l_levelFormat + l_note_sfx + "\n"; }
                    else
                    {   text_cd     += l_levelIcon + l_details + l_note_sfx + "\n"; }
                }
            }
            // else: Not an annotation to report
        })// End of each annotation process


        // Formatting presentation:
        let l_FormattageText = "";
        // Add current annotation to global string
        if (i_isForExtMindmap) {
            l_FormattageText += "## Format\n";
            l_FormattageText += l_title_lvl1  + ext_lvl1_icon + " Level 1 ("        + getColorName(this.settings.level1RGB) + ")"  + "\n";
            l_FormattageText += l_lvl2_prefix + ext_lvl2_icon + " Level 2 ("        + getColorName(this.settings.level2RGB) + ")"  + "\n";
            l_FormattageText += l_lvl3_prefix + ext_lvl3_icon + " Level 3 ("        + getColorName(this.settings.level3RGB) + ")"  + "\n";
            l_FormattageText += l_sumr_prefix + ext_sumr_icon + "Special level 1 (" + getColorName(this.settings.summryRGB) + ")"  + "\n";
            l_FormattageText += l_impt_prefix + ext_impt_icon + "Special level 2 (" + getColorName(this.settings.imprttRGB) + ")"  + "\n";

            l_FormattageText += "\n\n---\n## Notes\n"

            text += l_FormattageText;
        }
        else if (i_isForMindmap == false) {
            //if (i_isForMindmap) { l_FormattageText += "##"; }
            l_FormattageText += "## Format\n";
            l_FormattageText += l_title_lvl1  + lvl1_icon + lvl1_format + " Level 1 ("        + getColorName(this.settings.level1RGB) + ")" + lvl1_format + "\n";
            l_FormattageText += l_lvl2_prefix + lvl2_icon + lvl2_format + " Level 2 ("        + getColorName(this.settings.level2RGB) + ")" + lvl2_format + "\n";
            l_FormattageText += l_lvl3_prefix + lvl3_icon + lvl3_format + " Level 3 ("        + getColorName(this.settings.level3RGB) + ")" + lvl3_format + "\n";
            l_FormattageText += l_sumr_prefix + sumr_icon + sumr_format + "Special level 1 (" + getColorName(this.settings.summryRGB) + ")" + sumr_format + "\n";
            l_FormattageText += l_impt_prefix + impt_icon + impt_format + "Special level 2 (" + getColorName(this.settings.imprttRGB) + ")" + impt_format + "\n";

            l_FormattageText +=             note_preamb + note_format + "Note content"      +                                               note_format + "\n";

            //if (i_isForMindmap == false) {
                text += l_FormattageText;
            //}
        }

        if ((i_isForMindmap == false) && (i_isForExtMindmap == false)) {
            text += "\n\n---\n## Annotations\n";
            text += this.settings.perso_prb + "\n"
            text += "[[" + currentFileName + "]]\n- \n\n\n---\n";
            text += this.settings.conds_prb + "\n";
            text += "[[" + currentFileName + "]]\n";

            text += "#### PDF annotations\n";
        }

        text += text_cd;
        if ((i_isForMindmap == false) && (i_isForExtMindmap == false)) {
            text += "\n\n\n---\n" + this.settings.detal_prb + "\n";
            text += "[[" + currentFileName + "]]\n";
            text += text_dt;
        }

        if (grandtotal.length == 0) {
            return ("\n" + this.settings.no_an_prb + "\n");
        }
        else return text;
    } // end of format(grandtotal, ...)


    // Function when called from a PDF file
	async loadSinglePDFFile(file: TFile) {
		const pdfjsLib = await loadPdfJs()
		const containingFolder = file.parent.name;
		const grandtotal = [] // array that will contain all fetched Annotations
		console.log('loading from file ', file)
		const content = await this.app.vault.readBinary(file)
		await loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), this.settings.page_min, this.settings.page_max, pdfjsLib, containingFolder, grandtotal)
		this.sort(grandtotal)

        // Get file name
		//let filePath = file.name.replace(".pdf", ".md");
		let filePath = file.path.replace(".pdf", "");
		// filePath = "Annotations for " + filePath;


		// TODO: Add page number processed


        // First file: detailed & condensed versions
            // File name
        let l_fileName_1 = filePath + ".md";
            // Generate annotations
        let finalMarkdown = this.format(grandtotal, false, false, true, true, false)
            // Save annotations in file
        await saveDataToFile(l_fileName_1, finalMarkdown);
            // Open file
        await this.app.workspace.openLinkText(l_fileName_1, '', true);

        // Second file: Obsidian mindmap, full version
        if(this.settings.mm_fl_tog) {
            let l_fileName_2 = filePath + " " + this.settings.mm_fl_suf + ".md";
            finalMarkdown = this.format(grandtotal, true, false, true, true, false)
            await saveDataToFile(l_fileName_2, finalMarkdown);
            await this.app.workspace.openLinkText(l_fileName_2, '', true);
        }

        // Third file: Obsidian mindmap, essentials version
        if(this.settings.mm_es_tog) {
            //let l_fileName_3 = filePath + " (mindmap essential).md";
            let l_fileName_3 = filePath + " " + this.settings.mm_es_suf + ".md";
            finalMarkdown = this.format(grandtotal, true, false, false, false, false)
            await saveDataToFile(l_fileName_3, finalMarkdown);
            await this.app.workspace.openLinkText(l_fileName_3, '', true);
        }

        // Fourth file: External mindmap, full version
        if(this.settings.ext_fl_tog) {
            let l_fileName_4 = filePath + " " + this.settings.ext_fl_suf + ".md";
            finalMarkdown = this.format(grandtotal, false, true, true, true, false)
            await saveDataToFile(l_fileName_4, finalMarkdown);
            await this.app.workspace.openLinkText(l_fileName_4, '', true);
        }

        // Fifth file: External mindmap, essentials version
        if(this.settings.ext_es_tog) {
            let l_fileName_5 = filePath + " " + this.settings.ext_es_suf + ".md";
            finalMarkdown = this.format(grandtotal, false, true, false, false, false)
            await saveDataToFile(l_fileName_5, finalMarkdown);
            await this.app.workspace.openLinkText(l_fileName_5, '', true);
        }

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
				await loadPDFFile(file, this.settings.page_min, this.settings.page_max, pdfjsLib, containingFolder, grandtotal)
			} else {
				console.log('Data in clipboard is no file.');
			}
		} catch (error) {
			console.log('Data in clipboard could not be read as filepath.');
			console.error(error);
		}
		return grandtotal;
	}


    // Function when plugin is loaded
	async onload() {
		this.loadSettings();
		this.addSettingTab(new PDFAnnotationPluginSettingTab(this.app, this));


        // Command when called from a PDF file
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


		// Command when the PDF path is in the clipboard


		// TODO: Same process as loadSinglePDFFile


		this.addCommand({
			id: 'extract-annotations-single-from-clipboard-path',
			name: 'Extract PDF Annotations on single file from path in clipboard',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const clipText = await navigator.clipboard.readText()
				const grandtotal = await this.loadAnnotationsFromSinglePDFFileFromClipboardPath(clipText)
				this.sort(grandtotal)
				editor.replaceSelection(this.format(grandtotal, false, false, true, true, false))
			}
		})


        // Command when called from a md file:
        // Annotation as detailed & condensed formats
		this.addCommand({
			id: 'extract-annotations',
			name: 'Extract PDF Annotations',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const file = this.app.workspace.getActiveFile()
				if (file == null) return
				const folder = file.parent
				const grandtotal = [] // array that will contain all fetched Annotations

				const pdfjsLib = await loadPdfJs()
				// editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

				const promises = [] // when all Promises will be resolved.

				Vault.recurseChildren(folder, async (file) => {
					// visit all Childern of parent folder of current active File
					if (file instanceof TFile) {
						if (file.extension === 'pdf') {
                            promises.push(
                            	this.app.vault.readBinary(file).then((content) =>
                            		loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), this.settings.page_min, this.settings.page_max, pdfjsLib, file.parent.name, grandtotal))
							)
						}
					}
				})
				await Promise.all(promises)
				this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, false, false, true, true, false))
			}
		})
        // Command when called from a md file:
        // Annotation as mindmap format
        this.addCommand({
            id: 'extract-annotations-mindmap',
            name: 'Extract PDF Annotations (Obsidian\'s mindmap format)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()
				// editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

                const promises = [] // when all Promises will be resolved.

                Vault.recurseChildren(folder, async (file) => {
                    // visit all Childern of parent folder of current active File
                    if (file instanceof TFile) {
                        if (file.extension === 'pdf') {
                            promises.push(
                            	this.app.vault.readBinary(file).then((content) =>
                            		loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), this.settings.page_min, this.settings.page_max, pdfjsLib, file.parent.name, grandtotal))
							)
                        }
                    }
                })
                await Promise.all(promises)
                this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, true, false, true, true, false))
            }
        })


        // Command when called from a md file:
        // Annotation as mindmap format
        this.addCommand({
            id: 'extract-annotations-mindmap',
            name: 'Extract PDF Annotations (External mindmap format)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()
				// editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

                const promises = [] // when all Promises will be resolved.

                Vault.recurseChildren(folder, async (file) => {
                    // visit all Childern of parent folder of current active File
					if (file instanceof TFile) {
						if (file.extension === 'pdf') {
                            promises.push(
                            	this.app.vault.readBinary(file).then((content) =>
                            		loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), this.settings.page_min, this.settings.page_max, pdfjsLib, file.parent.name, grandtotal))
							)
						}
					}
                })
                await Promise.all(promises)
                this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, false, true, true, true, false))
            }
        })


        // Command when called from a md file:
        // Annotation as mindmap format only for summary & important annot.
        this.addCommand({
            id: 'extract-annotations-mindmap-summary-important',
            name: 'Extract PDF Annotations (Obsidian\'s mindmap format, summary & important only)',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const file = this.app.workspace.getActiveFile()
                if (file == null) return
                const folder = file.parent
                const grandtotal = [] // array that will contain all fetched Annotations

                const pdfjsLib = await loadPdfJs()
				// editor.replaceSelection('Extracting PDF Comments from ' + folder.name + '\n')

                const promises = [] // when all Promises will be resolved.

                Vault.recurseChildren(folder, async (file) => {
                    // visit all Childern of parent folder of current active File
                    if (file instanceof TFile) {
                        if (file.extension === 'pdf') {
                            promises.push(
                            	this.app.vault.readBinary(file).then((content) =>
                            		loadPDFFile(PDFFile.convertTFileToPDFFile(file, content), this.settings.page_min, this.settings.page_max, pdfjsLib, file.parent.name, grandtotal))
							)
                        }
                    }
                })
                await Promise.all(promises)
                this.sort(grandtotal)
                editor.replaceSelection(this.format(grandtotal, true, false, false, false, false))
            }


        })
	}


    // Load settings from settings pane
	loadSettings() {
		this.settings = new PDFAnnotationPluginSetting();
		(async () => {
			const loadedSettings = await this.loadData();
			if (loadedSettings) {
				const toLoad = [
					'useStructuringHeadlines',
					'useFolderNames',
					'sortByTopic',
					'noteTemplateExternalPDFs',
					'noteTemplateInternalPDFs',
					'highlightTemplateExternalPDFs',
					'highlightTemplateInternalPDFs',
					'page_min',
					'page_max',
					'level1RGB',
					'level2RGB',
					'level3RGB',
					'summryRGB',
					'imprttRGB',
					'hueTol',
					'LumiTol',
					'lvl1_format',
					'lvl2_format',
					'lvl3_format',
					'sumr_format',
					'impt_format',
					'note_format',
					'note_preamb',
					'lvl1_icon',
					'lvl2_icon',
					'lvl3_icon',
					'sumr_icon',
					'impt_icon',
					'ext_lvl1_icon',
					'ext_lvl2_icon',
					'ext_lvl3_icon',
					'ext_sumr_icon',
					'ext_impt_icon',
					'unkn_icon',
					'begin_prb',
					'pdf_f_prb',
					'perso_prb',
					'conds_prb',
					'detal_prb',
					'no_an_prb',
					'mm_preamb',
					'mm_fl_tog',
					'mm_fl_suf',
					'mm_es_tog',
					'mm_es_suf',
					'ext_fl_tog',
					'ext_fl_suf',
					'ext_es_tog',
					'ext_es_suf'
				];
				toLoad.forEach((setting) => {
					if (setting in loadedSettings) {
						(this.settings as IIndexable)[setting] = loadedSettings[setting];
					}
				});
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
