import { Rule, WordQueueItem, GameState, RuleConflict, EffectThrottle } from './types.js';
import { RuleConflictResolver, EffectThrottleManager } from './RuleConflictResolver.js';
import { GameConfig, DEFAULT_CONFIG } from './GameConfig.js';
import type { GameLogger } from './GameLogger.js';

export class RuleEngine {
    private rules: Map<string, Rule> = new Map();
    private ruleCounter: number = 0;
    private ruleConflicts: RuleConflict[] = [];
    private effectThrottles: Map<string, EffectThrottle> = new Map();
    private logger?: GameLogger;
    private config: GameConfig;
    
    // Rule priority levels
    private readonly PRIORITY_LEVELS = {
        BASE: 100,      // Basic game rules
        LINE_CLEAR: 200, // Rules from line clears
        FUSION: 300,    // Fusion rules (highest priority)
        TEMPORARY: 50   // Temporary effects
    };
    
    constructor(logger?: GameLogger, config: GameConfig = DEFAULT_CONFIG) {
        this.logger = logger;
        this.config = config;
        this.initializeBasicRules();
    }
    
    public setLogger(logger: GameLogger): void {
        this.logger = logger;
    }
    
    private initializeBasicRules(): void {
        // Load rules from configuration
        this.config.initialRules.forEach(rule => {
            this.addRuleWithPriority(rule.noun, rule.property, rule.priority, 'base');
        });
    }
    
    public addRule(noun: string, property: string): string {
        return this.addRuleWithPriority(noun, property, this.PRIORITY_LEVELS.LINE_CLEAR, 'line-clear');
    }
    
    public addRuleWithPriority(noun: string, property: string, priority: number, source: 'base' | 'line-clear' | 'fusion'): string {
        const id = `rule-${++this.ruleCounter}`;
        const rule: Rule = {
            id,
            noun: noun.toUpperCase(),
            property: property.toUpperCase(),
            active: true,
            createdAt: Date.now(),
            priority,
            source
        };
        
        // Check for conflicts before adding
        this.detectAndResolveConflicts(rule);
        
        this.rules.set(id, rule);
        const message = `Added rule: [${noun}] IS [${property}] (Priority: ${priority}, Source: ${source})`;
        console.log(message);
        
        this.logger?.logRuleChange('ADD', { noun, property }, { priority, source, ruleId: id });
        
        return id;
    }
    
    public modifyRuleProperty(ruleId: string, newProperty: string): boolean {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            console.warn(`Rule ${ruleId} not found`);
            return false;
        }
        
        const oldProperty = rule.property;
        rule.property = newProperty.toUpperCase();
        const message = `Modified rule: [${rule.noun}] IS [${oldProperty}] → [${rule.noun}] IS [${newProperty}]`;
        console.log(message);
        
        this.logger?.logRuleChange('MODIFY_PROPERTY', { noun: rule.noun, property: newProperty }, { 
            oldProperty, 
            ruleId 
        });
        
