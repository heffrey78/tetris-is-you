import { Rule, RuleConflict, EffectThrottle } from './types.js';
export declare class RuleConflictResolver {
    /**
     * Detects conflicts when multiple rules affect the same noun
     */
    static detectConflicts(newRule: Rule, existingRules: Rule[]): RuleConflict | null;
    /**
     * Determines if two properties conflict with each other
     */
    private static arePropertiesConflicting;
    /**
     * Determines the best strategy for resolving conflicts
     */
    private static determineResolutionStrategy;
    /**
     * Resolves a conflict by applying the determined strategy
     */
    static resolveConflict(conflict: RuleConflict, allRules: Map<string, Rule>): Rule | null;
    /**
     * Helper to resolve by priority or recency
     */
    private static resolveBySorting;
    /**
     * Creates a fusion rule that combines conflicting properties
     */
    private static createFusionRule;
    /**
     * Validates if a rule change would create dangerous cascades
     */
    static validateRuleSafety(newRule: Rule, existingRules: Rule[]): {
        safe: boolean;
        warnings: string[];
    };
    private static couldCreateInfiniteLoop;
    private static couldCreateExponentialGrowth;
    private static couldCreateUnwinnableState;
}
export declare class EffectThrottleManager {
    private static readonly THROTTLE_LIMITS;
    static shouldThrottleEffect(effectName: string, throttles: Map<string, EffectThrottle>): boolean;
    static cleanupExpiredThrottles(throttles: Map<string, EffectThrottle>): void;
}
