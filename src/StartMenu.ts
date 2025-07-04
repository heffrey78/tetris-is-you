import { GameConfig, DEFAULT_CONFIG } from './GameConfig.js';
import { AudioSystem } from './AudioSystem.js';

export interface RuleOption {
    noun: string;
    property: string;
    priority: number;
    description: string;
    category: string;
}

export class StartMenu {
    private menuElement: HTMLElement;
    private ruleGrid: HTMLElement;
    private startGameBtn: HTMLElement;
    private resetRulesBtn: HTMLElement;
    private selectedRules: Set<string> = new Set();
    private onStartGame?: (config: GameConfig) => Promise<void>;
    private audioSystem: AudioSystem;
    
    // Available rule options with descriptions
    private ruleOptions: RuleOption[] = [
        // Essential rules
        { noun: 'BLOCK', property: 'SOLID', priority: 100, description: 'Basic solid blocks', category: 'Essential' },
        { noun: 'WALL', property: 'STOP', priority: 100, description: 'Boundaries stop movement', category: 'Essential' },
        
        // Destruction effects
        { noun: 'T', property: 'BOMB', priority: 100, description: 'T-pieces explode in 3x3 area', category: 'Destruction' },
        { noun: 'I', property: 'LIGHTNING', priority: 100, description: 'I-pieces destroy entire rows', category: 'Destruction' },
        { noun: 'O', property: 'ACID', priority: 100, description: 'O-pieces dissolve blocks below', category: 'Destruction' },
        
        // Movement effects
        { noun: 'S', property: 'GHOST', priority: 100, description: 'S-pieces can pass through blocks', category: 'Movement' },
        { noun: 'Z', property: 'MAGNET', priority: 100, description: 'Z-pieces attract nearby blocks', category: 'Movement' },
        { noun: 'L', property: 'TELEPORT', priority: 100, description: 'L-pieces swap positions randomly', category: 'Movement' },
        
        // Protection effects
        { noun: 'J', property: 'SHIELD', priority: 100, description: 'J-pieces protect from destruction', category: 'Protection' },
        { noun: 'T', property: 'FREEZE', priority: 100, description: 'T-pieces stop falling temporarily', category: 'Protection' },
        
        // Creation effects
        { noun: 'I', property: 'MULTIPLY', priority: 100, description: 'I-pieces create copies when cleared', category: 'Creation' },
        { noun: 'O', property: 'SPAWN', priority: 100, description: 'O-pieces create new blocks above', category: 'Creation' },
        
        // Utility effects
        { noun: 'L', property: 'HEAL', priority: 100, description: 'L-pieces restore structural integrity', category: 'Utility' },
        { noun: 'J', property: 'REVEAL', priority: 100, description: 'J-pieces show enhanced previews', category: 'Utility' },
        { noun: 'S', property: 'SLOW', priority: 100, description: 'S-pieces reduce falling speed', category: 'Utility' },
        { noun: 'Z', property: 'FAST', priority: 100, description: 'Z-pieces increase falling speed', category: 'Utility' },
        
        // Advanced effects
        { noun: 'T', property: 'MELT', priority: 100, description: 'T-pieces disappear after 10 seconds', category: 'Advanced' },
        { noun: 'I', property: 'TRANSFORM', priority: 100, description: 'I-pieces change color over time', category: 'Advanced' },
        
        // Win/Lose conditions
        { noun: 'O', property: 'WIN', priority: 100, description: 'Touching O-pieces wins the game', category: 'Special' },
        { noun: 'I', property: 'LOSE', priority: 100, description: 'Touching I-pieces ends the game', category: 'Special' }
    ];
    
    constructor() {
        this.menuElement = document.getElementById('startMenu')!;
        this.ruleGrid = document.getElementById('ruleGrid')!;
        this.startGameBtn = document.getElementById('startGameBtn')!;
        this.resetRulesBtn = document.getElementById('resetRulesBtn')!;
        this.audioSystem = new AudioSystem({
            masterVolume: 0.5,
            musicVolume: 0.3,
            sfxVolume: 0.7,
            enableMusic: false, // Don't play music in menu
            enableSFX: true
        });
        
        this.initializeDefaultRules();
        this.setupEventListeners();
        this.renderRuleOptions();
    }
    
