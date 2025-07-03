import { GameState, LAYOUT, PlayfieldCell, TetrisBlock, Position, Rule, Color } from './types.js';
import { TetrisPiece } from './TetrisPiece.js';
import { RuleEngine } from './RuleEngine.js';
import { WordQueue } from './WordQueue.js';
import { RuleEffects } from './RuleEffects.js';
import type { GameLogger } from './GameLogger.js';
import type { EffectManager } from './EffectManager.js';

export class GameLogic {
    private dropTimer: number = 0;
    private baseDropInterval: number = 1000; // 1 second base speed
    private dropInterval: number = 1000; // Current drop interval
    private gameState: GameState;
    private ruleEngine: RuleEngine;
    private wordQueue: WordQueue;
    private logger?: GameLogger;
    private uiManager?: any; // Will be set from Game class
    private effectManager?: EffectManager; // Will be set from Game class

    constructor(gameState: GameState, ruleEngine: RuleEngine, wordQueue: WordQueue, logger?: GameLogger) {
        this.gameState = gameState;
        this.ruleEngine = ruleEngine;
        this.wordQueue = wordQueue;
        this.logger = logger;
    }
    
    public setUIManager(uiManager: any): void {
        this.uiManager = uiManager;
    }
    
    public setEffectManager(effectManager: EffectManager): void {
        this.effectManager = effectManager;
    }

    public update(deltaTime: number): void {
        if (this.gameState.gameOver || this.gameState.paused) {
            return;
        }

        // Handle piece falling
        this.updatePieceFalling(deltaTime);

        // Spawn new piece if needed
        if (!this.gameState.currentPiece) {
            this.spawnNewPiece();
        }
    }

    private updatePieceFalling(deltaTime: number): void {
        if (!this.gameState.currentPiece || !this.gameState.currentPiece.falling) {
            return;
        }

        // Apply rule-based speed modifications
        let effectiveDropInterval = this.dropInterval;
        
        // Check for SLOW rule (reduces falling speed) - this should now work!
        if (this.ruleEngine.hasProperty('PIECE', 'SLOW') || this.ruleEngine.hasProperty('BLOCK', 'SLOW')) {
            effectiveDropInterval *= 3; // 300% slower (more noticeable)
            console.log(`⏰ SLOW effect active! Drop interval increased to ${effectiveDropInterval}ms`);
        }
        
        // Check for FAST rule (increases falling speed)
        if (this.ruleEngine.hasProperty('PIECE', 'FAST') || this.ruleEngine.hasProperty('BLOCK', 'FAST')) {
            effectiveDropInterval *= 0.3; // 70% faster
            console.log(`⚡ FAST effect active! Drop interval decreased to ${effectiveDropInterval}ms`);
        }
        
        // Check for FREEZE rule (stops all movement)
        if (this.ruleEngine.hasProperty('PIECE', 'FREEZE') || this.ruleEngine.hasProperty('BLOCK', 'FREEZE')) {
            console.log(`❄️ FREEZE effect: Piece movement stopped`);
            return; // Don't update falling
        }

        this.dropTimer += deltaTime;
        if (this.dropTimer >= effectiveDropInterval) {
            this.dropTimer = 0;
            this.movePieceDown();
        }
    }

    public movePieceLeft(): boolean {
        if (!this.gameState.currentPiece) return false;
        
        const testPiece = (this.gameState.currentPiece as TetrisPiece).clone();
        testPiece.move(-1, 0);
        
        if (this.isValidPosition(testPiece)) {
            (this.gameState.currentPiece as TetrisPiece).move(-1, 0);
            return true;
        }
        return false;
    }

    public movePieceRight(): boolean {
        if (!this.gameState.currentPiece) return false;
        
        const testPiece = (this.gameState.currentPiece as TetrisPiece).clone();
        testPiece.move(1, 0);
        
        if (this.isValidPosition(testPiece)) {
            (this.gameState.currentPiece as TetrisPiece).move(1, 0);
            return true;
        }
        return false;
    }

    public movePieceDown(): boolean {
        if (!this.gameState.currentPiece) return false;
        
        const testPiece = (this.gameState.currentPiece as TetrisPiece).clone();
        testPiece.move(0, 1);
        
        if (this.isValidPosition(testPiece)) {
            (this.gameState.currentPiece as TetrisPiece).move(0, 1);
            return true;
        } else {
            // Piece has landed, place it
            this.placePiece();
            return false;
        }
    }

    public rotatePiece(clockwise: boolean = true): boolean {
        if (!this.gameState.currentPiece) return false;
        
        const testPiece = (this.gameState.currentPiece as TetrisPiece).clone();
        testPiece.rotate(clockwise);
        
        if (this.isValidPosition(testPiece)) {
            (this.gameState.currentPiece as TetrisPiece).rotate(clockwise);
            return true;
        }
        return false;
    }

    public dropPiece(): void {
        if (!this.gameState.currentPiece) return;
        
        while (this.movePieceDown()) {
            // Keep dropping until it can't move down anymore
        }
    }

    private isValidPosition(piece: TetrisPiece): boolean {
        const worldBlocks = piece.getWorldBlocks();
        
        for (const block of worldBlocks) {
            // Check bounds
            if (block.x < 0 || block.x >= LAYOUT.PLAYFIELD_COLS || 
                block.y < 0 || block.y >= LAYOUT.PLAYFIELD_ROWS) {
                return false;
            }
            
            // Check collision with placed blocks
            const existingBlock = this.gameState.playfield[block.y][block.x];
            if (existingBlock !== null) {
                // Rule-based collision: Check if existing block is GHOST (can pass through)
                if (this.hasSpellProperty(existingBlock, 'GHOST')) {
                    console.log(`👻 Passing through GHOST block at (${block.x}, ${block.y})`);
                    continue; // Can pass through ghost blocks
                }
                return false;
            }
        }
        
        return true;
    }

