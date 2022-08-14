/* eslint-disable @typescript-eslint/no-unused-vars */
import { JanitorView, JanitorViewProps, SelectableItem } from './Views/JanitorView';
import { App, Modal } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot, Root } from "react-dom/client";
import { ScanResults } from './FileScanner';
import { FileProcessor } from './FileProcessoe';
import JanitorPlugin from 'main';
import { threadId } from 'worker_threads';

function toggleSelection(list: SelectableItem[], ic: number) {
	return list.map((o, i) => i === ic ? ({ ...o, selected: !o.selected }) : o)
}
export class JanitorModal extends Modal {

	plugin: JanitorPlugin;
	root: Root;
	state: JanitorViewProps;

	constructor(app: App, plugin: JanitorPlugin) {
		super(app);
		this.plugin = plugin;
		this.state = {
			onClose: () => { this.close() },
			scanning: true,
			orphans: [],
			onSelectionChange: (i: number, section: string) => {
				this.handleSelectionChange(i, section);
			},
			onPerform: (operation: string) => {
				this.perform(operation);
			},
			useSystemTrash: this.plugin.settings.useSystemTrash,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onSettingChange: (setting:string, value:any) => {
				this.onSettingChange(setting, value);
			}
		};
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onSettingChange(setting: string, value: any) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.plugin.settings as any)[setting] = value;
		this.plugin.saveSettings();
		this.state = {...this.state,
			useSystemTrash: this.plugin.settings.useSystemTrash
		}
		// console.log(this.state);
		this.render(); 
	}



	handleSelectionChange(ic: number, section: string) {

		this.state = {
			...this.state,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[section]: toggleSelection(((this.state as any)[section]) as SelectableItem[], ic)
		};
		this.render();
	}

	public updateState(results: ScanResults) {
		this.state = {
			...this.state,
			scanning: results.scanning,
			orphans: results.orphans.map(tfile => ({
				name: tfile.path,
				selected: false
			}))
		};

		this.render();
	}

	render() {
		this.root.render(
			<React.StrictMode>
				<JanitorView {...this.state} />
			</React.StrictMode>
		);
	}

	onOpen() {
		const { contentEl } = this;
		// contentEl.setText('Woah!');
		// this.titleEl.setText("Obsidian Janitor")	
		this.root = createRoot(contentEl/*.children[1]*/);
		this.render();

	}

	onClose() {
		const { contentEl } = this;
		// contentEl.empty();
		// ReactDOM.unmountComponentAtNode(contentEl);
		this.root.unmount();
	}

	async perform(operation: string) {
		console.log(this.state);
		console.log("Janitor: performing " + operation);
		const fileProcessor = new FileProcessor(this.app);
		await fileProcessor.process(this.extractFiles(), operation, this.state.useSystemTrash);
		this.close();
	}

	extractFiles() {
		return this.state.orphans
			.filter(f => f.selected)
			.map(f => f.name)
			;
	}
}
