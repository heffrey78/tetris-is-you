import { GameState } from './types.js';
import { RuleEngine } from './RuleEngine.js';
import { WordQueue } from './WordQueue.js';
import { DifficultyScaler } from './DifficultyScaler.js';
import type { GameLogger } from './GameLogger.js';
import type { EffectManager } from './EffectManager.js';
import type { AudioSystem } from './AudioSystem.js';
import { EventEmitter, EventMap } from './EventEmitter.js';
export declare class GameLogic {
    private dropTimer;
    private baseDropInterval;
    private dropInterval;
    private spawnTimer;
    private spawnInterval;
    private gameState;
    private ruleEngine;
    private wordQueue;
    private logger?;
    private uiManager?;
    private effectManager?;
    private audioSystem?;
    private difficultyScaler?;
    private eventEmitter;
    constructor(gameState: GameState, ruleEngine: RuleEngine, wordQueue: WordQueue, logger?: GameLogger);
    setUIManager(uiManager: any): void;
    setRuleEngine(ruleEngine: RuleEngine): void;
    setEffectManager(effectManager: EffectManager): void;
    setAudioSystem(audioSystem: AudioSystem): void;
    setDifficultyScaler(difficultyScaler: DifficultyScaler): void;
    /**
     * Get the EventEmitter instance for external event subscription
     */
    getEventEmitter(): EventEmitter<EventMap>;
    /**
     * Subscribe to game logic events
     */
    on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
    /**
     * Subscribe to game logic events (one-time)
     */
    once<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
    /**
     * Unsubscribe from game logic events
     */
    off<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
    getDifficultyState(): import("./DifficultyScaler.js").DifficultyState | null;
    update(deltaTime: number): void;
    private updatePieceFalling;
    private updateSpawnBlocks;
    private triggerSpawnEffect;
    movePieceLeft(): boolean;
    movePieceRight(): boolean;
    movePieceDown(): boolean;
    rotatePiece(clockwise?: boolean): boolean;
    dropPiece(): void;
    private isValidPosition;
    private placePiece;
    private spawnNewPiece;
    private checkCompletedLines;
    private clearLines;
    private calculateScore;
    private updateDropSpeed;
    private isGameOver;
    private isClearing;
    setDropSpeed(level: number): void;
    addTestBlocks(): void;
    addBombTestBlocks(): void;
    addGhostTestBlocks(): void;
    addConflictTestBlocks(): void;
    testThrottling(): void;
    testSpellEffects(): void;
    testVisualStates(): void;
    private applySpellEffects;
    private triggerBlockSpellEffects;
    private executeSpellCombination;
    private executeSpellEffect;
    private showSpellEffectCanvas;
    private executeBombSpell;
    private executeLightningSpell;
    private executeAcidSpell;
    private executeMagnetSpell;
    private executeHealSpell;
    private executeMultiplySpell;
    private executeTransformSpell;
    private executeTeleportSpell;
    private executeSinkSpell;
    private executeFloatSpell;
    private hasSpellProperty;
    private checkRuleBasedGameEnd;
    private isWinConditionMet;
    private isLoseConditionMet;
    private getBlockColorFromRules;
    private getDefaultBlockColor;
}
