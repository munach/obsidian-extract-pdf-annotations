import { Workspace, Vault, MetadataCache, FileManager, UserEvent, PluginSettingTab } from "obsidian";

export class App {

	/** @public */
	workspace: Workspace;

	/** @public */
	vault: Vault;
	/** @public */
	metadataCache: MetadataCache;

	/** @public */
	fileManager: FileManager;

	/** @public */
	pluginSettingTab: PluginSettingTab;

	/**
	* The last known user interaction event, to help commands find out what modifier keys are pressed.
	* @public
	*/
	lastEvent: UserEvent | null;
}