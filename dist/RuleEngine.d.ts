import { Rule, WordQueueItem, GameState, RuleConflict, EffectThrottle } from './types.js';
import { GameConfig } from './GameConfig.js';
import type { GameLogger } from './GameLogger.js';
import { EventEmitter, EventMap } from './EventEmitter.js';
export declare class RuleEngine {
    private rules;
    private ruleCounter;
    private ruleConflicts;
    private effectThrottles;
    private logger?;
    private config;
    private eventEmitter;
    private readonly PRIORITY_LEVELS;
    constructor(logger?: GameLogger, config?: GameConfig);
    setLogger(logger: GameLogger): void;
    /**
     * Get the EventEmitter instance for external event subscription
     */
    getEventEmitter(): EventEmitter<EventMap>;
    /**
     * Subscribe to rule engine events
     */
    on<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
    /**
     * Subscribe to rule engine events (one-time)
     */
    once<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
    /**
     * Unsubscribe from rule engine events
     */
    off<K extends keyof EventMap>(event: K, listener: (data: EventMap[K]) => void): this;
    private initializeBasicRules;
    addRule(noun: string, property: string): string;
    addRuleWithPriority(noun: string, property: string, priority: number, source: 'base' | 'line-clear' | 'fusion'): string;
    modifyRuleProperty(ruleId: string, newProperty: string): boolean;
    modifyRuleNoun(ruleId: string, newNoun: string): boolean;
    createFusionRule(word1: string, word2: string, word3: string): string;
    /**
     * Detects and resolves conflicts when adding a new rule
     */
    private detectAndResolveConflicts;
    removeRule(ruleId: string): boolean;
    getActiveRules(): Rule[];
    getRuleConflicts(): RuleConflict[];
    getEffectThrottles(): EffectThrottle[];
    /**
     * Checks if an effect should be throttled and updates throttle state
     */
    shouldThrottleEffect(effectName: string): boolean;
    getPrimaryRule(): Rule | null;
    hasProperty(noun: string, property: string): boolean;
    getPropertyForNoun(noun: string): string | null;
    applyLineClearEffect(linesCleared: number, consumedWords: WordQueueItem[]): void;
    private applyPropertyEdit;
    private applyNounEdit;
    private applyNewRule;
    private applyFusionRule;
    getRulesAsStrings(): string[];
    checkWinCondition(gameState: GameState): boolean;
    private isWinConditionMet;
}
