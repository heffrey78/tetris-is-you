export interface GameConfig {
    // Initial rules applied at game start
    initialRules: Array<{
        noun: string;
        property: string;
        priority: number;
    }>;
    
    // Spell effect durations (in milliseconds)
    spellDurations: {
        explosion: number;
        lightning: number;
        acidBath: number;
        shield: number;
        freeze: number;
        magnet: number;
        teleport: number;
        multiply: number;
        heal: number;
        transform: number;
    };
    
    // Game progression settings
    progression: {
        baseDropInterval: number;
        speedIncreasePerLevel: number;
        linesPerLevel: number;
    };
    
    // Visual settings
    visual: {
        enableEnhancedEffects: boolean;
        glowIntensity: number;
        animationSpeed: number;
    };
    
    // Effect throttling
    throttling: {
        maxEffectsPerSecond: number;
        effectCooldownMs: number;
    };
}

// Default configuration
export const DEFAULT_CONFIG: GameConfig = {
    initialRules: [
        { noun: 'BLOCK', property: 'SOLID', priority: 100 },
        { noun: 'WALL', property: 'STOP', priority: 100 },
        // Start with minimal special effects
        { noun: 'T', property: 'BOMB', priority: 100 },
        { noun: 'I', property: 'LIGHTNING', priority: 100 }
    ],
    
    spellDurations: {
        explosion: 2000,    // 2 seconds (reduced from previous longer duration)
        lightning: 1500,    // 1.5 seconds
        acidBath: 2000,     // 2 seconds (reduced from too-long duration)
        shield: 3000,       // 3 seconds
        freeze: 2500,       // 2.5 seconds
        magnet: 2000,       // 2 seconds
        teleport: 1000,     // 1 second (quick effect)
        multiply: 1500,     // 1.5 seconds
        heal: 1000,         // 1 second (quick positive effect)
        transform: 2000     // 2 seconds
    },
    
    progression: {
        baseDropInterval: 1000,      // 1 second
        speedIncreasePerLevel: 0.9,  // 10% faster each level
        linesPerLevel: 10            // Level up every 10 lines
    },
    
    visual: {
        enableEnhancedEffects: true,
        glowIntensity: 0.7,
        animationSpeed: 1.0
    },
    
    throttling: {
        maxEffectsPerSecond: 10,
        effectCooldownMs: 100
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
            explosion: 3000,    // Longer duration for easier gameplay
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
            explosion: 1000,    // Shorter duration for more challenge
            acidBath: 1500
        }
    }
};