    private initializeDefaultRules(): void {
        // Add default rules from configuration
        DEFAULT_CONFIG.initialRules.forEach(rule => {
            const ruleKey = `${rule.noun}-${rule.property}`;
            this.selectedRules.add(ruleKey);
        });
    }
    
    private setupEventListeners(): void {
        this.startGameBtn.addEventListener('click', async () => {
            await this.audioSystem.resumeContext();
            this.audioSystem.playSoundEffect('success');
            this.startGame();
        });
        
        this.resetRulesBtn.addEventListener('click', async () => {
            await this.audioSystem.resumeContext();
            this.audioSystem.playSoundEffect('menuClick');
            this.resetToDefault();
        });
    }
    
    private renderRuleOptions(): void {
        // Group rules by category
        const categories: { [key: string]: RuleOption[] } = {};
        this.ruleOptions.forEach(rule => {
            if (!categories[rule.category]) {
                categories[rule.category] = [];
            }
            categories[rule.category].push(rule);
        });
        
        // Render each category
        this.ruleGrid.innerHTML = '';
        Object.keys(categories).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'rule-category';
            categoryDiv.innerHTML = `<h3 class="category-title">${category}</h3>`;
            
            categories[category].forEach(rule => {
                const ruleKey = `${rule.noun}-${rule.property}`;
                const isSelected = this.selectedRules.has(ruleKey);
                
                const ruleDiv = document.createElement('div');
                ruleDiv.className = `rule-option ${isSelected ? 'selected' : ''}`;
                ruleDiv.innerHTML = `
                    <input type="checkbox" class="rule-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="rule-description">
                        <div class="rule-name">${rule.noun} IS ${rule.property}</div>
                        <div class="rule-details">${rule.description}</div>
                    </div>
                `;
                
                ruleDiv.addEventListener('click', () => {
                    this.toggleRule(ruleKey, ruleDiv);
                });
                
                categoryDiv.appendChild(ruleDiv);
            });
            
            this.ruleGrid.appendChild(categoryDiv);
        });
    }
    
    private async toggleRule(ruleKey: string, ruleDiv: HTMLElement): Promise<void> {
        const checkbox = ruleDiv.querySelector('.rule-checkbox') as HTMLInputElement;
        
        await this.audioSystem.resumeContext();
        
        if (this.selectedRules.has(ruleKey)) {
            this.selectedRules.delete(ruleKey);
            ruleDiv.classList.remove('selected');
            checkbox.checked = false;
            this.audioSystem.playSoundEffect('menuClick');
        } else {
            this.selectedRules.add(ruleKey);
            ruleDiv.classList.add('selected');
            checkbox.checked = true;
            this.audioSystem.playSoundEffect('menuClick');
        }
        
        // Validate rule combinations
        this.validateRuleSelection();
    }
    
    private validateRuleSelection(): void {
        // Ensure at least BLOCK-SOLID and WALL-STOP are selected
        const hasBlockSolid = this.selectedRules.has('BLOCK-SOLID');
        const hasWallStop = this.selectedRules.has('WALL-STOP');
        
        const startBtn = this.startGameBtn as HTMLButtonElement;
        if (!hasBlockSolid || !hasWallStop) {
            startBtn.disabled = true;
            startBtn.textContent = 'Need Essential Rules';
            this.audioSystem.playSoundEffect('error');
        } else {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Game';
        }
    }
    
    private resetToDefault(): void {
        this.selectedRules.clear();
        this.initializeDefaultRules();
        this.renderRuleOptions();
        this.validateRuleSelection();
    }
    
    private async startGame(): Promise<void> {
        // Create configuration from selected rules
        const selectedRulesArray = Array.from(this.selectedRules).map(ruleKey => {
            const [noun, property] = ruleKey.split('-');
            const ruleOption = this.ruleOptions.find(r => r.noun === noun && r.property === property);
            return {
                noun,
                property,
                priority: ruleOption?.priority || 100
            };
        });
        
        const config: GameConfig = {
            ...DEFAULT_CONFIG,
            initialRules: selectedRulesArray
        };
        
        this.hide();
        
        if (this.onStartGame) {
            await this.onStartGame(config);
        }
    }
    
    public show(): void {
        this.menuElement.classList.remove('hidden');
    }
    
    public hide(): void {
        this.menuElement.classList.add('hidden');
    }
    
    public setOnStartGame(callback: (config: GameConfig) => Promise<void>): void {
        this.onStartGame = callback;
    }
}