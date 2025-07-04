import { GameState, Rule, WordQueueItem, RuleMatrixPreview, TetrisPiece } from './types.js';
import { RuleEffects } from './RuleEffects.js';

export class UIManager {
    private activeRulesElement: HTMLElement;
    private ruleMatrixElement: HTMLElement;
    private wordQueueElement: HTMLElement;
    private currentScoreElement: HTMLElement;
    private currentLevelElement: HTMLElement;
    private linesClearedElement: HTMLElement;
    private nextPieceCanvas: HTMLCanvasElement;
    private nextPieceCtx: CanvasRenderingContext2D;
    private visualLegendElement: HTMLElement;

    constructor() {
        this.activeRulesElement = document.getElementById('activeRules')!;
        this.ruleMatrixElement = document.getElementById('ruleMatrix')!;
        this.wordQueueElement = document.getElementById('wordQueue')!;
        this.currentScoreElement = document.getElementById('currentScore')!;
        this.currentLevelElement = document.getElementById('currentLevel')!;
        this.linesClearedElement = document.getElementById('linesCleared')!;
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas')! as HTMLCanvasElement;
        this.visualLegendElement = document.getElementById('visualLegend')!
        
        const ctx = this.nextPieceCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context for next piece canvas');
        }
        this.nextPieceCtx = ctx;
        
