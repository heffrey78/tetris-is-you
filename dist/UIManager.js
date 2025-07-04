import { EFFECT_QUALITY_PRESETS } from './GameConfig.js';
export class UIManager {
    constructor() {
        this.activeRulesElement = document.getElementById('activeRules');
        this.ruleMatrixElement = document.getElementById('ruleMatrix');
        this.wordQueueElement = document.getElementById('wordQueue');
        this.currentScoreElement = document.getElementById('currentScore');
        this.currentLevelElement = document.getElementById('currentLevel');
        this.linesClearedElement = document.getElementById('linesCleared');
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.visualLegendElement = document.getElementById('visualLegend');
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
    setEffectSettingsCallback(callback) {
        this.effectSettingsCallback = callback;
    }
    setupOverlaySettings() {
        // Setup difficulty buttons
        const easyBtn = document.getElementById('overlayEasyBtn');
        const normalBtn = document.getElementById('overlayNormalBtn');
        const hardBtn = document.getElementById('overlayHardBtn');
        const currentDifficultySpan = document.getElementById('overlayCurrentDifficulty');
        if (easyBtn && normalBtn && hardBtn && currentDifficultySpan) {
            easyBtn.addEventListener('click', () => {
                currentDifficultySpan.textContent = 'Easy';
                this.updateDifficultyButtonStyles(easyBtn, normalBtn, hardBtn);
                // TODO: Add difficulty change callback if needed
            });
            normalBtn.addEventListener('click', () => {
                currentDifficultySpan.textContent = 'Normal';
                this.updateDifficultyButtonStyles(normalBtn, easyBtn, hardBtn);
                // TODO: Add difficulty change callback if needed
            });
            hardBtn.addEventListener('click', () => {
                currentDifficultySpan.textContent = 'Hard';
                this.updateDifficultyButtonStyles(hardBtn, easyBtn, normalBtn);
                // TODO: Add difficulty change callback if needed
            });
        }
        // Setup effect settings
        this.setupOverlayEffectSettings();
    }
    updateDifficultyButtonStyles(activeBtn, ...otherBtns) {
        activeBtn.style.background = '#0c7';
        activeBtn.style.borderColor = '#0e9';
        otherBtns.forEach(btn => {
            btn.style.background = '#333';
            btn.style.borderColor = '#555';
        });
    }
    setupOverlayEffectSettings() {
        const qualitySelect = document.getElementById('overlayEffectQuality');
        const maxEffectsSlider = document.getElementById('overlayMaxEffects');
        const maxEffectsValue = document.getElementById('overlayMaxEffectsValue');
        const particleDensitySlider = document.getElementById('overlayParticleDensity');
        const particleDensityValue = document.getElementById('overlayParticleDensityValue');
        if (!qualitySelect || !maxEffectsSlider || !maxEffectsValue || !particleDensitySlider || !particleDensityValue) {
            console.log('Some overlay effect elements not found');
            return;
        }
        // Remove existing event listeners if any (to prevent duplicates)
        qualitySelect.onchange = null;
        maxEffectsSlider.oninput = null;
        particleDensitySlider.oninput = null;
        // Initialize quality dropdown with better event handling
        qualitySelect.onchange = (e) => {
            e.stopPropagation();
            const quality = qualitySelect.value;
            const preset = EFFECT_QUALITY_PRESETS[quality];
            console.log('Quality changed to:', quality);
            // Update sliders to match preset
            maxEffectsSlider.value = preset.maxConcurrentEffects.toString();
            maxEffectsValue.textContent = preset.maxConcurrentEffects.toString();
            particleDensitySlider.value = preset.particleCount.toString();
            particleDensityValue.textContent = Math.round(preset.particleCount * 100) + '%';
            // Apply the preset
            if (this.effectSettingsCallback) {
                const configUpdate = {
                    visual: {
                        enableEnhancedEffects: true,
                        glowIntensity: 1.0,
                        animationSpeed: 1.0,
                        effectQuality: quality
                    },
                    effectIntensity: preset
                };
                // Update stored config
                if (this.currentConfig) {
                    this.currentConfig.visual = { ...this.currentConfig.visual, ...configUpdate.visual };
                    this.currentConfig.effectIntensity = { ...this.currentConfig.effectIntensity, ...configUpdate.effectIntensity };
                }
                this.effectSettingsCallback(configUpdate);
            }
        };
        // Initialize max effects slider
        maxEffectsSlider.oninput = (e) => {
            e.stopPropagation();
            maxEffectsValue.textContent = maxEffectsSlider.value;
            if (this.effectSettingsCallback) {
                const configUpdate = {
                    effectIntensity: {
                        particleCount: parseFloat(particleDensitySlider.value),
                        lightningComplexity: 1.0,
                        explosionRadius: 1.0,
                        sparkDensity: parseFloat(particleDensitySlider.value),
                        glowRadius: 1.0,
                        animationDuration: 1.0,
                        maxConcurrentEffects: parseInt(maxEffectsSlider.value)
                    }
                };
                // Update stored config
                if (this.currentConfig) {
                    this.currentConfig.effectIntensity = { ...this.currentConfig.effectIntensity, ...configUpdate.effectIntensity };
                }
                this.effectSettingsCallback(configUpdate);
            }
        };
        // Initialize particle density slider
        particleDensitySlider.oninput = (e) => {
            e.stopPropagation();
            const value = parseFloat(particleDensitySlider.value);
            particleDensityValue.textContent = Math.round(value * 100) + '%';
            if (this.effectSettingsCallback) {
                const configUpdate = {
                    effectIntensity: {
                        particleCount: value,
                        lightningComplexity: 1.0,
                        explosionRadius: 1.0,
                        sparkDensity: value,
                        glowRadius: 1.0,
                        animationDuration: 1.0,
                        maxConcurrentEffects: parseInt(maxEffectsSlider.value)
                    }
                };
                // Update stored config
                if (this.currentConfig) {
                    this.currentConfig.effectIntensity = { ...this.currentConfig.effectIntensity, ...configUpdate.effectIntensity };
                }
                this.effectSettingsCallback(configUpdate);
            }
        };
        console.log('Overlay effect settings initialized');
    }
    updateEffectSettings(config) {
        // Store the current config for use when recreating overlays
        this.currentConfig = config;
        // Update overlay elements if they exist
        const qualitySelect = document.getElementById('overlayEffectQuality');
        if (qualitySelect) {
            qualitySelect.value = config.visual.effectQuality;
        }
        const maxEffectsSlider = document.getElementById('overlayMaxEffects');
        const maxEffectsValue = document.getElementById('overlayMaxEffectsValue');
        if (maxEffectsSlider && maxEffectsValue) {
            maxEffectsSlider.value = config.effectIntensity.maxConcurrentEffects.toString();
            maxEffectsValue.textContent = config.effectIntensity.maxConcurrentEffects.toString();
        }
        const particleDensitySlider = document.getElementById('overlayParticleDensity');
        const particleDensityValue = document.getElementById('overlayParticleDensityValue');
        if (particleDensitySlider && particleDensityValue) {
            particleDensitySlider.value = config.effectIntensity.particleCount.toString();
            particleDensityValue.textContent = Math.round(config.effectIntensity.particleCount * 100) + '%';
        }
    }
    updateUI(gameState) {
        this.updateActiveRules(gameState.rules);
        this.updateRuleMatrix(gameState.ruleMatrix);
        this.updateWordQueue(gameState.wordQueue);
        this.updateNextPiecePreview(gameState.nextPiece, gameState.rules);
        this.updateVisualLegend(gameState.rules);
    }
    updateActiveRules(rules) {
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
    updateRuleMatrix(ruleMatrix) {
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
    updateWordQueue(wordQueue) {
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
            }
            else {
                wordDiv.style.backgroundColor = 'rgb(255, 150, 100)'; // Orange for properties
            }
            // Highlight first 3 words that will be used in next rule changes
            if (index < 3) {
                wordDiv.style.border = '2px solid #ffff00';
            }
            this.wordQueueElement.appendChild(wordDiv);
        });
    }
    showGameOver() {
        this.showOverlay('GAME OVER', 'Press R to restart', 'gameOverOverlay');
    }
    showPauseScreen() {
        this.showOverlay('PAUSED', 'Press P to resume', 'pauseOverlay');
    }
    hidePauseScreen() {
        this.hideOverlay('pauseOverlay');
    }
    showOverlay(title, subtitle, id) {
        const gameContainer = document.getElementById('gameContainer');
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameContainer && gameCanvas) {
            // Remove existing overlay if present
            this.hideOverlay(id);
            const overlay = document.createElement('div');
            overlay.id = id;
            overlay.style.position = 'absolute';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.zIndex = '1000';
            overlay.style.color = '#fff';
            overlay.style.fontFamily = '"Courier New", monospace';
            // Position overlay to cover only the canvas area (80% of container)
            const containerRect = gameContainer.getBoundingClientRect();
            const canvasRect = gameCanvas.getBoundingClientRect();
            // Position relative to container but sized to match canvas
            overlay.style.left = `${canvasRect.left - containerRect.left}px`;
            overlay.style.top = `${canvasRect.top - containerRect.top}px`;
            overlay.style.width = `${canvasRect.width}px`;
            overlay.style.height = `${canvasRect.height}px`;
            // Add settings to pause/game over screen
            const currentQuality = this.currentConfig?.visual?.effectQuality || 'high';
            const currentMaxEffects = this.currentConfig?.effectIntensity?.maxConcurrentEffects || 15;
            const currentParticleCount = this.currentConfig?.effectIntensity?.particleCount || 1.0;
            const settingsHtml = id === 'pauseOverlay' || id === 'gameOverOverlay' ? `
                <div style="display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; justify-content: center;">
                    <div style="padding: 20px; border: 2px solid #666; background: #222; text-align: left; min-width: 280px;">
                        <h3 style="margin: 0 0 15px 0; color: #0ff; text-align: center;">Difficulty</h3>
                        <div style="margin-bottom: 15px; text-align: center;">
                            <div style="color: #ccc; margin-bottom: 10px;">Current: <span id="overlayCurrentDifficulty" style="color: #ffff00;">Normal</span></div>
                            <div style="display: flex; gap: 10px; justify-content: center;">
                                <button id="overlayEasyBtn" style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 12px; cursor: pointer; border-radius: 3px;">Easy</button>
                                <button id="overlayNormalBtn" style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 12px; cursor: pointer; border-radius: 3px;">Normal</button>
                                <button id="overlayHardBtn" style="background: #333; color: #fff; border: 1px solid #555; padding: 8px 12px; cursor: pointer; border-radius: 3px;">Hard</button>
                            </div>
                            <div style="font-size: 10px; color: #888; margin-top: 8px;">F1: Easy | F2: Normal | F3: Hard</div>
                        </div>
                    </div>
                    <div style="padding: 20px; border: 2px solid #666; background: #222; text-align: left; min-width: 280px;">
                        <h3 style="margin: 0 0 15px 0; color: #0ff; text-align: center;">Effect Settings</h3>
                        <div style="margin-bottom: 10px; display: flex; align-items: center;">
                            <label style="display: block; margin-right: 10px; min-width: 80px; color: #ccc;">Quality:</label>
                            <select id="overlayEffectQuality" style="background: #333; color: #fff; border: 1px solid #555; padding: 6px; flex: 1; font-family: 'Courier New', monospace; font-size: 12px; position: relative; z-index: 1001;">
                                <option value="low" ${currentQuality === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${currentQuality === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${currentQuality === 'high' ? 'selected' : ''}>High</option>
                                <option value="ultra" ${currentQuality === 'ultra' ? 'selected' : ''}>Ultra</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 10px; display: flex; align-items: center;">
                            <label style="display: block; margin-right: 10px; min-width: 80px; color: #ccc;">Max Effects:</label>
                            <input type="range" id="overlayMaxEffects" min="5" max="20" value="${currentMaxEffects}" style="flex: 1; margin-right: 10px;">
                            <span id="overlayMaxEffectsValue" style="color: #0ff; min-width: 30px;">${currentMaxEffects}</span>
                        </div>
                        <div style="margin-bottom: 10px; display: flex; align-items: center;">
                            <label style="display: block; margin-right: 10px; min-width: 80px; color: #ccc;">Particles:</label>
                            <input type="range" id="overlayParticleDensity" min="0.2" max="2.0" step="0.1" value="${currentParticleCount}" style="flex: 1; margin-right: 10px;">
                            <span id="overlayParticleDensityValue" style="color: #0ff; min-width: 40px;">${Math.round(currentParticleCount * 100)}%</span>
                        </div>
                    </div>
                </div>
            ` : '';
            overlay.innerHTML = `
                <div id="overlayContent" style="text-align: center; padding: 40px; border: 3px solid #fff; background: #111; max-width: 90%; max-height: 90%; overflow-y: auto;">
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
                    ${settingsHtml}
                </div>
            `;
            // Prevent clicks inside the overlay content from closing the overlay
            const overlayContent = overlay.querySelector('#overlayContent');
            if (overlayContent) {
                overlayContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
            // Append to container, not canvas
            gameContainer.style.position = 'relative';
            gameContainer.appendChild(overlay);
            // Add event listeners for overlay settings with a slight delay to ensure DOM is ready
            if (id === 'pauseOverlay' || id === 'gameOverOverlay') {
                setTimeout(() => {
                    this.setupOverlaySettings();
                }, 10);
            }
        }
    }
    hideOverlay(id) {
        const overlay = document.getElementById(id);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }
    hideGameOver() {
        this.hideOverlay('gameOverOverlay');
    }
    updateScore(score, level, linesCleared) {
        this.currentScoreElement.textContent = score.toLocaleString();
        this.currentLevelElement.textContent = level.toString();
        this.linesClearedElement.textContent = linesCleared.toString();
    }
    showRuleChangeAnimation(ruleChange) {
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
    updateNextPiecePreview(nextPiece, rules = []) {
        // Clear the canvas
        this.nextPieceCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        if (!nextPiece)
            return;
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
    updateVisualLegend(rules) {
        this.visualLegendElement.innerHTML = '';
        // Get unique properties from active rules
        const activeProperties = [...new Set(rules.map(rule => rule.property))];
        // Define visual legend for common properties
        const legendDefinitions = {
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
//# sourceMappingURL=UIManager.js.map