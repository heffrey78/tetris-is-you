import { Renderer } from './Renderer.js';
import { RuleEngine } from './RuleEngine.js';
import { WordQueue } from './WordQueue.js';
import { GameLogic } from './GameLogic.js';
import { UIManager } from './UIManager.js';
import { GameLogger } from './GameLogger.js';
import { ConfigLoader } from './ConfigLoader.js';
import { DEFAULT_CONFIG } from './GameConfig.js';
import { AudioSystem } from './AudioSystem.js';
import { LAYOUT } from './types.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { DifficultyScaler } from './DifficultyScaler.js';
export class Game {
    constructor(canvas, config = DEFAULT_CONFIG) {
        this.gameLoop = 0;
        this.lastTime = 0;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.canvas = canvas;
        this.config = config;
        this.renderer = new Renderer(canvas);
        this.gameLogger = new GameLogger();
        this.audioSystem = new AudioSystem();
        this.ruleEngine = new RuleEngine(this.gameLogger, this.config);
        this.wordQueue = new WordQueue();
        this.performanceMonitor = new PerformanceMonitor();
        this.difficultyScaler = new DifficultyScaler(this.config, this.ruleEngine);
        this.setupCanvas();
        this.initializeGameState();
        this.uiManager = new UIManager(this.renderer.getEffectManager());
        this.gameLogic = new GameLogic(this.gameState, this.ruleEngine, this.wordQueue, this.gameLogger);
        this.gameLogic.setUIManager(this.uiManager);
        this.gameLogic.setEffectManager(this.renderer.getEffectManager());
        this.gameLogic.setAudioSystem(this.audioSystem);
        this.gameLogic.setDifficultyScaler(this.difficultyScaler);
        // Configure EffectManager with intensity settings
        this.renderer.getEffectManager().setConfig(this.config);
        // Set up effect settings callback
        this.uiManager.setEffectSettingsCallback((configUpdate) => this.updateEffectSettings(configUpdate));
        this.uiManager.updateEffectSettings(this.config);
        // Set up performance monitoring auto-adjustment
        this.setupPerformanceMonitoring();
        this.gameLogger.logInfo('GAME', 'Game initialized with enhanced rule engine and configuration');
    }
    /**
     * Set up performance monitoring and auto-adjustment
     */
    setupPerformanceMonitoring() {
        // Listen for performance adjustment events
        window.addEventListener('performanceAdjustment', (event) => {
            const customEvent = event;
            const { qualityLevel, qualityName, currentFPS, averageFPS } = customEvent.detail;
            console.log(`🎯 Auto-adjusting effect quality: ${qualityName} (FPS: ${averageFPS.toFixed(1)})`);
            // Apply quality preset based on performance
            const presets = ['low', 'medium', 'high', 'ultra'];
            const presetName = presets[qualityLevel];
            if (presetName && this.config.visual.effectQuality !== presetName) {
                this.config.visual.effectQuality = presetName;
                // Update effect intensity based on quality level
                this.applyQualityPreset(presetName);
                // Update UI to reflect changes
                this.uiManager.updateEffectSettings(this.config);
                console.log(`✨ Effect quality automatically adjusted to ${presetName}`);
            }
        });
    }
    /**
     * Apply quality preset to effect intensity
     */
    applyQualityPreset(preset) {
        const presets = {
            low: { particleCount: 0.3, maxConcurrentEffects: 5 },
            medium: { particleCount: 0.7, maxConcurrentEffects: 10 },
            high: { particleCount: 1.0, maxConcurrentEffects: 15 },
            ultra: { particleCount: 1.5, maxConcurrentEffects: 20 }
        };
        const presetConfig = presets[preset];
        if (presetConfig) {
            this.config.effectIntensity.particleCount = presetConfig.particleCount;
            this.config.effectIntensity.maxConcurrentEffects = presetConfig.maxConcurrentEffects;
            // Apply to EffectManager
            this.renderer.getEffectManager().setConfig(this.config);
        }
    }
    /**
     * Load and apply a new configuration
     */
    async loadConfiguration(difficulty) {
        const configLoader = ConfigLoader.getInstance();
        this.config = await configLoader.loadDifficultyConfig(difficulty);
        // Reinitialize the RuleEngine with the new config
        this.ruleEngine = new RuleEngine(this.gameLogger, this.config);
        this.gameLogic.setRuleEngine(this.ruleEngine);
        // Update EffectManager with new configuration
        this.renderer.getEffectManager().setConfig(this.config);
        this.gameLogger.logInfo('GAME', `Configuration loaded: ${difficulty} mode`);
    }
    /**
     * Get current configuration
     */
    getConfiguration() {
        return this.config;
    }
    /**
     * Get audio system for external control
     */
    getAudioSystem() {
        return this.audioSystem;
    }
    /**
     * Get performance monitor for testing and metrics
     */
    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
    /**
     * Get difficulty scaler for testing and metrics
     */
    getDifficultyScaler() {
        return this.difficultyScaler;
    }
    /**
     * Update effect settings in real-time
     */
    updateEffectSettings(configUpdate) {
        // Merge the update with current config
        if (configUpdate.visual) {
            this.config.visual = { ...this.config.visual, ...configUpdate.visual };
        }
        if (configUpdate.effectIntensity) {
            this.config.effectIntensity = { ...this.config.effectIntensity, ...configUpdate.effectIntensity };
        }
        // Apply to EffectManager
        this.renderer.getEffectManager().setConfig(this.config);
        console.log('🎨 Effect settings updated:', configUpdate);
    }
    setupCanvas() {
        // Calculate optimal canvas size based on container using proper 80/20 split
        const container = document.getElementById('gameContainer');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            // Implement true 80/20 split - canvas gets 80% of container width
            const availableWidth = containerRect.width * LAYOUT.PLAYFIELD_WIDTH_RATIO; // 80% for canvas
            const availableHeight = containerRect.height - 40; // Leave margin for borders
            // Calculate size based on grid requirements for playfield only
            const gridCols = LAYOUT.PLAYFIELD_COLS;
            const gridRows = LAYOUT.PLAYFIELD_ROWS;
            const baseGridSize = LAYOUT.GRID_SIZE;
            // Calculate ideal playfield size
            const idealPlayfieldWidth = gridCols * baseGridSize;
            const idealPlayfieldHeight = gridRows * baseGridSize;
            // Add margins and side panel space for total canvas width
            const sidePanelRatio = 1 - LAYOUT.PLAYFIELD_WIDTH_RATIO; // 20%
            const idealCanvasWidth = idealPlayfieldWidth + (LAYOUT.MARGIN * 3); // Left, middle, right margins
            // Scale to fit available space
            const widthScale = availableWidth / idealCanvasWidth;
            const heightScale = availableHeight / (idealPlayfieldHeight + LAYOUT.MARGIN * 2);
            const scale = Math.min(widthScale, heightScale, 1.0); // Don't scale up beyond 1.0
            // Set final canvas dimensions with extra space for borders
            const borderPadding = 6; // Extra space for 3px border on each side
            this.canvas.width = Math.floor(idealCanvasWidth * scale) + borderPadding;
            this.canvas.height = Math.floor((idealPlayfieldHeight + LAYOUT.MARGIN * 2) * scale) + borderPadding;
            // Update layout constants to match scaled canvas
            const scaledGridSize = Math.floor(baseGridSize * scale);
            const scaledMargin = Math.floor(LAYOUT.MARGIN * scale);
            // Preserve original constants, create scaled versions
            LAYOUT.SCALED_GRID_SIZE = scaledGridSize;
            LAYOUT.SCALED_MARGIN = scaledMargin;
            LAYOUT.PLAYFIELD_PIXEL_WIDTH = gridCols * scaledGridSize;
            LAYOUT.PLAYFIELD_PIXEL_HEIGHT = gridRows * scaledGridSize;
        }
        else {
            // Fallback to fixed size with proper proportions
            const borderPadding = 6; // Extra space for borders
            this.canvas.width = 800 + borderPadding; // 80%
            this.canvas.height = 600 + borderPadding;
            LAYOUT.SCALED_GRID_SIZE = LAYOUT.GRID_SIZE;
            LAYOUT.SCALED_MARGIN = LAYOUT.MARGIN;
            LAYOUT.PLAYFIELD_PIXEL_WIDTH = LAYOUT.PLAYFIELD_COLS * LAYOUT.GRID_SIZE;
            LAYOUT.PLAYFIELD_PIXEL_HEIGHT = LAYOUT.PLAYFIELD_ROWS * LAYOUT.GRID_SIZE;
        }
        console.log(`Canvas sized to: ${this.canvas.width}x${this.canvas.height} (80/20 split)`);
        console.log(`Playfield: ${LAYOUT.PLAYFIELD_PIXEL_WIDTH}x${LAYOUT.PLAYFIELD_PIXEL_HEIGHT}, Grid: ${LAYOUT.SCALED_GRID_SIZE}px`);
    }
    initializeGameState() {
        this.gameState = {
            score: 0,
            level: 1,
            linesCleared: 0,
            gameOver: false,
            paused: false,
            currentPiece: null,
            nextPiece: null,
            playfield: this.createEmptyPlayfield(),
            rules: this.ruleEngine.getActiveRules(),
            wordQueue: this.wordQueue.getQueue(),
            ruleMatrix: this.wordQueue.updateRuleMatrix(this.ruleEngine.getActiveRules()),
            ruleConflicts: this.ruleEngine.getRuleConflicts(),
            effectThrottles: this.ruleEngine.getEffectThrottles()
        };
    }
    createEmptyPlayfield() {
        const playfield = [];
        for (let row = 0; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            playfield[row] = [];
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
                playfield[row][col] = null;
            }
        }
        return playfield;
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        // Initialize audio system
        await this.audioSystem.resumeContext();
        this.audioSystem.playMusic();
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.loop(time));
        console.log('Game started with audio system');
    }
    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        console.log('Game stopped');
    }
    pause() {
        this.isPaused = !this.isPaused;
        this.gameState.paused = this.isPaused;
        if (this.isPaused) {
            this.uiManager.showPauseScreen();
            console.log('Game paused');
        }
        else {
            this.uiManager.hidePauseScreen();
            console.log('Game resumed');
        }
    }
    loop(currentTime) {
        if (!this.isRunning)
            return;
        const deltaTime = currentTime - this.lastTime;
        if (deltaTime >= this.frameTime) {
            if (!this.isPaused) {
                this.update(deltaTime);
                this.render();
            }
            this.lastTime = currentTime - (deltaTime % this.frameTime);
        }
        // Update performance monitoring
        this.performanceMonitor.update(currentTime);
        this.gameLoop = requestAnimationFrame((time) => this.loop(time));
    }
    update(deltaTime) {
        // Update game logic (piece falling, collision, etc.) FIRST
        this.gameLogic.update(deltaTime);
        // Then update game state from engines (after any rule changes)
        this.gameState.rules = this.ruleEngine.getActiveRules();
        this.gameState.wordQueue = this.wordQueue.getQueue();
        this.gameState.ruleMatrix = this.wordQueue.updateRuleMatrix(this.ruleEngine.getActiveRules());
        this.gameState.ruleConflicts = this.ruleEngine.getRuleConflicts();
        this.gameState.effectThrottles = this.ruleEngine.getEffectThrottles();
        // Validate word queue balance
        this.wordQueue.validateBalance();
        // Check win conditions
        if (this.ruleEngine.checkWinCondition(this.gameState)) {
            console.log('Win condition met!');
            this.gameState.gameOver = true;
        }
        // Show game over screen if needed
        if (this.gameState.gameOver) {
            this.uiManager.showGameOver();
        }
    }
    render() {
        this.renderer.render(this.gameState, this.frameTime);
        this.uiManager.updateUI(this.gameState);
        this.uiManager.updateScore(this.gameState.score, this.gameState.level, this.gameState.linesCleared);
        // Update difficulty display
        const difficultyState = this.gameLogic.getDifficultyState();
        if (difficultyState) {
            this.uiManager.updateDifficultyDisplay(difficultyState);
        }
    }
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyP':
                event.preventDefault();
                this.pause();
                break;
            case 'KeyR':
                if (this.gameState.gameOver) {
                    this.restart();
                }
                break;
            case 'KeyT':
                // Add test blocks for line clearing demo
                this.gameLogic.addTestBlocks();
                break;
            case 'KeyB':
                // Add BOMB test blocks for spell testing
                this.gameLogic.addBombTestBlocks();
                break;
            case 'KeyG':
                // Add GHOST test blocks for collision testing
                this.gameLogic.addGhostTestBlocks();
                break;
            case 'KeyC':
                // Test rule conflicts
                this.gameLogic.addConflictTestBlocks();
                break;
            case 'KeyH':
                // Test throttling with lots of effects
                this.gameLogic.testThrottling();
                break;
            case 'KeyS':
                // Test spell effects directly
                this.gameLogic.testSpellEffects();
                break;
            case 'KeyV':
                // Test all visual block states
                this.gameLogic.testVisualStates();
                break;
            case 'KeyL':
                // Download game logs
                this.gameLogger.downloadLogs();
                break;
            case 'KeyM':
                // Show metrics in console
                this.gameLogger.logMetrics();
                console.log('Interactivity Score:', this.gameLogger.getInteractivityScore());
                break;
            case 'Digit1':
                // Test 1-line clear effect
                this.testLineClear(1);
                break;
            case 'Digit2':
                // Test 2-line clear effect
                this.testLineClear(2);
                break;
            case 'Digit3':
                // Test 3-line clear effect
                this.testLineClear(3);
                break;
            case 'Digit4':
                // Test 4-line clear effect (Tetris)
                this.testLineClear(4);
                break;
            case 'ArrowLeft':
                this.gameLogic.movePieceLeft();
                break;
            case 'ArrowRight':
                this.gameLogic.movePieceRight();
                break;
            case 'ArrowDown':
                this.gameLogic.movePieceDown();
                break;
            case 'ArrowUp':
                this.gameLogic.rotatePiece();
                break;
            case 'Space':
                event.preventDefault();
                this.gameLogic.dropPiece();
                break;
        }
    }
    handleKeyUp(event) {
        // Handle key releases if needed
    }
    testLineClear(linesCleared) {
        console.log(`Testing ${linesCleared}-line clear effect`);
        // Consume words from queue and apply rule changes
        const consumedWords = this.wordQueue.consumeWords(Math.min(linesCleared, 3));
        this.ruleEngine.applyLineClearEffect(linesCleared, consumedWords);
        // Update game state
        this.gameState.linesCleared += linesCleared;
        this.gameState.score += linesCleared * 100;
    }
    restart() {
        console.log('Restarting game...');
        // Hide overlays
        this.uiManager.hideGameOver();
        this.uiManager.hidePauseScreen();
        // Clear existing effects to prevent memory leaks
        this.renderer.getEffectManager().clear();
        // Reset game state with proper configuration
        this.ruleEngine = new RuleEngine(this.gameLogger, this.config);
        this.wordQueue = new WordQueue();
        this.difficultyScaler = new DifficultyScaler(this.config, this.ruleEngine);
        this.initializeGameState();
        this.gameLogic = new GameLogic(this.gameState, this.ruleEngine, this.wordQueue, this.gameLogger);
        // Reconnect all dependencies that were lost
        this.gameLogic.setUIManager(this.uiManager);
        this.gameLogic.setEffectManager(this.renderer.getEffectManager());
        this.gameLogic.setAudioSystem(this.audioSystem);
        this.gameLogic.setDifficultyScaler(this.difficultyScaler);
        // Reconfigure EffectManager with current settings
        this.renderer.getEffectManager().setConfig(this.config);
        // Reset game flags
        this.isPaused = false;
        this.gameState.paused = false;
        this.gameState.gameOver = false;
        console.log('Game restarted with all systems reinitialized');
    }
}
//# sourceMappingURL=Game.js.map