import { Rule, RuleConflict, EffectThrottle } from './types.js';

export class RuleConflictResolver {
    
    /**
     * Detects conflicts when multiple rules affect the same noun
     */
    public static detectConflicts(newRule: Rule, existingRules: Rule[]): RuleConflict | null {
        const conflictingRules = existingRules.filter(rule => 
            rule.active && 
            rule.noun === newRule.noun && 
            rule.property !== newRule.property &&
            this.arePropertiesConflicting(rule.property, newRule.property)
        );

        if (conflictingRules.length === 0) {
            return null;
        }

        return {
            conflictingRules: [...conflictingRules, newRule],
            noun: newRule.noun,
            properties: [newRule.property, ...conflictingRules.map(r => r.property)],
            resolution: this.determineResolutionStrategy(conflictingRules, newRule)
        };
    }

    /**
     * Determines if two properties conflict with each other
     */
    private static arePropertiesConflicting(prop1: string, prop2: string): boolean {
        // Define conflicting property pairs
        const conflictingPairs = [
            ['SOLID', 'GHOST'],
            ['WIN', 'LOSE'],
            ['FREEZE', 'FAST'],
            ['MELT', 'SHIELD'],
            ['BOMB', 'HEAL'],
            // Color conflicts
            ['RED', 'BLUE'],
            ['RED', 'GREEN'], 
            ['BLUE', 'GREEN']
        ];

        return conflictingPairs.some(([a, b]) => 
            (prop1 === a && prop2 === b) || (prop1 === b && prop2 === a)
        );
    }

    /**
     * Determines the best strategy for resolving conflicts
     */
    private static determineResolutionStrategy(
        conflictingRules: Rule[], 
        newRule: Rule
    ): 'priority' | 'newest' | 'fusion' | 'cancel' {
        
        // If there's a clear priority difference, use priority
        const maxPriority = Math.max(...conflictingRules.map(r => r.priority));
        if (newRule.priority > maxPriority) {
            return 'priority';
        }

        // If multiple fusion rules conflict, cancel to prevent chaos
        const fusionRules = conflictingRules.filter(r => r.source === 'fusion');
        if (fusionRules.length >= 2) {
            return 'cancel';
        }

        // Critical conflicts (WIN vs LOSE) get special handling
        const properties = [newRule.property, ...conflictingRules.map(r => r.property)];
        if (properties.includes('WIN') && properties.includes('LOSE')) {
            return 'cancel'; // Prevent unwinnable states
        }

        // Default to newest rule (recency bias for player control)
        return 'newest';
    }

    /**
     * Resolves a conflict by applying the determined strategy
     */
    public static resolveConflict(conflict: RuleConflict, allRules: Map<string, Rule>): Rule | null {
        switch (conflict.resolution) {
            case 'priority':
                return this.resolveBySorting(conflict.conflictingRules, 'priority');
                
            case 'newest':
                return this.resolveBySorting(conflict.conflictingRules, 'newest');
                
            case 'fusion':
                return this.createFusionRule(conflict.conflictingRules);
                
            case 'cancel':
                // Deactivate all conflicting rules
                conflict.conflictingRules.forEach(rule => {
                    const existingRule = allRules.get(rule.id);
                    if (existingRule) {
                        existingRule.active = false;
                    }
                });
                console.log(`🚫 Cancelled conflicting rules for [${conflict.noun}]: ${conflict.properties.join(', ')}`);
                return null;
                
            default:
                return null;
        }
    }

    /**
     * Helper to resolve by priority or recency
     */
    private static resolveBySorting(rules: Rule[], method: 'priority' | 'newest'): Rule {
        if (method === 'priority') {
            return rules.reduce((highest, current) => 
                current.priority > highest.priority ? current : highest
            );
        } else {
            return rules.reduce((newest, current) => 
                current.createdAt > newest.createdAt ? current : newest
            );
        }
    }

    /**
     * Creates a fusion rule that combines conflicting properties
     */
    private static createFusionRule(rules: Rule[]): Rule {
        const noun = rules[0].noun;
        const properties = rules.map(r => r.property).sort();
        const fusionProperty = `FUSION_${properties.join('_')}`;
        
        return {
            id: `fusion-${Date.now()}`,
            noun,
            property: fusionProperty,
            active: true,
            createdAt: Date.now(),
            priority: 350, // Higher than normal fusion rules
            source: 'fusion'
        };
    }

