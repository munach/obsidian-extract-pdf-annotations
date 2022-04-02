# Obsidian Extract PDF Annotations Plugin

This is a plugin for [Obsidian](https://obsidian.md). It extracts Annotations from PDF Files.  

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
* `Extract PDF Annotations on single file` Works while displaying a PDF file. Extracts annotations from this file and writes them to the note `Annotations for <filename>`

### Plugin Settings: 

* Use the first line of the comment as 'Topic' (and sort accordingly), or not
* Use folder name or PDF-Filename for sorting

## Versions

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

Franz Achermann 



