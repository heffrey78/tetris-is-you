import { GameConfig } from './GameConfig.js';
export interface RuleOption {
    noun: string;
    property: string;
    priority: number;
    description: string;
    category: string;
}
export declare class StartMenu {
    private menuElement;
    private ruleGrid;
    private startGameBtn;
    private resetRulesBtn;
    private selectedRules;
    private onStartGame?;
    private ruleOptions;
    constructor();
    private initializeDefaultRules;
    private setupEventListeners;
    private renderRuleOptions;
    private toggleRule;
    private validateRuleSelection;
    private resetToDefault;
    private startGame;
    show(): void;
    hide(): void;
    setOnStartGame(callback: (config: GameConfig) => Promise<void>): void;
}
