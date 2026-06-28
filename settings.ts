import BibleSidecarPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { NKRV_VERSION } from "./src/bible-source";

export class BibleSidecarSettingsTab extends PluginSettingTab {
	plugin: BibleSidecarPlugin;
	containerEl: HTMLElement;
	constructor(app: App, plugin: BibleSidecarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("성경 역본")
			.setDesc("사이드바에 표시할 성경 역본을 선택하세요")
			.addDropdown((dropdown) => {
				dropdown.addOption("KRV", "개역한글");
				dropdown.addOption(NKRV_VERSION, "개역개정 (로컬 파일)");
				dropdown.addOption("NIV", "NIV");
				dropdown.addOption("KJV", "KJV");
				dropdown
					.setValue(this.plugin.settings.bibleVersion)
					.onChange((value: string) => {
						this.plugin.settings.bibleVersion = value;
						void this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(containerEl)
			.setName("개역개정 JSON 경로")
			.setDesc(
				"개역개정 본문 JSON 파일의 vault 내 경로 (예: bible/nkrv.json). 저작권 보호 본문이므로 직접 준비해 vault에 넣어 주세요."
			)
			.addText((text) => {
				text
					.setPlaceholder("bible/nkrv.json")
					.setValue(this.plugin.settings.nkrvPath)
					.onChange((value: string) => {
						this.plugin.settings.nkrvPath = value;
						void this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("복사 형식")
			.setHeading()
			.setDesc("성경 본문을 복사할 때의 형식을 선택하세요")
			.addDropdown((dropdown) => {
				dropdown.addOption("plain", "일반 텍스트");
				dropdown.addOption("callout", "콜아웃");
				dropdown
					.setValue(this.plugin.settings.copyFormat)
					.onChange((value: string) => {
						this.plugin.settings.copyFormat = value;
						void this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("구절 출처 포함")
			.setHeading()
			.setDesc("복사할 때 구절 출처(예: 히브리서 3:1)를 포함합니다 (권장)")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.copyVerseReference)
					.onChange((value: boolean) => {
						this.plugin.settings.copyVerseReference = value;
						void this.plugin.saveSettings();
						this.display();
					});
			});

		if (this.plugin.settings.copyVerseReference) {
			new Setting(containerEl)
				.setName("구절 출처 스타일")
				.setDesc("구절 출처 줄의 스타일을 선택하세요")
				.addDropdown((dropdown) => {
					dropdown.addOption("- ", "목록 (-)");
					dropdown.addOption(">", "콜아웃 (>)");
					dropdown.addOption("-- ", "이중 대시 (--)");
					dropdown.addOption("~", "물결 (~)");
					dropdown
						.setValue(this.plugin.settings.verseReferenceStyle)
						.onChange((value: string) => {
							this.plugin.settings.verseReferenceStyle = value;
							void this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName("내부 링크 사용 (예: [[요한복음]])")
				.setDesc("구절 출처의 책 이름을 위키링크로 감쌉니다")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.verseReferenceInternalLinking)
						.onChange((value: boolean) => {
							this.plugin.settings.verseReferenceInternalLinking = value;
							void this.plugin.saveSettings();
						});
				});
		}
	}
}
