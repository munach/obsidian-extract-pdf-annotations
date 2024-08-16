# Obsidian Extract PDF Annotations Plugin

This is a plugin for [Obsidian](https://obsidian.md). It extracts all types of annotations (highlight, underline, note, free text) from PDF files inside and outside the Obsidian Vault.
It can be used on single PDF files (see [`Extract PDF Annotations on single file` and `Extract PDF Annotations from single file from path in clipboard`](#commands)) or even on a whole directory containing PDFs (see [`Extract PDF Annotations`](#commands)) for batch extraction.

## Usage

This Plugin visits all PDF files in a given directory and extracts comments and highlights from the PDF files. It treats the first line of every comment as *Topic* for grouping the comments. 

Assume we have in a folder in our Vault containing PDF files, e.g: 

![vault_folder](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/vault_folder.jpg?raw=true)

and we have highlighted the Julia Hello World Programm with a note 'Hello World': 

![pdf_note](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/pdf_note.jpg?raw=true)

In the editor (e.g. \_Extract) we run the plugin's command  `Extract PDF Annotations` (Hotkey Ctrl-P for all Commands). This will fetch all annotations in the PDF files in the current folder and sort them by *Topic*: 

![extracted_annotations](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/extracted_annotations.jpg?raw=true)

As such, you can relate comments for your topics (here 'Hello World') from several PDF files. 

### Commands
* `Extract PDF Annotations` Works when editing a markdown note. Searches all PDF files in current Folder for annotations, and inserts them at the current position of the open note. 
* `Extract PDF Annotations on single file` Works while displaying a PDF file inside the Obisidan PDF-Viewer. Extracts annotations from this file and writes them to the note `Annotations for <filename>`
* `Extract PDF Annotations from single file from path in clipboard` Works when editing a markdown note. Looks for a file path of a PDF in clipboard, extracts annotations from it and inserts them at the current position of the open note. This command can be used for external PDF files, which are not part of the Obsidian Vault. Helpful, if you do not want to copy your PDFs inside your vault.

### Plugin Settings: 

* Use structuring headlines or not, if you only want to display annotations in the specified template
* Use the first line of the comment as 'Topic' (and sort accordingly), or not
* Use folder name or PDF-Filename for sorting
* Select your desired annotation types that should be extracted from the PDF, if it includes other types that you don't need
* Template settings for different types of notes: notes from internal or external PDFs and highlights from internal or external PDFs. The distinction between internal and external exists, if one wants to use different links (internal `[[]]` links vs. external `file://` links). The following template variables are available and can be used by following the [Handlebars]('https://handlebarsjs.com/guide/expressions.html') syntax: 
    - {{highlightedText}}: 'Highlighted text from PDF',
	- {{folder}}: 'Folder of PDF file',
	- {{file}}: 'Binary content of file',
	- {{filepath}}: 'Path of PDF file',
	- {{pageNumber}}: 'Page number of annotation with reference to PDF pages',
	- {{author}}: 'Author of annotation',
	- {{body}}: 'Body of annotation'

## Versions

1.3.1 add support for squiggle annotations

1.3.0 add support for free text annotations

1.2.1 improved annotation extraction

1.2.0 added template settings

1.1.0 add new function `Extract PDF Annotations from single file from path in clipboard` to extract annotations from PDFs outside Obsidian vault

1.0.4 clean up hyphenation https://github.com/munach/obsidian-extract-pdf-annotations/issues/5

1.0.3 updated highlight fetching to use QuadPoints instead of Rectangles

## Installation / Build

Fetch repository: 
```bash
$ git clone https://github.com/munach/obsidian-extract-pdf-annotations.git
$ cd obsidian-extract-pdf-annotations
```
Install dependencies: 
```
$ npm i
```

Transpile `main.ts`: 
```
$ npm run build
```

Then create the plugin directory and copy the files `main.js` and `manifest.json`, e.g.; 
```
$ mkdir ~/MyVault/.obsidian/plugins/obsidian-extract-pdf-annotations
$ cp main.js manifest.json ~/MyVault/.obsidian/plugins/obsidian-extract-pdf-annotations/
```

Enable the plugin in Obsidan's setting. 

## Issues / Bugs

[] works only on left-to-right highlights 

## Credits

This plugin builds on ideas from Alexis Rondeaus Plugin https://github.com/akaalias/obsidian-extract-pdf-highlights, but uses obsidians build-in pdf.js library. 

## Author

Franz Achermann and Florian Stöckl



