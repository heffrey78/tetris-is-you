import { Game } from './Game.js';
import { ConfigLoader } from './ConfigLoader.js';
import { StartMenu } from './StartMenu.js';
// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    let game = null;
    const configLoader = ConfigLoader.getInstance();
    // Initialize start menu
    const startMenu = new StartMenu();
    // Setup start menu callback
    startMenu.setOnStartGame(async (config) => {
        // Save the selected configuration
        configLoader.updateConfig(config);
        configLoader.saveConfigToStorage();
        // Initialize and start the game
        game = new Game(canvas, config);
        await game.start();
        // Setup game input handlers
        setupGameInput(game);
    });
    // Show the start menu initially
    startMenu.show();
    function setupGameInput(gameInstance) {
        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            gameInstance.handleKeyDown(event);
        });
        document.addEventListener('keyup', (event) => {
            gameInstance.handleKeyUp(event);
        });
        // Function to update difficulty display
        const updateDifficultyDisplay = (difficulty) => {
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
            }
            else if (event.key === 'F2') {
                await gameInstance.loadConfiguration('normal');
                configLoader.saveConfigToStorage();
                updateDifficultyDisplay('normal');
            }
            else if (event.key === 'F3') {
                await gameInstance.loadConfiguration('hard');
                configLoader.saveConfigToStorage();
                updateDifficultyDisplay('hard');
            }
            else if (event.key === 'Escape') {
                // Show start menu again
                startMenu.show();
            }
        });
    }
});
//# sourceMappingURL=main.js.map