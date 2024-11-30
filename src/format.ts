import convert from "color-convert"; // For color conversion
import { ANNOTS_TREATED_AS_HIGHLIGHTS } from "src/settings";

const TITLE_LVL1 = "##### ";
const LVL2_PREFIX = "- ";
const LVL3_PREFIX = "\t- ";
const SUMR_PREFIX = "- ";
const IMPT_PREFIX = "- ";

function getColorName(rgb: number[]) {
	const hue = convert.rgb.hsl(rgb)[0];
	let colorName = "";
	if (hue <= 20) {
		colorName = "Red";
	} else if (hue > 20 && hue <= 55) {
		colorName = "Orange";
	} else if (hue > 55 && hue <= 70) {
		colorName = "Yellow";
	} else if (hue > 70 && hue <= 160) {
		colorName = "Green";
	} else if (hue > 160 && hue <= 195) {
		colorName = "Cyan";
	} else if (hue > 195 && hue <= 240) {
		colorName = "Blue";
	} else if (hue > 240 && hue <= 270) {
		colorName = "Indigo";
	} else if (hue > 270 && hue <= 300) {
		colorName = "Violet";
	} else if (hue > 300 && hue <= 330) {
		colorName = "Magenta";
	} else {
		colorName = "Red";
	}
	return colorName;
}

function buildPreamble(currentFileName): string {
    const lvl1_format = this.settings.lvl1_format;
    const lvl2_format = this.settings.lvl2_format;
    const lvl3_format = this.settings.lvl3_format;
    const sumr_format = this.settings.sumr_format;
    const impt_format = this.settings.impt_format;
    const note_format = this.settings.note_format;
    const note_preamb = this.settings.note_preamb + " ";
    const lvl1_icon = this.settings.lvl1_icon + " ";
    const lvl2_icon = this.settings.lvl2_icon + " ";
    const lvl3_icon = this.settings.lvl3_icon + " ";
    const sumr_icon = this.settings.sumr_icon + " ";
    const impt_icon = this.settings.impt_icon + " ";

    const l_title_lvl1 = "\n" + TITLE_LVL1;
    const l_lvl2_prefix = LVL2_PREFIX;
    const l_lvl3_prefix = LVL3_PREFIX;
    const l_sumr_prefix = SUMR_PREFIX;
    const l_impt_prefix = IMPT_PREFIX;

    let text = "";

    // ▶️ File preamble:
    //TODO: Fix for multiple files -> Use folder name
    text += "### [[" + currentFileName + "]]\n";

    // ▶️ Formatting presentation:
    let l_FormattageText = "";
    // Add current annotation to global string
    l_FormattageText += "## Format\n";
    l_FormattageText +=
        l_title_lvl1 +
        lvl1_icon +
        lvl1_format +
        " Level 1 (" +
        getColorName(this.settings.level1RGB) +
        ")" +
        lvl1_format +
        "\n";
    l_FormattageText +=
        l_lvl2_prefix +
        lvl2_icon +
        lvl2_format +
        " Level 2 (" +
        getColorName(this.settings.level2RGB) +
        ")" +
        lvl2_format +
        "\n";
    l_FormattageText +=
        l_lvl3_prefix +
        lvl3_icon +
        lvl3_format +
        " Level 3 (" +
        getColorName(this.settings.level3RGB) +
        ")" +
        lvl3_format +
        "\n";
    l_FormattageText +=
        l_sumr_prefix +
        sumr_icon +
        sumr_format +
        "Special level 1 (" +
        getColorName(this.settings.summryRGB) +
        ")" +
        sumr_format +
        "\n";
    l_FormattageText +=
        l_impt_prefix +
        impt_icon +
        impt_format +
        "Special level 2 (" +
        getColorName(this.settings.imprttRGB) +
        ")" +
        impt_format +
        "\n";

    l_FormattageText +=
        note_preamb + note_format + "Note content" + note_format + "\n";

    text += l_FormattageText;

    return text;
}

function buildAnnotations(
    currentFileName: string,
    text_cd: string,
    text_dt: string
): string {
    let text = "";

    // Add annotations data
    text += "\n\n---\n## Annotations\n";
    text += this.settings.perso_prb + "\n";
    text += "[[" + currentFileName + "]]\n- \n\n\n---\n";
    text += this.settings.conds_prb + "\n";
    text += "[[" + currentFileName + "]]\n";

    text += "#### PDF annotations\n";

    text += text_cd;

    text += "\n\n\n---\n" + this.settings.detal_prb + "\n";
    text += "[[" + currentFileName + "]]\n";
    text += text_dt;

    return text;
}