    /**
     * Validates if a rule change would create dangerous cascades
     */
    public static validateRuleSafety(newRule: Rule, existingRules: Rule[]): { safe: boolean; warnings: string[] } {
        const warnings: string[] = [];
        
        // Check for infinite loops
        if (this.couldCreateInfiniteLoop(newRule, existingRules)) {
            warnings.push(`Potential infinite loop: ${newRule.noun} IS ${newRule.property}`);
        }
        
        // Check for exponential growth
        if (this.couldCreateExponentialGrowth(newRule, existingRules)) {
            warnings.push(`Exponential growth risk: ${newRule.noun} IS ${newRule.property}`);
        }
        
        // Check for unwinnable states
        if (this.couldCreateUnwinnableState(newRule, existingRules)) {
            warnings.push(`May create unwinnable state: ${newRule.noun} IS ${newRule.property}`);
        }
        
        return {
            safe: warnings.length === 0,
            warnings
        };
    }

    private static couldCreateInfiniteLoop(newRule: Rule, existingRules: Rule[]): boolean {
        // Example: BLOCK IS MULTIPLY + BLOCK IS SPAWN could create infinite blocks
        if (newRule.property === 'MULTIPLY') {
            return existingRules.some(r => 
                r.noun === newRule.noun && 
                ['SPAWN', 'TRANSFORM', 'TELEPORT'].includes(r.property)
            );
        }
        return false;
    }

    private static couldCreateExponentialGrowth(newRule: Rule, existingRules: Rule[]): boolean {
        // MULTIPLY + BOMB could create exponentially spreading explosions
        const dangerousCombos = [
            ['MULTIPLY', 'BOMB'],
            ['SPAWN', 'MULTIPLY'],
            ['TRANSFORM', 'MULTIPLY']
        ];
        
        return dangerousCombos.some(([prop1, prop2]) => {
            return (newRule.property === prop1 && existingRules.some(r => r.property === prop2)) ||
                   (newRule.property === prop2 && existingRules.some(r => r.property === prop1));
        });
    }

    private static couldCreateUnwinnableState(newRule: Rule, existingRules: Rule[]): boolean {
        // All blocks become LOSE
        if (newRule.noun === 'BLOCK' && newRule.property === 'LOSE') {
            return !existingRules.some(r => r.property === 'WIN');
        }
        return false;
    }
}

export class EffectThrottleManager {
    private static readonly THROTTLE_LIMITS: Record<string, { maxPerSecond: number; windowMs: number }> = {
        'BOMB': { maxPerSecond: 5, windowMs: 1000 },
        'MULTIPLY': { maxPerSecond: 3, windowMs: 1000 },
        'SPAWN': { maxPerSecond: 2, windowMs: 1000 },
        'TELEPORT': { maxPerSecond: 10, windowMs: 1000 },
        'LIGHTNING': { maxPerSecond: 8, windowMs: 1000 }
    };

    public static shouldThrottleEffect(effectName: string, throttles: Map<string, EffectThrottle>): boolean {
        const limit = this.THROTTLE_LIMITS[effectName];
        if (!limit) return false; // No throttling needed

        const currentTime = Date.now();
        const throttle = throttles.get(effectName);

        if (!throttle) {
            // Initialize throttle tracking
            throttles.set(effectName, {
                effectName,
                maxPerSecond: limit.maxPerSecond,
                currentCount: 1,
                windowStart: currentTime
            });
            return false;
        }

        // Reset window if enough time has passed
        if (currentTime - throttle.windowStart >= limit.windowMs) {
            throttle.currentCount = 1;
            throttle.windowStart = currentTime;
            return false;
        }

        // Check if we've exceeded the limit
        if (throttle.currentCount >= limit.maxPerSecond) {
            console.log(`🚫 Throttling ${effectName}: ${throttle.currentCount}/${limit.maxPerSecond} in window`);
            return true;
        }

        throttle.currentCount++;
        return false;
    }

    public static cleanupExpiredThrottles(throttles: Map<string, EffectThrottle>): void {
        const currentTime = Date.now();
        
        for (const [key, throttle] of throttles.entries()) {
            const limit = this.THROTTLE_LIMITS[throttle.effectName];
            if (limit && currentTime - throttle.windowStart >= limit.windowMs) {
                throttles.delete(key);
            }
        }
    }
}