        if (!this.activeRulesElement || !this.ruleMatrixElement || !this.wordQueueElement ||
            !this.currentScoreElement || !this.currentLevelElement || !this.linesClearedElement ||
            !this.nextPieceCanvas || !this.visualLegendElement) {
            throw new Error('Required UI elements not found');
        }
    }

    public updateUI(gameState: GameState): void {
        this.updateActiveRules(gameState.rules);
        this.updateRuleMatrix(gameState.ruleMatrix);
        this.updateWordQueue(gameState.wordQueue);
        this.updateNextPiecePreview(gameState.nextPiece, gameState.rules);
        this.updateVisualLegend(gameState.rules);
    }

    private updateActiveRules(rules: Rule[]): void {
        this.activeRulesElement.innerHTML = '';
        
        if (rules.length === 0) {
            this.activeRulesElement.innerHTML = '<div class="rule-item">No active rules</div>';
            return;
        }

        rules.forEach(rule => {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'rule-item';
            ruleDiv.textContent = `[${rule.noun}] IS [${rule.property}]`;
            this.activeRulesElement.appendChild(ruleDiv);
        });
    }

    private updateRuleMatrix(ruleMatrix: RuleMatrixPreview): void {
        this.ruleMatrixElement.innerHTML = '';

        const effects = [
            { label: '1-LINE', effect: ruleMatrix.oneLineEffect },
            { label: '2-LINE', effect: ruleMatrix.twoLineEffect },
            { label: '3-LINE', effect: ruleMatrix.threeLineEffect },
            { label: '4-LINE', effect: ruleMatrix.fourLineEffect }
        ];

        effects.forEach(({ label, effect }) => {
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'matrix-item';
            matrixDiv.textContent = `${label} → ${effect}`;
            this.ruleMatrixElement.appendChild(matrixDiv);
        });
    }

    private updateWordQueue(wordQueue: WordQueueItem[]): void {
        this.wordQueueElement.innerHTML = '';

        // Show first 10 words
        const displayWords = wordQueue.slice(0, 10);
        
        displayWords.forEach((wordItem, index) => {
            const wordDiv = document.createElement('div');
            wordDiv.className = 'word-item';
            wordDiv.textContent = wordItem.word;
            
            // Color coding for word types
            if (wordItem.type === 'noun') {
                wordDiv.style.backgroundColor = 'rgb(100, 150, 255)'; // Blue for nouns
            } else {
                wordDiv.style.backgroundColor = 'rgb(255, 150, 100)'; // Orange for properties
            }
            
            // Highlight first 3 words that will be used in next rule changes
            if (index < 3) {
                wordDiv.style.border = '2px solid #ffff00';
            }
            
            this.wordQueueElement.appendChild(wordDiv);
        });
    }

    public showGameOver(): void {
        this.showOverlay('GAME OVER', 'Press R to restart', 'gameOverOverlay');
    }

    public showPauseScreen(): void {
        this.showOverlay('PAUSED', 'Press P to resume', 'pauseOverlay');
    }

    public hidePauseScreen(): void {
        this.hideOverlay('pauseOverlay');
    }

    private showOverlay(title: string, subtitle: string, id: string): void {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            // Remove existing overlay if present
            this.hideOverlay(id);
            
            const overlay = document.createElement('div');
            overlay.id = id;
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.zIndex = '1000';
            overlay.style.color = '#fff';
            overlay.style.fontFamily = '"Courier New", monospace';
            
            overlay.innerHTML = `
                <div style="text-align: center; padding: 40px; border: 3px solid #fff; background: #111;">
                    <h1 style="margin: 0 0 20px 0; font-size: 48px; color: #ffff00;">${title}</h1>
                    <p style="margin: 0 0 30px 0; font-size: 18px;">${subtitle}</p>
                    <div style="font-size: 14px; color: #aaa; line-height: 1.6;">
                        <p><strong>Controls:</strong></p>
                        <p>Arrow Keys - Move/Rotate pieces</p>
                        <p>Space - Hard drop</p>
                        <p>P - Pause/Resume</p>
                        <p>T - Add test blocks</p>
                        <p>V - Test visual block states</p>
                        <p>1-4 - Test rule effects</p>
                    </div>
                </div>
            `;
            
            gameContainer.style.position = 'relative';
            gameContainer.appendChild(overlay);
        }
    }

    private hideOverlay(id: string): void {
        const overlay = document.getElementById(id);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    public hideGameOver(): void {
        this.hideOverlay('gameOverOverlay');
    }

    public updateScore(score: number, level: number, linesCleared: number): void {
        this.currentScoreElement.textContent = score.toLocaleString();
        this.currentLevelElement.textContent = level.toString();
        this.linesClearedElement.textContent = linesCleared.toString();
    }

    public showSpellEffectNotification(spellName: string, comboLevel: number = 1): void {
        // Legacy method - now only used for testing. All spells use canvas effects.
        console.log(`🎬 [DEPRECATED] Spell notification: ${spellName} (combo level: ${comboLevel}) - Canvas effects are now used instead`);
    }

    public showRuleChangeAnimation(ruleChange: string): void {
        // Create a temporary notification for rule changes
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'rgba(255, 255, 0, 0.9)';
        notification.style.color = '#000';
        notification.style.padding = '10px';
        notification.style.border = '2px solid #fff';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.style.animation = 'fadeInOut 3s ease-in-out';
        notification.textContent = `RULE CHANGE: ${ruleChange}`;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(100px); }
                20% { opacity: 1; transform: translateX(0); }
                80% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(-100px); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 3000);
    }

    private updateNextPiecePreview(nextPiece: TetrisPiece | null, rules: Rule[] = []): void {
        // Clear the canvas
        this.nextPieceCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        if (!nextPiece) return;
        
        // Check if REVEAL effect is active
        const hasReveal = rules.some(rule => rule.property === 'REVEAL');
        
        if (hasReveal) {
            // Enhanced preview mode: show additional information
            this.nextPieceCtx.fillStyle = '#ffff00';
            this.nextPieceCtx.font = '10px monospace';
            this.nextPieceCtx.fillText('REVEAL ACTIVE', 5, 15);
            this.nextPieceCtx.fillText(`Type: ${nextPiece.type}`, 5, 115);
            
            // Add glow effect to indicate enhanced preview
            this.nextPieceCtx.shadowColor = '#00ff88';
            this.nextPieceCtx.shadowBlur = 10;
        }
        
        // Draw the next piece in the center of the small canvas
        const blockSize = 20;
        const canvasCenter = {
            x: this.nextPieceCanvas.width / 2,
            y: this.nextPieceCanvas.height / 2
        };
        
        // Calculate piece bounds for centering
        const minX = Math.min(...nextPiece.blocks.map(b => b.x));
        const maxX = Math.max(...nextPiece.blocks.map(b => b.x));
        const minY = Math.min(...nextPiece.blocks.map(b => b.y));
        const maxY = Math.max(...nextPiece.blocks.map(b => b.y));
        
        const pieceWidth = (maxX - minX + 1) * blockSize;
        const pieceHeight = (maxY - minY + 1) * blockSize;
        
        const offsetX = canvasCenter.x - pieceWidth / 2 - minX * blockSize;
        const offsetY = canvasCenter.y - pieceHeight / 2 - minY * blockSize;
        
        // Draw each block of the piece
        this.nextPieceCtx.fillStyle = `rgb(${nextPiece.color.r}, ${nextPiece.color.g}, ${nextPiece.color.b})`;
        this.nextPieceCtx.strokeStyle = '#fff';
        this.nextPieceCtx.lineWidth = 1;
        
        for (const block of nextPiece.blocks) {
            const x = offsetX + block.x * blockSize;
            const y = offsetY + block.y * blockSize;
            
            // Fill the block
            this.nextPieceCtx.fillRect(x, y, blockSize, blockSize);
            
            // Draw border
            this.nextPieceCtx.strokeRect(x, y, blockSize, blockSize);
        }
        
        // Reset shadow effects
        this.nextPieceCtx.shadowColor = 'transparent';
        this.nextPieceCtx.shadowBlur = 0;
    }

    private updateVisualLegend(rules: Rule[]): void {
        this.visualLegendElement.innerHTML = '';
        
        // Get unique properties from active rules
        const activeProperties = [...new Set(rules.map(rule => rule.property))];
        
        // Define visual legend for common properties
        const legendDefinitions: { [key: string]: { color: string; border: string; description: string } } = {
            'BOMB': { color: '#ff8800', border: 'thick orange', description: 'Orange glow, thick border' },
            'GHOST': { color: '#666666', border: 'dashed gray', description: 'Semi-transparent, dashed border' },
            'SHIELD': { color: '#0088ff', border: 'double blue', description: 'Blue glow, double border' },
            'HEAL': { color: '#00ff44', border: 'green', description: 'Green glow, plus symbol' },
            'LIGHTNING': { color: '#ffff00', border: 'yellow', description: 'Yellow glow' },
            'WIN': { color: '#ffd700', border: 'golden', description: 'Golden glow and border' },
            'LOSE': { color: '#ff0000', border: 'red', description: 'Red border and glow' },
            'FREEZE': { color: '#88ddff', border: 'light blue', description: 'Ice crystal pattern' },
            'MAGNET': { color: '#ff00ff', border: 'magenta', description: 'Magnetic field lines' },
            'MULTIPLY': { color: '#ffffff', border: 'white', description: 'Split/clone pattern' },
            'TELEPORT': { color: '#8800ff', border: 'purple', description: 'Portal swirl pattern' },
            'TRANSFORM': { color: '#ffffff', border: 'white', description: 'Morphing effects' }
        };
        
        // Show legend for active properties
        activeProperties.forEach(property => {
            const legend = legendDefinitions[property];
            if (legend) {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                
                const icon = document.createElement('div');
                icon.className = 'legend-icon';
                icon.style.backgroundColor = legend.color;
                icon.style.opacity = '0.7';
                icon.style.borderColor = legend.color;
                
                const text = document.createElement('div');
                text.className = 'legend-text';
                text.textContent = `${property}: ${legend.description}`;
                
                legendItem.appendChild(icon);
                legendItem.appendChild(text);
                this.visualLegendElement.appendChild(legendItem);
            }
        });
        
        // Show message if no special properties are active
        if (activeProperties.length === 0 || activeProperties.every(p => !legendDefinitions[p])) {
            const noLegendItem = document.createElement('div');
            noLegendItem.className = 'legend-text';
            noLegendItem.textContent = 'No special block properties active';
            noLegendItem.style.fontStyle = 'italic';
            noLegendItem.style.color = '#888';
            this.visualLegendElement.appendChild(noLegendItem);
        }
    }
}