        return true;
    }
    
    public modifyRuleNoun(ruleId: string, newNoun: string): boolean {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            console.warn(`Rule ${ruleId} not found`);
            return false;
        }
        
        const oldNoun = rule.noun;
        rule.noun = newNoun.toUpperCase();
        const message = `Modified rule: [${oldNoun}] IS [${rule.property}] → [${newNoun}] IS [${rule.property}]`;
        console.log(message);
        
        this.logger?.logRuleChange('MODIFY_NOUN', { noun: newNoun, property: rule.property }, { 
            oldNoun, 
            ruleId 
        });
        
        return true;
    }
    
    public createFusionRule(word1: string, word2: string, word3: string): string {
        const fusionProperty = `FUSION_${word1}_${word2}_${word3}`;
        return this.addRuleWithPriority(word2, fusionProperty, this.PRIORITY_LEVELS.FUSION, 'fusion');
    }
    
    /**
     * Detects and resolves conflicts when adding a new rule
     */
    private detectAndResolveConflicts(newRule: Rule): void {
        const existingRules = Array.from(this.rules.values());
        const conflict = RuleConflictResolver.detectConflicts(newRule, existingRules);
        
        if (!conflict) return;
        
        // Validate rule safety before proceeding
        const safety = RuleConflictResolver.validateRuleSafety(newRule, existingRules);
        if (!safety.safe) {
            console.warn(`⚠️ Rule safety warnings:`, safety.warnings);
        }
        
        // Resolve the conflict
        const resolvedRule = RuleConflictResolver.resolveConflict(conflict, this.rules);
        
        if (resolvedRule) {
            // Deactivate conflicting rules except the resolved one
            conflict.conflictingRules.forEach(rule => {
                if (rule.id !== resolvedRule.id) {
                    const existingRule = this.rules.get(rule.id);
                    if (existingRule) {
                        existingRule.active = false;
                        console.log(`🔄 Deactivated conflicting rule: [${existingRule.noun}] IS [${existingRule.property}]`);
                    }
                }
            });
            
            console.log(`✅ Conflict resolved for [${conflict.noun}]: ${resolvedRule.property} wins (${conflict.resolution})`);
        }
        
        // Log the conflict resolution
        this.logger?.logRuleConflict(
            'RULE_CONFLICT',
            conflict.conflictingRules,
            conflict.resolution
        );
        
        // Track the conflict for UI display
        this.ruleConflicts.push(conflict);
    }
    
    public removeRule(ruleId: string): boolean {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            return false;
        }
        
        rule.active = false;
        console.log(`Deactivated rule: [${rule.noun}] IS [${rule.property}]`);
        return true;
    }
    
    public getActiveRules(): Rule[] {
        return Array.from(this.rules.values()).filter(rule => rule.active);
    }
    
    public getRuleConflicts(): RuleConflict[] {
        return this.ruleConflicts;
    }
    
    public getEffectThrottles(): EffectThrottle[] {
        return Array.from(this.effectThrottles.values());
    }
    
    /**
     * Checks if an effect should be throttled and updates throttle state
     */
    public shouldThrottleEffect(effectName: string): boolean {
        const shouldThrottle = EffectThrottleManager.shouldThrottleEffect(effectName, this.effectThrottles);
        
        // Cleanup expired throttles periodically
        if (Math.random() < 0.1) { // 10% chance to cleanup on each check
            EffectThrottleManager.cleanupExpiredThrottles(this.effectThrottles);
        }
        
        return shouldThrottle;
    }
    
    public getPrimaryRule(): Rule | null {
        const activeRules = this.getActiveRules();
        return activeRules.length > 0 ? activeRules[0] : null;
    }
    
    public hasProperty(noun: string, property: string): boolean {
        const activeRules = this.getActiveRules();
        return activeRules.some(rule => 
            rule.noun === noun.toUpperCase() && 
            rule.property === property.toUpperCase()
        );
    }
    
    public getPropertyForNoun(noun: string): string | null {
        const activeRules = this.getActiveRules();
        const rule = activeRules.find(rule => rule.noun === noun.toUpperCase());
        return rule ? rule.property : null;
    }
    
    // Apply line clear effects based on the number of lines cleared
    public applyLineClearEffect(linesCleared: number, consumedWords: WordQueueItem[]): void {
        console.log(`📝 Applying line clear effect for ${linesCleared} lines with words:`, consumedWords.map(w => w.word));
        
        const minWordsNeeded = Math.min(linesCleared, 3);
        if (consumedWords.length < minWordsNeeded) {
            console.warn(`Not enough words consumed (${consumedWords.length}/${minWordsNeeded}) for ${linesCleared}-line clear effects`);
            this.logger?.logGameEvent('INSUFFICIENT_WORDS', { 
                linesCleared, 
                wordsNeeded: minWordsNeeded, 
                wordsAvailable: consumedWords.length 
            });
            return;
        }
        
        this.logger?.logGameEvent('LINE_CLEAR_PROCESSING', { 
            linesCleared, 
            wordsConsumed: consumedWords.map(w => ({ word: w.word, type: w.type })) 
        });
        
        switch (linesCleared) {
            case 1:
                this.applyPropertyEdit(consumedWords[0].word, consumedWords[0].type);
                break;
            case 2:
                this.applyNounEdit(consumedWords[0].word, consumedWords[0].type);
                break;
            case 3:
                this.applyNewRule(consumedWords[0].word, consumedWords[1].word, consumedWords[0].type, consumedWords[1].type);
                break;
            case 4:
                this.applyFusionRule(consumedWords[0].word, consumedWords[1].word, consumedWords[2].word);
                break;
            default:
                console.log(`🎯 ${linesCleared}-line clear: No special rule effect`);
                break;
        }
        
        console.log('Current active rules after change:', this.getRulesAsStrings());
    }
    
    private applyPropertyEdit(newWord: string, wordType: 'noun' | 'property'): void {
        const primaryRule = this.getPrimaryRule();
        if (!primaryRule) {
            console.warn('No primary rule found for property edit');
            return;
        }
        
        const oldProperty = primaryRule.property;
        
        // Use the word as property regardless of its original type
        // This creates interesting emergent behavior
        this.modifyRuleProperty(primaryRule.id, newWord);
        
        const message = `🔄 1-LINE CLEAR: [${primaryRule.noun}] IS [${oldProperty}] → [${primaryRule.noun}] IS [${newWord}]`;
        console.log(message);
        
        this.logger?.logRuleChange('1_LINE_PROPERTY_EDIT', {
            noun: primaryRule.noun,
            property: newWord
        }, {
            oldProperty,
            wordUsed: newWord,
            wordOriginalType: wordType,
            ruleId: primaryRule.id
        });
    }
    
    private applyNounEdit(newNoun: string, wordType: 'noun' | 'property'): void {
        const primaryRule = this.getPrimaryRule();
        if (!primaryRule) {
            console.warn('No primary rule found for noun edit');
            return;
        }
        
        const oldNoun = primaryRule.noun;
        
        // Use the word as noun regardless of its original type
        // This creates interesting emergent behavior
        this.modifyRuleNoun(primaryRule.id, newNoun);
        
        const message = `🔄 2-LINE CLEAR: [${oldNoun}] IS [${primaryRule.property}] → [${newNoun}] IS [${primaryRule.property}]`;
        console.log(message);
        
        this.logger?.logRuleChange('2_LINE_NOUN_EDIT', {
            noun: newNoun,
            property: primaryRule.property
        }, {
            oldNoun,
            wordUsed: newNoun,
            wordOriginalType: wordType,
            ruleId: primaryRule.id
        });
    }
    
    private applyNewRule(word1: string, word2: string, word1Type: 'noun' | 'property', word2Type: 'noun' | 'property'): void {
        // Intelligently create rule based on word types
        let noun: string;
        let property: string;
        
        // Prioritize using noun-type words as nouns and property-type words as properties
        if (word1Type === 'noun' && word2Type === 'property') {
            noun = word1;
            property = word2;
        } else if (word1Type === 'property' && word2Type === 'noun') {
            noun = word2;
            property = word1;
        } else {
            // Both same type or mixed - use first as noun, second as property
            noun = word1;
            property = word2;
        }
        
        const ruleId = this.addRule(noun, property);
        
        const message = `🆕 3-LINE CLEAR: Created new rule [${noun}] IS [${property}]`;
        console.log(message);
        
        this.logger?.logRuleChange('3_LINE_NEW_RULE', {
            noun,
            property
        }, {
            word1Used: word1,
            word1OriginalType: word1Type,
            word2Used: word2,
            word2OriginalType: word2Type,
            ruleId
        });
    }
    
    private applyFusionRule(word1: string, word2: string, word3: string): void {
        // Create complex fusion rule combining all three words
        const fusionNoun = word2; // Middle word becomes the noun
        const fusionProperty = `FUSION_${word1}_${word3}`; // Combine outer words as property
        
        const ruleId = this.createFusionRule(word1, word2, word3);
        
        const message = `🎯 4-LINE CLEAR (TETRIS): Created fusion rule [${fusionNoun}] IS [${fusionProperty}]`;
        console.log(message);
        
        this.logger?.logRuleChange('4_LINE_FUSION_RULE', {
            noun: fusionNoun,
            property: fusionProperty
        }, {
            word1Used: word1,
            word2Used: word2,
            word3Used: word3,
            ruleId
        });
    }
    
    public getRulesAsStrings(): string[] {
        return this.getActiveRules().map(rule => `[${rule.noun}] IS [${rule.property}]`);
    }
    
    // Check if a win condition is met
    public checkWinCondition(gameState: GameState): boolean {
        const winRules = this.getActiveRules().filter(rule => rule.property === 'WIN');
        
        // For each win rule, check if the condition is met in the game state
        for (const rule of winRules) {
            if (this.isWinConditionMet(rule, gameState)) {
                return true;
            }
        }
        
        return false;
    }
    
    private isWinConditionMet(rule: Rule, gameState: GameState): boolean {
        // Check if the win condition is satisfied
        // This is a simplified implementation
        return false; // Will be implemented with actual game object checking
    }
}