export function format(
    grandtotal,
    i_isGetNrml: boolean,
    i_isGetLow: boolean,
    isExternalFile
) {
    // Args:
    // grandtotal:          list of annotations
    // i_isGetNrml:         true if extraction of normal priority infos (yellow)
    // i_isGetLow:          true if extraction of low    priority infos (light blue)
    // isExternalFile       true if the PDF file's path to extract annotations from is indicated in the clipboard

    // now iterate over the annotations printing topics, then folder, then comments...
    let text = "";
    let topic = "";
    let text_dt = "";
    let text_cd = "";
    //let text_3 = '';
    let currentFileName = "";
    let new_file = false;
    let first_time = true;
    let l_pageNumber = 0;
    // let l_previousLevel = "";
    let l_isPrevBullet = false;
    const color_lvl1 = convert.rgb.hsl(this.settings.level1RGB);
    const color_lvl2 = convert.rgb.hsl(this.settings.level2RGB);
    const color_lvl3 = convert.rgb.hsl(this.settings.level3RGB);
    const color_sumr = convert.rgb.hsl(this.settings.summryRGB);
    const color_impt = convert.rgb.hsl(this.settings.imprttRGB);
    const color_lvl1Hue = color_lvl1[0];
    const color_lvl2Hue = color_lvl2[0];
    const color_lvl3Hue = color_lvl3[0];
    const color_sumrHue = color_sumr[0];
    const color_imptHue = color_impt[0];
    const color_lvl1Lum = color_lvl1[2];
    const color_lvl2Lum = color_lvl2[2];
    const color_lvl3Lum = color_lvl3[2];
    const color_sumrLum = color_sumr[2];
    const color_imptLum = color_impt[2];
    const color_maxHue = 360;
    const color_maxLum = 100;
    const lvl1_format = this.settings.lvl1_format;
    const lvl2_format = this.settings.lvl2_format;
    const lvl3_format = this.settings.lvl3_format;
    const sumr_format = this.settings.sumr_format;
    const impt_format = this.settings.impt_format;
    const note_format = this.settings.note_format;
    const note_preamb = this.settings.note_preamb + " ";
    const lvl1_icon = this.settings.lvl1_icon + " ";
    const lvl2_icon = this.settings.lvl2_icon + " ";
    const lvl3_icon = this.settings.lvl3_icon + " ";
    const sumr_icon = this.settings.sumr_icon + " ";
    const impt_icon = this.settings.impt_icon + " ";
    const unkn_icon = this.settings.unkn_icon + " ";

    let l_levelPrefix = "";
    let l_levelFormat = "";
    let l_levelIcon = "";
    let l_annoToReport = true;
    let l_title_lvl1 = "\n" + TITLE_LVL1;
    let l_note_sfx = "";

    const l_lvl2_prefix = LVL2_PREFIX;
    const l_lvl3_prefix = LVL3_PREFIX;
    const l_sumr_prefix = SUMR_PREFIX;
    const l_impt_prefix = IMPT_PREFIX;
    // Get date and time:
    const l_date = new Date();
    const l_day = String(l_date.getDate()).padStart(2, "0");
    const l_month = String(l_date.getMonth() + 1).padStart(2, "0");
    const l_year = String(l_date.getFullYear());
    const l_hours = String(l_date.getHours()).padStart(2, "0");
    const l_minutes = String(l_date.getMinutes()).padStart(2, "0");
    const l_dateTime = `${l_year}/${l_month}/${l_day} ${l_hours}:${l_minutes}`;

    // Set beginning of file
    text = this.settings.begin_prb.replace("{dateTime}", l_dateTime);
    text = text + "\n";

    grandtotal.forEach((anno) => {
        // PROCESS EACH ANNOTATION

        // print main Title when Topic changes (and settings allow)
        if (this.settings.useStructuringHeadlines) {
            // ➡️ Structuring headlines will be shown

            if (this.settings.sortByTopic) {
                if (topic != anno.topic) {
                    topic = anno.topic;
                    currentFileName = "";
                    text += `\n# ${topic}\n`;
                }
            }

            // ➡️ NEW FILE ?
            if (this.settings.useFolderNames) {
                if (currentFileName != anno.folder) {
                    new_file = true;
                }
            } else {
                if (currentFileName != anno.file.name) {
                    new_file = true;
                }
            }

            if (new_file) {
                // Print annotations
                if (!first_time) {
                    // Add preamble and annotations
                    text += buildPreamble(anno.file.name);
                    text += buildAnnotations(
                        anno.file.name,
                        text_cd,
                        text_dt
                    );
                    // Reset detailed-/condensed-text variables
                    text_cd = "";
                    text_dt = "";
                } else {
                    // 1st file
                    first_time = false;
                    // Replace file name
                    text = text.replace("{fileName}", anno.file.name);
                }

                // Update file name
                if (this.settings.useFolderNames) {
                    currentFileName = anno.folder;
                } else {
                    currentFileName = anno.file.name;
                }

                new_file = false;
            }
        }

        // ➡️ PAGE NB: Add page number if needed
        if (l_pageNumber != anno.pageNumber) {
            // Annotations on a different page
            text_dt += "\n#### Page " + anno.pageNumber + "\n";
            l_pageNumber = anno.pageNumber;
            // In case of a page change, do not add a line before a level 1 title
            l_title_lvl1 = TITLE_LVL1;
        }
        //else: Same page, nothing to do

        // ➡️ COLORS: Set variables depending on color
        l_annoToReport = true;
        // Get current annotation's color hue & lumi
        let annotColor: [number, number, number] = [-1, -1, -1];
        if (anno.color != null) {
            annotColor = convert.rgb.hsl(anno.color);
        }
        // else: Cannot get annotation's color: use the impossible color
        const annotColorHue = annotColor[0];
        const annotColorLum = annotColor[2];
        l_note_sfx = "";

        // Test if current annotation color is recognized
        if (
            Math.abs(
                (100 * (annotColorHue - color_lvl1Hue)) / color_maxHue
            ) <= this.settings.hueTol &&
            Math.abs(
                (100 * (annotColorLum - color_lvl1Lum)) / color_maxLum
            ) <= this.settings.LumiTol
        ) {
            // Color for LEVEL 1
            l_levelPrefix = l_title_lvl1;
            //l_previousLevel = lvl2_prefix;
            l_isPrevBullet = false;
            l_levelFormat = lvl1_format;
            l_levelIcon = lvl1_icon;
        } else if (
            Math.abs(
                (100 * (annotColorHue - color_lvl2Hue)) / color_maxHue
            ) <= this.settings.hueTol &&
            Math.abs(
                (100 * (annotColorLum - color_lvl2Lum)) / color_maxLum
            ) <= this.settings.LumiTol
        ) {
            // Color for LEVEL 2
            if (i_isGetNrml) {
                // Annotation to report
                l_levelPrefix = l_lvl2_prefix;
                // l_previousLevel = l_levelPrefix;
                l_isPrevBullet = true;
                l_levelFormat = lvl2_format;
                l_levelIcon = lvl2_icon;
            } else {
                l_annoToReport = false;
            }
        } else if (
            Math.abs(
                (100 * (annotColorHue - color_lvl3Hue)) / color_maxHue
            ) <= this.settings.hueTol &&
            Math.abs(
                (100 * (annotColorLum - color_lvl3Lum)) / color_maxLum
            ) <= this.settings.LumiTol
        ) {
            // Color for LEVEL 3
            if (i_isGetLow) {
                // Annotation to report
                l_levelPrefix = l_lvl3_prefix;
                // l_previousLevel = l_levelPrefix;
                if (l_isPrevBullet == false) {
                    // We have a bullet level 2 but there was no level 1: Add one
                    text_cd += l_lvl2_prefix + "_{Low importance} :_\n";
                }
                l_isPrevBullet = true;
                l_levelFormat = lvl3_format;
                l_levelIcon = lvl3_icon;
            } else {
                l_annoToReport = false;
            }
        } else if (
            Math.abs(
                (100 * (annotColorHue - color_sumrHue)) / color_maxHue
            ) <= this.settings.hueTol &&
            Math.abs(
                (100 * (annotColorLum - color_sumrLum)) / color_maxLum
            ) <= this.settings.LumiTol
        ) {
            // Color for SUMMARY
            //l_levelPrefix = l_previousLevel;
            l_levelPrefix = l_sumr_prefix;
            // l_previousLevel = l_levelPrefix;
            l_isPrevBullet = true;
            l_levelFormat = sumr_format;
            l_levelIcon = sumr_icon;
        } else if (
            Math.abs(
                (100 * (annotColorHue - color_imptHue)) / color_maxHue
            ) <= this.settings.hueTol &&
            Math.abs(
                (100 * (annotColorLum - color_imptLum)) / color_maxLum
            ) <= this.settings.LumiTol
        ) {
            // Color for IMPORTANT ANNOTATION
            //l_levelPrefix = l_previousLevel;
            l_levelPrefix = l_impt_prefix;
            // l_previousLevel = l_levelPrefix;
            l_isPrevBullet = true;
            l_levelFormat = impt_format;
            l_levelIcon = impt_icon;
        } else {
            // UNKNOWN color
            if (i_isGetNrml && i_isGetLow) {
                // Annotation to report
                l_levelPrefix = "- ";
                // l_previousLevel = l_levelPrefix;
                l_isPrevBullet = true;
                l_levelIcon = unkn_icon;
                // No level format
            } else {
                l_annoToReport = false;
            }
        }

        // ➡️ ANNOTATION: Add current annotation to detailed/condensed strings
        if (l_annoToReport) {
            // Annotation to report
            let l_details = "";
            // ▶️ Annotation: Highlight or underline
            if (ANNOTS_TREATED_AS_HIGHLIGHTS.includes(anno.subtype)) {
                if (isExternalFile) {
                    l_details =
                        this.getContentForHighlightFromExternalPDF(anno);
                } else {
                    l_details =
                        this.getContentForHighlightFromInternalPDF(anno);
                }
            } else {
                // ▶️ Annotation: Note
                if (isExternalFile) {
                    l_details = this.getContentForNoteFromExternalPDF(anno);
                } else {
                    l_details = this.getContentForNoteFromInternalPDF(anno);
                }
            }

            // ▶️ Remove leading whitespace / new line
            while (
                l_details.substring(0, 1) == " " ||
                l_details.substring(0, 1) == "\n"
            ) {
                l_details = l_details.substring(1);
            }
            // ▶️ Remove trailing whitespace / new line
            while (
                l_details.substring(l_details.length - 1) == " " ||
                l_details.substring(l_details.length - 1) == "\n"
            ) {
                l_details = l_details.substring(0, l_details.length - 1);
            }

            // ▶️ Replace carriage returns (\r and/or \n)
            // Replace by <br>
            // Notes:
            //  - Doesn't work with l_details.replace('\r',"<br>")
            //  - Do not replace \r\n nor \n\r as they do not happen on intentional line break
            //    (happen only on line break on highlighted text which can be due to page width)
            // l_details.replace('\r',"<br>");
            // l_details.replace('\n',"<br>");
            if (l_details.includes("\r\n") || l_details.includes("\n\r")) {
                // There is/are carriage return(s) to remove
                // Replace \r\n -> remove
                let l_note = l_details.split("\r\n");
                l_details = "";
                for (let i = 0; i < l_note.length; i++) {
                    l_details += l_note[i];
                    // Add a space to avoid concatenating 2 words into 1
                    // (except if the last char is "-")
                    if (i < l_note.length - 1 && !l_details.endsWith("-")) {
                        l_details += " ";
                    }
                }
                // Replace \n\r -> remove
                l_note = l_details.split("\n\r");
                l_details = "";
                for (let i = 0; i < l_note.length; i++) {
                    l_details += l_note[i] + " ";
                    // Add a space to avoid concatenating 2 words into 1
                    // (except if the last char is "-")
                    if (i < l_note.length - 1 && !l_details.endsWith("-")) {
                        l_details += " ";
                    }
                }
            } else if (
                l_details.includes("\r") ||
                l_details.includes("\n")
            ) {
                // There is/are carriage return(s) to process
                // Replace \r -> <br>
                let l_note = l_details.split("\r");
                l_details = "";
                for (let i = 0; i < l_note.length; i++) {
                    l_details += l_note[i];
                    if (i < l_note.length - 1) {
                        l_details += "<br>";
                    }
                }
                // Replace \n -> <br>
                l_note = l_details.split("\n");
                l_details = "";
                for (let i = 0; i < l_note.length; i++) {
                    l_details += l_note[i];
                    if (i < l_note.length - 1) {
                        l_details += "<br>";
                    }
                }
            }

            // ▶️ Level 1 -> Title: do not set a format (except italics for a Note)
            if (l_levelPrefix == l_title_lvl1) {
                text_dt += l_title_lvl1;

                // Not text(=Note)
                if (anno.subtype != "Text") {
                    l_levelFormat = "";
                }
            } else {
                // ▶️ Not level 1
                text_dt += "> ";
                text_cd += l_levelPrefix;
            }

            if (anno.subtype == "Text") {
                // ▶️ Note
                text_dt +=
                    l_levelFormat +
                    note_preamb +
                    note_format +
                    l_levelIcon +
                    l_details +
                    note_format +
                    l_levelFormat +
                    l_note_sfx +
                    "\n";
            } else {
                // ▶️ Annotation: Highlight, Underline, Squiggly or Free text
                text_dt +=
                    l_levelIcon +
                    l_levelFormat +
                    l_details +
                    l_levelFormat +
                    l_note_sfx +
                    "\n";
            }
            text_cd +=
                l_levelIcon +
                l_levelFormat +
                l_details +
                l_levelFormat +
                l_note_sfx +
                "\n";
        }
        // else: Not an annotation to report
    }); // End of each annotation process

    // Display the last file's data
    text += this.buildPreamble(
        currentFileName
    );
    text += this.buildAnnotations(
        currentFileName,
        text_cd,
        text_dt
    );

    if (grandtotal.length == 0) {
        return "\n" + this.settings.no_an_prb + "\n";
    } else return text;
}