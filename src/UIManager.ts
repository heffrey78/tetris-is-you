import { GameState, Rule, WordQueueItem, RuleMatrixPreview } from './types.js';
import { RuleEffects } from './RuleEffects.js';

export class UIManager {
    private activeRulesElement: HTMLElement;
    private ruleMatrixElement: HTMLElement;
    private wordQueueElement: HTMLElement;

    constructor() {
        this.activeRulesElement = document.getElementById('activeRules')!;
        this.ruleMatrixElement = document.getElementById('ruleMatrix')!;
        this.wordQueueElement = document.getElementById('wordQueue')!;
        
        if (!this.activeRulesElement || !this.ruleMatrixElement || !this.wordQueueElement) {
            throw new Error('Required UI elements not found');
        }
    }

    public updateUI(gameState: GameState): void {
        this.updateActiveRules(gameState.rules);
        this.updateRuleMatrix(gameState.ruleMatrix);
        this.updateWordQueue(gameState.wordQueue);
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
        // Update score display if we add a score panel later
        console.log(`Score: ${score}, Level: ${level}, Lines: ${linesCleared}`);
    }

    public showSpellEffectNotification(spellName: string, comboLevel: number = 1): void {
        console.log(`🎬 SHOWING SPELL NOTIFICATION: ${spellName} (combo level: ${comboLevel})`);
        
        // Create dramatic spell effect notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.fontSize = comboLevel > 1 ? '48px' : '36px';
        notification.style.fontWeight = 'bold';
        notification.style.color = '#fff';
        notification.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
        notification.style.zIndex = '2000';
        notification.style.pointerEvents = 'none';
        notification.style.background = 'rgba(0, 0, 0, 0.8)';
        notification.style.padding = '20px';
        notification.style.borderRadius = '10px';
        notification.style.border = '3px solid #fff';
        
        // Set spell-specific styling
        switch (spellName.toUpperCase()) {
            case 'BOMB':
                notification.textContent = '💥 EXPLOSION! 💥';
                notification.style.color = '#ff4400';
                break;
            case 'LIGHTNING':
                notification.textContent = '⚡ LIGHTNING STRIKE! ⚡';
                notification.style.color = '#44aaff';
                break;
            case 'ACID':
                notification.textContent = '🧪 ACID BATH! 🧪';
                notification.style.color = '#44ff44';
                break;
            case 'SPELL_COMBO':
                notification.textContent = '🌟 ULTRA COMBO! 🌟';
                notification.style.color = '#ff44ff';
                notification.style.fontSize = '60px';
                break;
            default:
                notification.textContent = `✨ ${spellName}! ✨`;
                notification.style.color = '#ffff44';
                break;
        }

        document.body.appendChild(notification);
        console.log(`🎬 Notification added to DOM, starting animation...`);

        // JavaScript-based animation for better compatibility
        let scale = 0.5;
        let opacity = 0;
        let rotation = 0;
        const duration = comboLevel > 1 ? 4000 : 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 0.2) {
                // Grow and fade in
                const subProgress = progress / 0.2;
                scale = 0.5 + (0.7 * subProgress); // 0.5 to 1.2
                opacity = subProgress;
            } else if (progress < 0.8) {
                // Stay visible and stable
                scale = 1.2 - (0.2 * (progress - 0.2) / 0.6); // 1.2 to 1.0
                opacity = 1;
            } else {
                // Fade out
                const subProgress = (progress - 0.8) / 0.2;
                scale = 1.0 - (0.2 * subProgress); // 1.0 to 0.8
                opacity = 1 - subProgress;
            }
            
            if (comboLevel > 1) {
                rotation = progress * 1440; // 4 full rotations for combos
            }
            
            notification.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
            notification.style.opacity = opacity.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete, remove notification
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                    console.log(`🎬 Notification animation complete, removed from DOM`);
                }
            }
        };
        
        requestAnimationFrame(animate);
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
}