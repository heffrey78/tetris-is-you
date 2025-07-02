import { Rule, WordQueueItem, GameState, RuleConflict, EffectThrottle } from './types.js';
import type { GameLogger } from './GameLogger.js';
export declare class RuleEngine {
    private rules;
    private ruleCounter;
    private ruleConflicts;
    private effectThrottles;
    private logger?;
    private readonly PRIORITY_LEVELS;
    constructor(logger?: GameLogger);
    setLogger(logger: GameLogger): void;
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
