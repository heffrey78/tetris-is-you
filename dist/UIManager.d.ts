import { GameState } from './types.js';
export declare class UIManager {
    private activeRulesElement;
    private ruleMatrixElement;
    private wordQueueElement;
    private currentScoreElement;
    private currentLevelElement;
    private linesClearedElement;
    private nextPieceCanvas;
    private nextPieceCtx;
    private visualLegendElement;
    constructor();
    updateUI(gameState: GameState): void;
    private updateActiveRules;
    private updateRuleMatrix;
    private updateWordQueue;
    showGameOver(): void;
    showPauseScreen(): void;
    hidePauseScreen(): void;
    private showOverlay;
    private hideOverlay;
    hideGameOver(): void;
    updateScore(score: number, level: number, linesCleared: number): void;
    showSpellEffectNotification(spellName: string, comboLevel?: number): void;
    showRuleChangeAnimation(ruleChange: string): void;
    private updateNextPiecePreview;
    private updateVisualLegend;
}
