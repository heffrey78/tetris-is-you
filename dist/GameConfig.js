// Default configuration
export const DEFAULT_CONFIG = {
    initialRules: [
        { noun: 'BLOCK', property: 'SOLID', priority: 100 },
        { noun: 'WALL', property: 'STOP', priority: 100 },
        // Start with minimal special effects
        { noun: 'T', property: 'BOMB', priority: 100 },
        { noun: 'I', property: 'LIGHTNING', priority: 100 }
    ],
    spellDurations: {
        explosion: 2000, // 2 seconds (reduced from previous longer duration)
        lightning: 1500, // 1.5 seconds
        acidBath: 2000, // 2 seconds (reduced from too-long duration)
        shield: 3000, // 3 seconds
        freeze: 2500, // 2.5 seconds
        magnet: 2000, // 2 seconds
        teleport: 1000, // 1 second (quick effect)
        multiply: 1500, // 1.5 seconds
        heal: 1000, // 1 second (quick positive effect)
        transform: 2000 // 2 seconds
    },
    progression: {
        baseDropInterval: 1000, // 1 second
        speedIncreasePerLevel: 0.9, // 10% faster each level
        linesPerLevel: 10 // Level up every 10 lines
    },
    visual: {
        enableEnhancedEffects: true,
        glowIntensity: 0.7,
        animationSpeed: 1.0,
        effectQuality: 'high'
    },
    throttling: {
        maxEffectsPerSecond: 10,
        effectCooldownMs: 100
    },
    effectIntensity: {
        particleCount: 1.0,
        lightningComplexity: 1.0,
        explosionRadius: 1.0,
        sparkDensity: 1.0,
        glowRadius: 1.0,
        animationDuration: 1.0,
        maxConcurrentEffects: 15
    }
};
// Configuration profiles for different difficulty levels
export const DIFFICULTY_CONFIGS = {
    EASY: {
        ...DEFAULT_CONFIG,
        initialRules: [
            { noun: 'BLOCK', property: 'SOLID', priority: 100 },
            { noun: 'WALL', property: 'STOP', priority: 100 }
            // No special effects initially
        ],
        spellDurations: {
            ...DEFAULT_CONFIG.spellDurations,
            explosion: 3000, // Longer duration for easier gameplay
            acidBath: 3000
        }
    },
    NORMAL: DEFAULT_CONFIG,
    HARD: {
        ...DEFAULT_CONFIG,
        initialRules: [
            { noun: 'BLOCK', property: 'SOLID', priority: 100 },
            { noun: 'WALL', property: 'STOP', priority: 100 },
            { noun: 'T', property: 'BOMB', priority: 100 },
            { noun: 'I', property: 'LIGHTNING', priority: 100 },
            { noun: 'S', property: 'GHOST', priority: 100 },
            { noun: 'Z', property: 'MAGNET', priority: 100 }
        ],
        spellDurations: {
            ...DEFAULT_CONFIG.spellDurations,
            explosion: 1000, // Shorter duration for more challenge
            acidBath: 1500
        }
    }
};
// Effect quality presets
export const EFFECT_QUALITY_PRESETS = {
    low: {
        particleCount: 0.3,
        lightningComplexity: 0.5,
        explosionRadius: 0.6,
        sparkDensity: 0.2,
        glowRadius: 0.5,
        animationDuration: 0.7,
        maxConcurrentEffects: 5
    },
    medium: {
        particleCount: 0.7,
        lightningComplexity: 0.8,
        explosionRadius: 0.8,
        sparkDensity: 0.6,
        glowRadius: 0.8,
        animationDuration: 0.9,
        maxConcurrentEffects: 10
    },
    high: {
        particleCount: 1.0,
        lightningComplexity: 1.0,
        explosionRadius: 1.0,
        sparkDensity: 1.0,
        glowRadius: 1.0,
        animationDuration: 1.0,
        maxConcurrentEffects: 15
    },
    ultra: {
        particleCount: 1.5,
        lightningComplexity: 1.8,
        explosionRadius: 1.4,
        sparkDensity: 1.6,
        glowRadius: 1.3,
        animationDuration: 1.2,
        maxConcurrentEffects: 20
    }
};
//# sourceMappingURL=GameConfig.js.map