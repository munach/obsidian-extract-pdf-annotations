# Obsidian PDF Annotations Plugin

This is a plugin for [Obsidian](https://obsidian.md). It extracts Annotations from PDF Files.  

## Usage

This Plugin visits all PDF Files in a given Directory and extracts comments and highlighted comments from the PDF. It treats the first line of every comment as *Topic* for grouping the comments. 

Assume we have in a folder in our Vault containing PDF Documents, e.g: 

![vault_folder](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/vault_folder.jpg?raw=true)

and we have highlighted the 'hello World' Programm with a note 'Hello World': 

![pdf_note](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/pdf_note.jpg?raw=true)

In the editor (e.g. \_Extract) we run the plugin's command  `Extract PDF Annotations` (Hotkey Ctrl-P for all Commands). This will fetch all Annotations in the PDF Files in the current folder, sort them by *Topic*: 

![extracted_annotations](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/extracted_annotations.png?raw=true)

As such, you can relate Comments for your topics from several PDF Files. 


## Installation

## Description

This plugin build on ideas from Alexis Rondeaus Plugin https://github.com/akaalias/obsidian-extract-pdf-highlights. But we rely direclt on obsidians pdf.js library. 

## Author