    private placePiece(): void {
        if (!this.gameState.currentPiece) return;
        
        const worldBlocks = (this.gameState.currentPiece as TetrisPiece).getWorldBlocks();
        
        // Place blocks in playfield
        for (const blockPos of worldBlocks) {
            if (blockPos.y >= 0 && blockPos.y < LAYOUT.PLAYFIELD_ROWS &&
                blockPos.x >= 0 && blockPos.x < LAYOUT.PLAYFIELD_COLS) {
                
                let block: TetrisBlock = {
                    x: blockPos.x,
                    y: blockPos.y,
                    color: this.getBlockColorFromRules(this.gameState.currentPiece.type),
                    solid: this.ruleEngine.hasProperty('BLOCK', 'SOLID'),
                    type: this.gameState.currentPiece.type
                };
                
                // Apply rule effects to the block with rule engine for throttling
                block = RuleEffects.applyRulesToBlock(block, this.gameState.rules, this.ruleEngine);
                
                this.gameState.playfield[blockPos.y][blockPos.x] = block;
            }
        }
        
        // Clear current piece
        this.gameState.currentPiece = null;
        
        // Check for completed lines
        const completedLines = this.checkCompletedLines();
        if (completedLines.length > 0) {
            console.log(`🎯 Detected ${completedLines.length} completed lines:`, completedLines);
            this.logger?.logLineClear(completedLines.length, completedLines, []);
            this.clearLines(completedLines);
        }
        
        // Check rule-based win/lose conditions first
        if (this.checkRuleBasedGameEnd()) {
            return;
        }
        
        // Check traditional game over condition
        if (this.isGameOver()) {
            this.gameState.gameOver = true;
        }
    }

    private spawnNewPiece(): void {
        const spawnPosition: Position = {
            x: Math.floor(LAYOUT.PLAYFIELD_COLS / 2) - 1,
            y: 0
        };
        
        // Use next piece or create random
        let newPiece: TetrisPiece;
        if (this.gameState.nextPiece) {
            newPiece = new TetrisPiece(this.gameState.nextPiece.type, spawnPosition);
        } else {
            newPiece = TetrisPiece.createRandomPiece(spawnPosition);
        }
        
        // Generate next piece
        const nextTypes = TetrisPiece.getNextPieces(1);
        this.gameState.nextPiece = new TetrisPiece(nextTypes[0], { x: 0, y: 0 });
        
        // Check if new piece can be placed
        if (this.isValidPosition(newPiece)) {
            this.gameState.currentPiece = newPiece;
        } else {
            this.gameState.gameOver = true;
        }
    }

    private checkCompletedLines(): number[] {
        const completedLines: number[] = [];
        
        for (let row = 0; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            let lineComplete = true;
            
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
                if (this.gameState.playfield[row][col] === null) {
                    lineComplete = false;
                    break;
                }
            }
            
            if (lineComplete) {
                completedLines.push(row);
            }
        }
        
