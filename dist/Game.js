import { Renderer } from './Renderer.js';
import { RuleEngine } from './RuleEngine.js';
import { WordQueue } from './WordQueue.js';
import { GameLogic } from './GameLogic.js';
import { UIManager } from './UIManager.js';
import { GameLogger } from './GameLogger.js';
import { LAYOUT } from './types.js';
export class Game {
    constructor(canvas) {
        this.gameLoop = 0;
        this.lastTime = 0;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.gameLogger = new GameLogger();
        this.ruleEngine = new RuleEngine(this.gameLogger);
        this.wordQueue = new WordQueue();
        this.setupCanvas();
        this.initializeGameState();
        this.uiManager = new UIManager();
        this.gameLogic = new GameLogic(this.gameState, this.ruleEngine, this.wordQueue, this.gameLogger);
        this.gameLogic.setUIManager(this.uiManager);
        this.gameLogger.logInfo('GAME', 'Game initialized with enhanced rule engine and logging');
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
            // Set final canvas dimensions
            this.canvas.width = Math.floor(idealCanvasWidth * scale);
            this.canvas.height = Math.floor((idealPlayfieldHeight + LAYOUT.MARGIN * 2) * scale);
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
            this.canvas.width = 800; // 80%
            this.canvas.height = 600;
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
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.loop(time));
        console.log('Game started');
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
        this.renderer.render(this.gameState);
        this.uiManager.updateUI(this.gameState);
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
                // Test visual spell notifications directly
                this.uiManager.showSpellEffectNotification('BOMB', 1);
                setTimeout(() => this.uiManager.showSpellEffectNotification('LIGHTNING', 1), 1000);
                setTimeout(() => this.uiManager.showSpellEffectNotification('SPELL_COMBO', 3), 2000);
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
        // Reset game state
        this.ruleEngine = new RuleEngine();
        this.wordQueue = new WordQueue();
        this.initializeGameState();
        this.gameLogic = new GameLogic(this.gameState, this.ruleEngine, this.wordQueue);
        // Reset game flags
        this.isPaused = false;
        this.gameState.paused = false;
        this.gameState.gameOver = false;
        console.log('Game restarted');
    }
}
//# sourceMappingURL=Game.js.map