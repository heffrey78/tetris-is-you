import { Game } from './Game.js';
import { ConfigLoader } from './ConfigLoader.js';
import { GameConfig } from './GameConfig.js';

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    
    let game: Game | null = null;
    const configLoader = ConfigLoader.getInstance();
    
    // Setup start game functionality for the existing HTML start menu
    const startGameBtn = document.getElementById('startGameBtn');
    const startMenu = document.getElementById('startMenu');
    
    if (startGameBtn && startMenu) {
        startGameBtn.addEventListener('click', async () => {
            // Use default configuration for now
            const config = configLoader.getCurrentConfig();
            
            // Hide start menu
            startMenu.classList.add('hidden');
            
            // Initialize and start the game
            game = new Game(canvas, config);
            await game.start();
            
            // Setup game input handlers
            setupGameInput(game);
        });
    }
    
    function setupGameInput(gameInstance: Game): void {
        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            gameInstance.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            gameInstance.handleKeyUp(event);
        });
        
        // Function to update difficulty display
        const updateDifficultyDisplay = (difficulty: string) => {
            const difficultyElement = document.getElementById('currentDifficulty');
            if (difficultyElement) {
                difficultyElement.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            }
        };

        // Add difficulty selection keys
        document.addEventListener('keydown', async (event) => {
            if (event.key === 'F1') {
                await gameInstance.loadConfiguration('easy');
                configLoader.saveConfigToStorage();
                updateDifficultyDisplay('easy');
            } else if (event.key === 'F2') {
                await gameInstance.loadConfiguration('normal');
                configLoader.saveConfigToStorage();
                updateDifficultyDisplay('normal');
            } else if (event.key === 'F3') {
                await gameInstance.loadConfiguration('hard');
                configLoader.saveConfigToStorage();
                updateDifficultyDisplay('hard');
            } else if (event.key === 'Escape') {
                // Show start menu again
                if (startMenu) {
                    startMenu.classList.remove('hidden');
                }
            }
        });
    }
});