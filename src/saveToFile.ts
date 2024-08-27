// Used to write data to file.
import { TFile, TFolder } from 'obsidian';

export async function saveDataToFile(filePath: string, dataStr: string): Promise<boolean> {
    let l_return = false;
    try {
        const fileExists = await this.app.vault.adapter.exists(filePath);
        if (fileExists) {// Append data to existing data
            await this.appendDataToFile(filePath, dataStr);
        } else {// Create new file with data
            await this.app.vault.create(filePath, dataStr);
        }

        // Open file  (no: done where saveDataToFile is called)
        //await this.app.workspace.openLinkText(filePath, '', true);

        l_return = true; // Export OK

    } catch (error) {// An error occured
        console.error('Error during export to file:', error);
        l_return = false; // Export KO
    }

    return l_return;
}


export async function appendDataToFile(filePath: string, dataStr: string) {
    let existingContent = await this.app.vault.adapter.read(filePath);
    if(existingContent.length > 0) {
        existingContent = existingContent + '\r\r';
    }
    await this.app.vault.adapter.write(filePath, existingContent + dataStr);

    return;
}
