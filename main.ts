import {
	Plugin,
	WorkspaceLeaf,
} from "obsidian";
import { BibleView, BibleViewType } from "BibleView";
import { BibleSidecarSettingsTab } from "./settings";

interface BibleSidecarSettings {
	bibleVersion: string;
	nkrvPath: string;
	copyFormat: string;
	copyVerseReference: boolean;
	verseReferenceStyle: string;
	verseReferenceFormat: string;
	verseReferenceInternalLinking: boolean;
	verseReferenceInternalLinkingFormat: string;
}

const DEFAULT_SETTINGS: Partial<BibleSidecarSettings> = {
	bibleVersion: "KRV",
	nkrvPath: "",
	copyFormat: "plain",
	copyVerseReference: false,
	verseReferenceStyle: "- ",
	verseReferenceFormat: "full",
	verseReferenceInternalLinking: false,
	verseReferenceInternalLinkingFormat: "short",
};

export default class BibleSidecarPlugin extends Plugin {
	settings: BibleSidecarSettings;
	private view: BibleView | undefined;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new BibleSidecarSettingsTab(this.app, this));

		this.registerView(
			BibleViewType,
			(leaf: WorkspaceLeaf) => {
				const view = new BibleView(leaf);
				this.view = view;
				view.settings = this.settings;
				return view;
			}
		);

		this.addRibbonIcon(
			"book-open-text",
			"성경 사이드바",
			(evt: MouseEvent) => {
				this.toggleBibleSidecarView();
			}
		);

		this.addCommand({
			id: "open-bible-sidecar",
			name: "성경 사이드바 열기",
			callback: this.toggleBibleSidecarView,
			icon: "book-open-text",
		});

		this.initLeaf();
	}

	private readonly toggleBibleSidecarView = async (): Promise<void> => {
		const existing = this.app.workspace.getLeavesOfType(BibleViewType);
		if (existing.length) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}

		const rightLeaf = this.app.workspace.getRightLeaf(false);
		if (rightLeaf) {
			await rightLeaf.setViewState({
				type: BibleViewType,
				active: true,
			});
		}

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(BibleViewType)[0]
		);
	};

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(BibleViewType).length) {
			return;
		}
	}

	updateBibleViewSettings = (newSettings: BibleSidecarSettings) => {
		if (this.view) {
			this.view.updateSettings(newSettings);
		}
	};

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateBibleViewSettings(this.settings);
	}
}
