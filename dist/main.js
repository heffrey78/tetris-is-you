import { Game } from './Game.js';
// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    const game = new Game(canvas);
    game.start();
    // Handle keyboard input
    document.addEventListener('keydown', (event) => {
        game.handleKeyDown(event);
    });
    document.addEventListener('keyup', (event) => {
        game.handleKeyUp(event);
    });
});
//# sourceMappingURL=main.js.map