import { DEFAULT_CONFIG } from './GameConfig.js';
export class ConfigLoader {
    constructor() {
        this.currentConfig = DEFAULT_CONFIG;
    }
    static getInstance() {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }
    /**
     * Load configuration from a JSON file path
     * In a browser environment, this would require the JSON to be served as a static asset
     */
    async loadConfig(configPath) {
        try {
            // In a browser environment, we'd fetch the config file
            const response = await fetch(configPath);
            if (!response.ok) {
                console.warn(`Failed to load config from ${configPath}, using default config`);
                return DEFAULT_CONFIG;
            }
            const configData = await response.json();
            this.currentConfig = this.validateAndMergeConfig(configData);
            console.log(`✅ Loaded configuration from ${configPath}`);
            return this.currentConfig;
        }
        catch (error) {
            console.warn(`Failed to load config from ${configPath}:`, error);
            console.log('Using default configuration');
            return DEFAULT_CONFIG;
        }
    }
    /**
     * Load configuration based on difficulty level
     */
    async loadDifficultyConfig(difficulty) {
        const configPaths = {
            easy: '/config/easy-config.json',
            normal: '/config/game-config.json',
            hard: '/config/hard-config.json'
        };
        return this.loadConfig(configPaths[difficulty]);
    }
    /**
     * Validate and merge loaded config with defaults to ensure all properties exist
     */
    validateAndMergeConfig(loadedConfig) {
        return {
            initialRules: loadedConfig.initialRules || DEFAULT_CONFIG.initialRules,
            spellDurations: {
                ...DEFAULT_CONFIG.spellDurations,
                ...loadedConfig.spellDurations
            },
            progression: {
                ...DEFAULT_CONFIG.progression,
                ...loadedConfig.progression
            },
            visual: {
                ...DEFAULT_CONFIG.visual,
                ...loadedConfig.visual
            },
            throttling: {
                ...DEFAULT_CONFIG.throttling,
                ...loadedConfig.throttling
            }
        };
    }
    /**
     * Get current configuration
     */
    getCurrentConfig() {
        return this.currentConfig;
    }
    /**
     * Update current configuration
     */
    updateConfig(newConfig) {
        this.currentConfig = {
            ...this.currentConfig,
            ...newConfig
        };
    }
    /**
     * Save current configuration to localStorage (browser persistence)
     */
    saveConfigToStorage(key = 'tetris-game-config') {
        try {
            localStorage.setItem(key, JSON.stringify(this.currentConfig));
            console.log('✅ Configuration saved to localStorage');
        }
        catch (error) {
            console.warn('Failed to save configuration to localStorage:', error);
        }
    }
    /**
     * Load configuration from localStorage
     */
    loadConfigFromStorage(key = 'tetris-game-config') {
        try {
            const storedConfig = localStorage.getItem(key);
            if (storedConfig) {
                const parsedConfig = JSON.parse(storedConfig);
                this.currentConfig = this.validateAndMergeConfig(parsedConfig);
                console.log('✅ Configuration loaded from localStorage');
                return this.currentConfig;
            }
        }
        catch (error) {
            console.warn('Failed to load configuration from localStorage:', error);
        }
        return DEFAULT_CONFIG;
    }
}
//# sourceMappingURL=ConfigLoader.js.map