        return completedLines;
    }

    private clearLines(lines: number[]): void {
        // Sort lines from bottom to top
        lines.sort((a, b) => b - a);
        
        // FIRST: Apply spell effects for blocks in cleared lines BEFORE removing them
        console.log(`🔧 Checking for spell effects in ${lines.length} cleared lines...`);
        this.applySpellEffects(lines);
        
        // THEN: Remove completed lines
        for (const lineIndex of lines) {
            this.gameState.playfield.splice(lineIndex, 1);
            
            // Add new empty line at top
            const newLine: PlayfieldCell[] = new Array(LAYOUT.PLAYFIELD_COLS).fill(null);
            this.gameState.playfield.unshift(newLine);
        }
        
        // Update game state
        this.gameState.linesCleared += lines.length;
        this.gameState.score += this.calculateScore(lines.length);
        
        // Update level every 10 lines and increase drop speed
        const newLevel = Math.floor(this.gameState.linesCleared / 10) + 1;
        if (newLevel > this.gameState.level) {
            this.gameState.level = newLevel;
            this.updateDropSpeed();
            console.log(`🎚️ Level up! Now at level ${this.gameState.level} (Drop speed increased)`);
        }
        
        // Consume words from queue and apply rule engine effects
        const wordsNeeded = Math.min(lines.length, 3);
        console.log(`🔧 About to consume ${wordsNeeded} words for ${lines.length}-line clear`);
        const consumedWords = this.wordQueue.consumeWords(wordsNeeded);
        console.log(`🔧 Consumed words:`, consumedWords.map(w => w.word));
        this.ruleEngine.applyLineClearEffect(lines.length, consumedWords);
        
        console.log(`Cleared ${lines.length} lines! Total: ${this.gameState.linesCleared}`);
    }

    private calculateScore(linesCleared: number): number {
        const baseScore = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
        return baseScore[Math.min(linesCleared, 4)] * (this.gameState.level);
    }

    private updateDropSpeed(): void {
        // Increase speed by 12% each level, with a cap to prevent unplayable speeds
        const speedMultiplier = Math.pow(0.88, this.gameState.level - 1); // 12% faster each level
        this.dropInterval = Math.max(this.baseDropInterval * speedMultiplier, 100); // Min 100ms (max speed)
        console.log(`🎚️ Drop speed updated: ${this.dropInterval}ms (${Math.round((1000 / this.dropInterval) * 10) / 10} blocks/sec)`);
    }

    private isGameOver(): boolean {
        // Check if top rows have blocks
        for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
            if (this.gameState.playfield[0][col] !== null) {
                return true;
            }
        }
        return false;
    }

    public setDropSpeed(level: number): void {
        // Increase drop speed with level
        this.dropInterval = Math.max(50, 1000 - (level * 50));
    }

    public addTestBlocks(): void {
        // Add some test blocks for line clearing demonstration
        for (let row = LAYOUT.PLAYFIELD_ROWS - 3; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS - 1; col++) {
                const block: TetrisBlock = {
                    x: col,
                    y: row,
                    color: { r: 128, g: 128, b: 128 },
                    solid: true,
                    type: 'test'
                };
                this.gameState.playfield[row][col] = block;
            }
        }
    }

    public addBombTestBlocks(): void {
        // Add test blocks with BOMB spell effect for testing
        console.log('💥 Adding BOMB test blocks...');
        
        // Add the rule that makes BOMB blocks explosive
        this.ruleEngine.addRule('BOMB', 'BOMB');
        console.log('💥 Added rule: [BOMB] IS [BOMB]');
        
        // Add some regular blocks to create almost-complete lines
        for (let row = LAYOUT.PLAYFIELD_ROWS - 2; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS - 1; col++) {
                const block: TetrisBlock = {
                    x: col,
                    y: row,
                    color: { r: 100, g: 100, b: 100 },
                    solid: true,
                    type: 'test'
                };
                this.gameState.playfield[row][col] = block;
            }
        }
        
        // Add a BOMB block in the middle of the bottom row that will trigger when line clears
        const bombRow = LAYOUT.PLAYFIELD_ROWS - 1;
        const bombCol = Math.floor(LAYOUT.PLAYFIELD_COLS / 2);
        const bombBlock: TetrisBlock = {
            x: bombCol,
            y: bombRow,
            color: { r: 255, g: 100, b: 0 }, // Orange for bomb
            solid: true,
            type: 'bomb'
        };
        this.gameState.playfield[bombRow][bombCol] = bombBlock;
        
        // Add a few extra blocks above for the explosion to hit
        for (let row = bombRow - 3; row < bombRow; row++) {
            for (let col = bombCol - 1; col <= bombCol + 1; col++) {
                if (row >= 0 && col >= 0 && col < LAYOUT.PLAYFIELD_COLS) {
                    const block: TetrisBlock = {
                        x: col,
                        y: row,
                        color: { r: 150, g: 75, b: 0 },
                        solid: true,
                        type: 'explosive'
                    };
                    this.gameState.playfield[row][col] = block;
                }
            }
        }
        
        console.log(`💥 Created BOMB at (${bombCol}, ${bombRow}) with targets above`);
        console.log('💥 Press any number key (1-4) to trigger line clear and BOMB explosion!');
    }
    
    public addGhostTestBlocks(): void {
        console.log('👻 Adding GHOST test blocks...');
        
        // Add rule that makes some blocks ghostly
        this.ruleEngine.addRuleWithPriority('GHOST', 'GHOST', 250, 'line-clear');
        console.log('👻 Added rule: [GHOST] IS [GHOST]');
        
        // Create a wall of normal blocks
        for (let row = LAYOUT.PLAYFIELD_ROWS - 5; row < LAYOUT.PLAYFIELD_ROWS - 2; row++) {
            for (let col = 2; col < LAYOUT.PLAYFIELD_COLS - 2; col++) {
                const block: TetrisBlock = {
                    x: col,
                    y: row,
                    color: { r: 150, g: 150, b: 150 },
                    solid: true,
                    type: 'wall'
                };
                this.gameState.playfield[row][col] = block;
            }
        }
        
        // Add some ghost blocks that can be passed through
        const centerRow = LAYOUT.PLAYFIELD_ROWS - 3;
        for (let col = 4; col < LAYOUT.PLAYFIELD_COLS - 4; col++) {
            const ghostBlock: TetrisBlock = {
                x: col,
                y: centerRow,
                color: { r: 100, g: 255, b: 255, a: 0.5 },
                solid: false,
                type: 'ghost'
            };
            this.gameState.playfield[centerRow][col] = ghostBlock;
        }
        
        console.log('👻 Created wall with ghost blocks - pieces should pass through ghost blocks!');
    }
    
    public addConflictTestBlocks(): void {
        console.log('⚔️ Testing rule conflicts...');
        
        // Create conflicting rules to test resolution
        this.ruleEngine.addRuleWithPriority('BLOCK', 'SOLID', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('BLOCK', 'GHOST', 250, 'line-clear'); // Higher priority
        
        console.log('⚔️ Added conflicting rules: [BLOCK] IS [SOLID] vs [BLOCK] IS [GHOST]');
        console.log('⚔️ Ghost should win due to higher priority');
        
        // Add test blocks to see the effect
        for (let col = 0; col < 5; col++) {
            const testBlock: TetrisBlock = {
                x: col,
                y: LAYOUT.PLAYFIELD_ROWS - 1,
                color: { r: 255, g: 255, b: 100 },
                solid: true,
                type: 'test'
            };
            this.gameState.playfield[LAYOUT.PLAYFIELD_ROWS - 1][col] = testBlock;
        }
    }
    
    public testThrottling(): void {
        console.log('⏱️ Testing effect throttling...');
        
        // Add multiple bomb rules to trigger throttling
        this.ruleEngine.addRuleWithPriority('BLOCK', 'BOMB', 200, 'line-clear');
        
        // Fill bottom rows with bomb blocks
        for (let row = LAYOUT.PLAYFIELD_ROWS - 3; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
                const bombBlock: TetrisBlock = {
                    x: col,
                    y: row,
                    color: { r: 255, g: 100, b: 0 },
                    solid: true,
                    type: 'bomb'
                };
                this.gameState.playfield[row][col] = bombBlock;
            }
        }
        
        console.log('⏱️ Created field full of bombs - should see throttling in action when clearing lines');
    }
    
    public testSpellEffects(): void {
        console.log('🎯 Testing ALL spell effects directly...');
        
        // Add all spell rules
        this.ruleEngine.addRuleWithPriority('FROST', 'BOMB', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('CRYSTAL', 'LIGHTNING', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('EMBER', 'ACID', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('CLONE', 'MULTIPLY', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('PORTAL', 'TELEPORT', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('IRON', 'MAGNET', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('MORPH', 'TRANSFORM', 200, 'line-clear');
        this.ruleEngine.addRuleWithPriority('LIFE', 'HEAL', 200, 'line-clear');
        
        console.log('🎯 Added ALL spell rules: BOMB, LIGHTNING, ACID, MULTIPLY, TELEPORT, MAGNET, TRANSFORM, HEAL');
        
        // Create a line with different block types that should trigger spells
        const testRow = LAYOUT.PLAYFIELD_ROWS - 1;
        const blockTypes = ['frost', 'crystal', 'ember', 'clone', 'portal', 'iron', 'morph', 'life'];
        
        for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
            const block: TetrisBlock = {
                x: col,
                y: testRow,
                color: { r: 150, g: 150, b: 150 },
                solid: true,
                type: blockTypes[col % blockTypes.length]
            };
            this.gameState.playfield[testRow][col] = block;
        }
        
        console.log('🎯 Created test line with ALL spell blocks - clear this line to trigger ALL spell effects!');
        console.log('🎯 Expected: BOMB, LIGHTNING, ACID, MULTIPLY, TELEPORT, MAGNET, TRANSFORM, HEAL effects');
    }

    public testVisualStates(): void {
        console.log('🎨 Testing ALL visual block states...');
        
        // Add rules for all visual properties to showcase different appearances
        this.ruleEngine.addRuleWithPriority('BLOCK', 'BOMB', 200, 'line-clear');     // Orange glow, thick border
        this.ruleEngine.addRuleWithPriority('CRYSTAL', 'GHOST', 200, 'line-clear');   // Semi-transparent, dashed border
        this.ruleEngine.addRuleWithPriority('RUNE', 'SHIELD', 200, 'line-clear');     // Blue glow, double border
        this.ruleEngine.addRuleWithPriority('ORB', 'HEAL', 200, 'line-clear');        // Green glow, plus symbol
        this.ruleEngine.addRuleWithPriority('SHARD', 'LIGHTNING', 200, 'line-clear'); // Yellow glow
        this.ruleEngine.addRuleWithPriority('EMBER', 'WIN', 200, 'line-clear');       // Golden glow and border
        this.ruleEngine.addRuleWithPriority('FROST', 'LOSE', 200, 'line-clear');      // Red border and glow
        this.ruleEngine.addRuleWithPriority('VOID', 'FREEZE', 200, 'line-clear');     // Ice crystal pattern
        this.ruleEngine.addRuleWithPriority('IRON', 'MAGNET', 200, 'line-clear');     // Magnetic field lines
        this.ruleEngine.addRuleWithPriority('CLONE', 'MULTIPLY', 200, 'line-clear');  // Split/clone pattern
        this.ruleEngine.addRuleWithPriority('PORTAL', 'TELEPORT', 200, 'line-clear'); // Portal swirl pattern
        this.ruleEngine.addRuleWithPriority('MORPH', 'TRANSFORM', 200, 'line-clear'); // Morphing effects
        
        console.log('🎨 Added visual rules for showcasing all enhanced block appearances');
        
        // Clear the playfield first
        for (let row = 0; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
                this.gameState.playfield[row][col] = null;
            }
        }
        
        // Create a visual showcase grid with different block types
        const blockConfigs = [
            { type: 'BLOCK', color: { r: 255, g: 100, b: 0 }, name: 'BOMB (Orange glow)' },
            { type: 'crystal', color: { r: 150, g: 150, b: 255 }, name: 'GHOST (Dashed border)' },
            { type: 'rune', color: { r: 0, g: 150, b: 255 }, name: 'SHIELD (Blue glow)' },
            { type: 'orb', color: { r: 0, g: 255, b: 100 }, name: 'HEAL (Green + symbol)' },
            { type: 'shard', color: { r: 255, g: 255, b: 0 }, name: 'LIGHTNING (Yellow glow)' },
            { type: 'ember', color: { r: 255, g: 215, b: 0 }, name: 'WIN (Golden glow)' },
            { type: 'frost', color: { r: 255, g: 0, b: 0 }, name: 'LOSE (Red border)' },
            { type: 'void', color: { r: 135, g: 206, b: 255 }, name: 'FREEZE (Ice crystal)' },
            { type: 'iron', color: { r: 255, g: 0, b: 255 }, name: 'MAGNET (Field lines)' },
            { type: 'clone', color: { r: 200, g: 200, b: 200 }, name: 'MULTIPLY (Split pattern)' },
            { type: 'portal', color: { r: 136, g: 0, b: 255 }, name: 'TELEPORT (Portal swirl)' },
            { type: 'morph', color: { r: 255, g: 165, b: 0 }, name: 'TRANSFORM (Morphing)' }
        ];
        
        // Create a showcase pattern - 3 rows of different visual states
        let blockIndex = 0;
        for (let row = LAYOUT.PLAYFIELD_ROWS - 3; row < LAYOUT.PLAYFIELD_ROWS; row++) {
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS && blockIndex < blockConfigs.length; col++) {
                const config = blockConfigs[blockIndex];
                const block: TetrisBlock = {
                    x: col,
                    y: row,
                    color: config.color,
                    solid: true,
                    type: config.type
                };
                this.gameState.playfield[row][col] = block;
                blockIndex++;
            }
        }
        
        console.log('🎨 Created visual showcase with 12 different block visual states!');
        console.log('🎨 Each block should have distinct appearance based on its rule properties:');
        blockConfigs.forEach((config, i) => {
            console.log(`   ${i + 1}. ${config.name}`);
        });
        console.log('🎨 Check the Visual Legend panel in the UI to see active property descriptions!');
    }
    
    private applySpellEffects(clearedLines: number[]): void {
        // Check each cleared line for blocks with spell effects
        console.log(`🔥 CHECKING FOR SPELL EFFECTS in ${clearedLines.length} cleared lines...`);
        
        for (const lineIndex of clearedLines) {
            console.log(`🔍 Scanning line ${lineIndex} for spell effects...`);
            for (let col = 0; col < LAYOUT.PLAYFIELD_COLS; col++) {
                const block = this.gameState.playfield[lineIndex][col];
                if (block) {
                    console.log(`🔍 Found block at (${col}, ${lineIndex}): type='${block.type}'`);
                    
                    // Check if ANY rule makes this block have spell properties
                    const activeRules = this.ruleEngine.getActiveRules();
                    
                    // Find ANY rule with a spell property (not just BLOCK rules)
                    const spellEffects = ['BOMB', 'LIGHTNING', 'ACID', 'MULTIPLY', 'TELEPORT', 'MAGNET', 'TRANSFORM', 'HEAL'];
                    const spellRules = activeRules.filter(rule => spellEffects.includes(rule.property));
                    
                    if (spellRules.length > 0) {
                        console.log(`🎯 Found ${spellRules.length} spell rules:`, spellRules.map(r => `[${r.noun}] IS [${r.property}]`));
                        
                        // Check for spell combinations for ULTRA effects
                        if (spellRules.length >= 2) {
                            this.executeSpellCombination(spellRules, block, lineIndex, col);
                        } else {
                            // Execute single spell effect
                            const spellRule = spellRules[0];
                            console.log(`⚡ TRIGGERING SPELL: ${spellRule.property} at (${col}, ${lineIndex}) from rule [${spellRule.noun}] IS [${spellRule.property}]`);
                            this.executeSpellEffect(spellRule.property, block, lineIndex, col);
                        }
                    } else {
                        console.log(`❌ No spell rules found in active rules`);
                    }
                }
            }
        }
    }
    
    private triggerBlockSpellEffects(block: TetrisBlock, row: number, col: number): void {
        // Find rules that apply to this block
        console.log(`🔍 Checking rules for block type '${block.type}' at (${col}, ${row})`);
        console.log(`🔍 Available rules:`, this.gameState.rules.map(r => `[${r.noun}] IS [${r.property}]`));
        
        const applicableRules = this.gameState.rules.filter(rule => 
            rule.noun === 'BLOCK' || rule.noun === block.type.toUpperCase()
        );
        
        console.log(`🔍 Applicable rules for '${block.type}':`, applicableRules.map(r => `[${r.noun}] IS [${r.property}]`));
        
        for (const rule of applicableRules) {
            this.executeSpellEffect(rule.property, block, row, col);
        }
    }
    
    private executeSpellCombination(spellRules: Rule[], block: TetrisBlock, row: number, col: number): void {
        const spellTypes = spellRules.map(r => r.property).sort();
        console.log(`🌟🌟🌟 SPELL COMBINATION DETECTED: ${spellTypes.join(' + ')} = ULTRA DESTRUCTION! 🌟🌟🌟`);
        
        // Execute ultra powerful combined effects
        if (spellTypes.includes('BOMB') && spellTypes.includes('LIGHTNING')) {
            console.log(`💥⚡ THUNDERBOMB COMBO: Nuclear-level devastation incoming! ⚡💥`);
            // Execute bomb first, then lightning on all affected rows
            this.executeBombSpell(row, col);
            // Lightning strikes on multiple rows
            for (let r = Math.max(0, row - 2); r <= Math.min(LAYOUT.PLAYFIELD_ROWS - 1, row + 2); r++) {
                this.executeLightningSpell(r, col);
            }
        } else if (spellTypes.includes('BOMB') && spellTypes.includes('ACID')) {
            console.log(`💥🧪 ACIDBOMB COMBO: Explosive corrosion melts everything! 🧪💥`);
            this.executeBombSpell(row, col);
            // Acid spreads from explosion center in all directions
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < LAYOUT.PLAYFIELD_ROWS && c >= 0 && c < LAYOUT.PLAYFIELD_COLS) {
                        this.executeAcidSpell(r, c);
                    }
                }
            }
        } else if (spellTypes.includes('LIGHTNING') && spellTypes.includes('ACID')) {
            console.log(`⚡🧪 ELECTRIC ACID COMBO: Electrified corrosion spreads like wildfire! 🧪⚡`);
            this.executeLightningSpell(row, col);
            // Acid spreads to all adjacent rows
            const adjacentRows = [row - 1, row + 1].filter(r => r >= 0 && r < LAYOUT.PLAYFIELD_ROWS);
            for (const adjRow of adjacentRows) {
                for (let c = 0; c < LAYOUT.PLAYFIELD_COLS; c++) {
                    if (Math.random() < 0.5) { // 50% chance per column
                        this.executeAcidSpell(adjRow, c);
                    }
                }
            }
        } else {
            // Default: execute all spells individually but with amplified effects
            console.log(`🔥 MULTI-SPELL CHAOS: ${spellTypes.length} spells trigger simultaneously! 🔥`);
            for (const spellRule of spellRules) {
                this.executeSpellEffect(spellRule.property, block, row, col);
            }
        }
        
        // Log the massive combo effect
        this.logger?.logSpellEffect(
            'SPELL_COMBO',
            { x: col, y: row },
            `🌟 ULTRA COMBO: ${spellTypes.join(' + ')} caused catastrophic field transformation!`,
            [{ x: col, y: row, type: block.type }]
        );
        
        // Show dramatic full-screen combo animation
        if (this.effectManager) {
            this.effectManager.addComboEffect(spellTypes.length, 1.0 + (spellTypes.length * 0.3));
        }
    }
    
    private executeSpellEffect(spellName: string, block: TetrisBlock, row: number, col: number): void {
        console.log(`⚡⚡⚡ EXECUTING SPELL: ${spellName} at (${col}, ${row}) ⚡⚡⚡`);
        
        // Check throttling for this effect
        if (this.ruleEngine.shouldThrottleEffect(spellName)) {
            console.log(`⏱️ ${spellName} effect throttled at (${col}, ${row})`);
            this.logger?.logThrottledEffect(spellName, { x: col, y: row }, { reason: 'Rate limit exceeded' });
            return;
        }
        
        // Show spell effect canvas animation
        this.showSpellEffectCanvas(spellName, row, col);
        
        switch (spellName.toUpperCase()) {
            case 'BOMB':
                this.executeBombSpell(row, col);
                break;
            case 'LIGHTNING':
                this.executeLightningSpell(row, col);
                break;
            case 'ACID':
                this.executeAcidSpell(row, col);
                break;
            case 'MULTIPLY':
                this.executeMultiplySpell(block, row, col);
                break;
            case 'TELEPORT':
                this.executeTeleportSpell(block, row, col);
                break;
            case 'MAGNET':
                this.executeMagnetSpell(row, col);
                break;
            case 'TRANSFORM':
                this.executeTransformSpell(block, row, col);
                break;
            case 'HEAL':
                this.executeHealSpell(row, col);
                break;
            default:
                // No special effect for this spell
                break;
        }
    }
    
    private showSpellEffectCanvas(spellName: string, row: number, col: number): void {
        if (!this.effectManager) {
            console.error(`❌ EffectManager is null! Cannot show ${spellName} effect at (${col}, ${row})`);
            return;
        }
        
        console.log(`🎨 TRIGGERING CANVAS EFFECT: ${spellName} at (${col}, ${row})`);
        const gridPosition = { x: col, y: row };
        
        switch (spellName.toUpperCase()) {
            case 'LIGHTNING':
                this.effectManager.addEffect({
                    type: 'lightning_bolt',
                    gridPosition,
                    intensity: 1.1,
                    duration: 1000,
                    autoRemove: true
                });
                break;
            case 'MULTIPLY':
                this.effectManager.addEffect({
                    type: 'multiply',
                    gridPosition,
                    intensity: 1.1,
                    duration: 1200,
                    autoRemove: true
                });
                break;
            case 'TELEPORT':
                this.effectManager.addEffect({
                    type: 'teleport',
                    gridPosition,
                    intensity: 1.1,
                    duration: 1500,
                    autoRemove: true
                });
                break;
            case 'MAGNET':
                this.effectManager.addEffect({
                    type: 'magnet',
                    gridPosition,
                    intensity: 1.1,
                    duration: 1500,
                    autoRemove: true
                });
                break;
            case 'TRANSFORM':
                this.effectManager.addEffect({
                    type: 'transform',
                    gridPosition,
                    intensity: 1.1,
                    duration: 1400,
                    autoRemove: true
                });
                break;
            case 'HEAL':
                this.effectManager.addEffect({
                    type: 'heal',
                    gridPosition,
                    intensity: 1.1,
                    duration: 1750,
                    autoRemove: true
                });
                break;
            default:
                // No additional canvas effect needed - BOMB and ACID already have canvas effects
                break;
        }
    }
    
    private executeBombSpell(centerRow: number, centerCol: number): void {
        console.log(`💥💥💥 MASSIVE BOMB EXPLOSION at (${centerCol}, ${centerRow})! 💥💥💥`);
        
        // Add flame effect at explosion center
        if (this.effectManager) {
            this.effectManager.addEffect({
                type: 'flame',
                gridPosition: { x: centerCol, y: centerRow },
                intensity: 1.5,
                duration: 2000,
                autoRemove: true
            });
        }
        
        const affectedBlocks: { x: number; y: number; type: string }[] = [];
        
        // Destroy blocks in 3x3 area around bomb
        for (let row = centerRow - 1; row <= centerRow + 1; row++) {
            for (let col = centerCol - 1; col <= centerCol + 1; col++) {
                if (row >= 0 && row < LAYOUT.PLAYFIELD_ROWS && 
                    col >= 0 && col < LAYOUT.PLAYFIELD_COLS) {
                    
                    const targetBlock = this.gameState.playfield[row][col];
                    if (targetBlock) {
                        console.log(`💥 Destroying block at (${col}, ${row})`);
                        affectedBlocks.push({ x: col, y: row, type: targetBlock.type });
                        
                        // Add crumbling brick effect for WALL blocks
                        if (targetBlock.type === 'WALL' && this.effectManager) {
                            this.effectManager.addEffect({
                                type: 'crumbling_brick',
                                gridPosition: { x: col, y: row },
                                intensity: 1.1,
                                duration: 2500,
                                autoRemove: true
                            });
                        }
                        
                        this.gameState.playfield[row][col] = null;
                        
                        // Chain reaction: if destroyed block is also a bomb
                        if (this.hasSpellProperty(targetBlock, 'BOMB') && (row !== centerRow || col !== centerCol)) {
                            console.log(`💥 Chain reaction! Triggering BOMB at (${col}, ${row})`);
                            this.executeBombSpell(row, col);
                        }
                    }
                }
            }
        }
        
        // Log the bomb effect
        this.logger?.logSpellEffect(
            'BOMB',
            { x: centerCol, y: centerRow },
            `💥 BOMB DEVASTATION: Destroyed ${affectedBlocks.length} blocks in 3x3 area! Blocks fell like dominoes!`,
            affectedBlocks
        );
        
        // Show visual impact message
        console.log(`💥 DESTRUCTION REPORT: ${affectedBlocks.length} blocks obliterated! Pieces: ${affectedBlocks.map(b => b.type).join(', ')}`);
    }
    
    private executeLightningSpell(row: number, col: number): void {
        console.log(`⚡⚡⚡ DEVASTATING LIGHTNING STRIKE across row ${row}! ⚡⚡⚡`);
        
        let destroyedCount = 0;
        let destroyedTypes: string[] = [];
        
        // Destroy all blocks in the row
        for (let c = 0; c < LAYOUT.PLAYFIELD_COLS; c++) {
            if (this.gameState.playfield[row][c]) {
                const block = this.gameState.playfield[row][c]!;
                console.log(`⚡ Lightning vaporizes ${block.type} block at (${c}, ${row})`);
                destroyedTypes.push(block.type);
                this.gameState.playfield[row][c] = null;
                destroyedCount++;
            }
        }
        
        console.log(`⚡ LIGHTNING DEVASTATION: Annihilated entire row ${row}! ${destroyedCount} blocks turned to ash: ${destroyedTypes.join(', ')}`);
        
        // Lightning can trigger chain reactions in adjacent rows
        if (destroyedCount >= 8) { // If nearly full row destroyed
            console.log(`⚡ LIGHTNING OVERCHARGE: Massive destruction triggers electrical cascade!`);
            // Trigger lightning in random adjacent row
            const adjacentRows = [row - 1, row + 1].filter(r => r >= 0 && r < LAYOUT.PLAYFIELD_ROWS);
            if (adjacentRows.length > 0 && Math.random() < 0.3) { // 30% chance
                const chainRow = adjacentRows[Math.floor(Math.random() * adjacentRows.length)];
                console.log(`⚡ CHAIN LIGHTNING strikes row ${chainRow}!`);
                setTimeout(() => this.executeLightningSpell(chainRow, col), 500); // Delayed chain reaction
            }
        }
    }
    
    private executeAcidSpell(row: number, col: number): void {
        console.log(`🧪🧪🧪 CORROSIVE ACID BATH dissolving blocks below (${col}, ${row})! 🧪🧪🧪`);
        
        // Trigger acid drip visual effect
        if (this.effectManager) {
            this.effectManager.addEffect({
                type: 'acid_drip',
                gridPosition: { x: col, y: row },
                intensity: 0.8,
                duration: 1500, // Reduced from 3 seconds to 1.5 seconds
                autoRemove: true
            });
        }
        
        let dissolvedCount = 0;
        let dissolvedTypes: string[] = [];
        
        // Dissolve multiple blocks below this position (not just one)
        for (let r = row + 1; r < LAYOUT.PLAYFIELD_ROWS; r++) {
            if (this.gameState.playfield[r][col]) {
                const block = this.gameState.playfield[r][col]!;
                console.log(`🧪 Acid melts ${block.type} block at (${col}, ${r}) - sizzling and bubbling!`);
                dissolvedTypes.push(block.type);
                this.gameState.playfield[r][col] = null;
                dissolvedCount++;
                
                // Acid has a chance to spread horizontally
                if (Math.random() < 0.4) { // 40% chance to spread
                    const spreadCols = [col - 1, col + 1].filter(c => c >= 0 && c < LAYOUT.PLAYFIELD_COLS);
                    for (const spreadCol of spreadCols) {
                        if (this.gameState.playfield[r][spreadCol] && Math.random() < 0.3) {
                            const spreadBlock = this.gameState.playfield[r][spreadCol]!;
                            console.log(`🧪 Acid spreads to dissolve ${spreadBlock.type} at (${spreadCol}, ${r})`);
                            dissolvedTypes.push(spreadBlock.type);
                            this.gameState.playfield[r][spreadCol] = null;
                            dissolvedCount++;
                        }
                    }
                }
                
                // Continue dissolving down with diminishing chance
                if (Math.random() < 0.7) continue; // 70% chance to keep going down
                else break;
            }
        }
        
        console.log(`🧪 ACID DEVASTATION: Dissolved ${dissolvedCount} blocks into toxic sludge! Victims: ${dissolvedTypes.join(', ')}`);
    }
    
    private executeMagnetSpell(centerRow: number, centerCol: number): void {
        console.log(`🧲 MAGNET pulling blocks toward (${centerCol}, ${centerRow})`);
        
        // Pull blocks from surrounding area toward center
        // This is a simplified implementation
        for (let row = centerRow - 2; row <= centerRow + 2; row++) {
            for (let col = centerCol - 2; col <= centerCol + 2; col++) {
                if (row >= 0 && row < LAYOUT.PLAYFIELD_ROWS && 
                    col >= 0 && col < LAYOUT.PLAYFIELD_COLS &&
                    (row !== centerRow || col !== centerCol)) {
                    
                    const block = this.gameState.playfield[row][col];
                    if (block) {
                        // Try to move block closer to center
                        const newRow = row > centerRow ? row - 1 : (row < centerRow ? row + 1 : row);
                        const newCol = col > centerCol ? col - 1 : (col < centerCol ? col + 1 : col);
                        
                        if (newRow >= 0 && newRow < LAYOUT.PLAYFIELD_ROWS && 
                            newCol >= 0 && newCol < LAYOUT.PLAYFIELD_COLS &&
                            !this.gameState.playfield[newRow][newCol]) {
                            
                            this.gameState.playfield[newRow][newCol] = block;
                            this.gameState.playfield[row][col] = null;
                            console.log(`🧲 Magnet pulled block from (${col}, ${row}) to (${newCol}, ${newRow})`);
                        }
                    }
                }
            }
        }
    }
    
    private executeHealSpell(centerRow: number, centerCol: number): void {
        console.log(`💚 HEAL spell restoring blocks around (${centerCol}, ${centerRow})`);
        // Heal effect could restore previously destroyed blocks or strengthen existing ones
        // For now, just log the effect
    }
    
    private executeMultiplySpell(originalBlock: TetrisBlock, row: number, col: number): void {
        console.log(`🔄 MULTIPLY creating copy of block from (${col}, ${row})`);
        
        // Find a random empty spot to place the copy
        const emptySpots: Position[] = [];
        for (let r = 0; r < LAYOUT.PLAYFIELD_ROWS; r++) {
            for (let c = 0; c < LAYOUT.PLAYFIELD_COLS; c++) {
                if (!this.gameState.playfield[r][c]) {
                    emptySpots.push({ x: c, y: r });
                }
            }
        }
        
        if (emptySpots.length > 0) {
            const randomSpot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
            const copy = { ...originalBlock, x: randomSpot.x, y: randomSpot.y };
            this.gameState.playfield[randomSpot.y][randomSpot.x] = copy;
            console.log(`🔄 Multiply created copy at (${randomSpot.x}, ${randomSpot.y})`);
        }
    }
    
    private executeTransformSpell(block: TetrisBlock, centerRow: number, centerCol: number): void {
        console.log(`🔮 TRANSFORM changing adjacent blocks around (${centerCol}, ${centerRow})`);
        
        // Change adjacent blocks to match this block's type
        for (let row = centerRow - 1; row <= centerRow + 1; row++) {
            for (let col = centerCol - 1; col <= centerCol + 1; col++) {
                if (row >= 0 && row < LAYOUT.PLAYFIELD_ROWS && 
                    col >= 0 && col < LAYOUT.PLAYFIELD_COLS &&
                    (row !== centerRow || col !== centerCol)) {
                    
                    const targetBlock = this.gameState.playfield[row][col];
                    if (targetBlock) {
                        targetBlock.type = block.type;
                        targetBlock.color = block.color;
                        console.log(`🔮 Transform changed block at (${col}, ${row}) to ${block.type}`);
                    }
                }
            }
        }
    }
    
    private executeTeleportSpell(block: TetrisBlock, row: number, col: number): void {
        console.log(`🌀 TELEPORT swapping block at (${col}, ${row})`);
        
        // Find all non-empty positions for potential swap
        const occupiedPositions: Position[] = [];
        for (let r = 0; r < LAYOUT.PLAYFIELD_ROWS; r++) {
            for (let c = 0; c < LAYOUT.PLAYFIELD_COLS; c++) {
                if (this.gameState.playfield[r][c] && (r !== row || c !== col)) {
                    occupiedPositions.push({ x: c, y: r });
                }
            }
        }
        
        if (occupiedPositions.length > 0) {
            // Pick random position to swap with
            const swapPos = occupiedPositions[Math.floor(Math.random() * occupiedPositions.length)];
            const swapBlock = this.gameState.playfield[swapPos.y][swapPos.x];
            
            // Perform the swap
            this.gameState.playfield[row][col] = swapBlock;
            this.gameState.playfield[swapPos.y][swapPos.x] = block;
            
            // Update block coordinates
            if (swapBlock) {
                swapBlock.x = col;
                swapBlock.y = row;
            }
            block.x = swapPos.x;
            block.y = swapPos.y;
            
            console.log(`🌀 Teleport swapped (${col}, ${row}) with (${swapPos.x}, ${swapPos.y})`);
        }
    }
    
    private hasSpellProperty(block: TetrisBlock, spellName: string): boolean {
        return this.gameState.rules.some(rule => 
            (rule.noun === 'BLOCK' || rule.noun === block.type.toUpperCase()) &&
            rule.property === spellName.toUpperCase()
        );
    }
    
    private checkRuleBasedGameEnd(): boolean {
        // Check for WIN conditions
        const winRules = this.gameState.rules.filter(rule => rule.property === 'WIN');
        for (const rule of winRules) {
            if (this.isWinConditionMet(rule)) {
                console.log(`🎉 WIN condition met: [${rule.noun}] IS [WIN]`);
                this.gameState.gameOver = true;
                // Could add a win flag to distinguish from lose
                return true;
            }
        }
        
        // Check for LOSE conditions
        const loseRules = this.gameState.rules.filter(rule => rule.property === 'LOSE');
        for (const rule of loseRules) {
            if (this.isLoseConditionMet(rule)) {
                console.log(`💀 LOSE condition met: [${rule.noun}] IS [LOSE]`);
                this.gameState.gameOver = true;
                return true;
            }
        }
        
        return false;
    }
    
    private isWinConditionMet(rule: Rule): boolean {
        // Check if current piece touches a WIN block
        if (!this.gameState.currentPiece) return false;
        
        const worldBlocks = (this.gameState.currentPiece as TetrisPiece).getWorldBlocks();
        for (const blockPos of worldBlocks) {
            if (blockPos.y >= 0 && blockPos.y < LAYOUT.PLAYFIELD_ROWS &&
                blockPos.x >= 0 && blockPos.x < LAYOUT.PLAYFIELD_COLS) {
                
                const existingBlock = this.gameState.playfield[blockPos.y][blockPos.x];
                if (existingBlock && this.hasSpellProperty(existingBlock, 'WIN')) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private isLoseConditionMet(rule: Rule): boolean {
        // Check if current piece touches a LOSE block
        if (!this.gameState.currentPiece) return false;
        
        const worldBlocks = (this.gameState.currentPiece as TetrisPiece).getWorldBlocks();
        for (const blockPos of worldBlocks) {
            if (blockPos.y >= 0 && blockPos.y < LAYOUT.PLAYFIELD_ROWS &&
                blockPos.x >= 0 && blockPos.x < LAYOUT.PLAYFIELD_COLS) {
                
                const existingBlock = this.gameState.playfield[blockPos.y][blockPos.x];
                if (existingBlock && this.hasSpellProperty(existingBlock, 'LOSE')) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private getBlockColorFromRules(blockType: string): Color {
        // Check active rules for color properties
        const activeRules = this.ruleEngine.getActiveRules();
        
        // Check if BLOCK or this specific block type has a color rule
        for (const rule of activeRules) {
            if ((rule.noun === 'BLOCK' || rule.noun === blockType.toUpperCase()) && 
                ['RED', 'BLUE', 'GREEN'].includes(rule.property)) {
                
                switch (rule.property) {
                    case 'RED': return { r: 255, g: 100, b: 100 };
                    case 'BLUE': return { r: 100, g: 100, b: 255 };
                    case 'GREEN': return { r: 100, g: 255, b: 100 };
                }
            }
        }
        
        // Default color based on block type if no rule overrides
        return this.getDefaultBlockColor(blockType);
    }
    
    private getDefaultBlockColor(blockType: string): Color {
        switch (blockType) {
            case 'I': return { r: 0, g: 255, b: 255 };    // Cyan
            case 'O': return { r: 255, g: 255, b: 0 };    // Yellow
            case 'T': return { r: 128, g: 0, b: 128 };    // Purple
            case 'S': return { r: 0, g: 255, b: 0 };      // Green
            case 'Z': return { r: 255, g: 0, b: 0 };      // Red
            case 'J': return { r: 0, g: 0, b: 255 };      // Blue
            case 'L': return { r: 255, g: 165, b: 0 };    // Orange
            default: return { r: 128, g: 128, b: 128 };   // Gray
        }
    }
}