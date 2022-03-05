# Obsidian PDF Annotations Plugin

This is a plugin for [Obsidian](https://obsidian.md). It extracts Annotations from PDF Files.  

## Usage

This Plugin visits all PDF Files in a given Directory and extracts comments and highlighted comments from the PDF. It treats the first line of every comment as *Topic* for grouping the comments. 

Assume we have in a folder in our Vault PDFs about Programming languages and we have highlighted the 'hello World' Programm and added a note 'Hello World': 

![pdf_note](https://github.com/munach/obsidian-pdf-annotations/blob/master/img/pdf_note.jpg?raw=true)

Crete a note (here) in the folder and run the plugin's command `Extract PDF Annotations` (Hotkey Ctrl-P for all Commands)

This will fetch all Annotations in the PDF Files in the current folder, sort them by *Topic*: 

[]

As such, you can relate Comments for your topics from several PDF Files. 


## Installation

## Description

This plugin build on ideas from Alexis Rondeaus Plugin https://github.com/akaalias/obsidian-extract-pdf-highlights. But we rely direclt on obsidians pdf.js library. 

## Author



