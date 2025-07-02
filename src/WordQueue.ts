import { WordQueueItem, Color, RuleMatrixPreview, Rule } from './types.js';
import { RuleConflictResolver } from './RuleConflictResolver.js';

export class WordQueue {
    private queue: WordQueueItem[] = [];
    private wordPool: string[] = [
        // Nouns
        'BLOCK', 'I-BLOCK', 'O-BLOCK', 'T-BLOCK', 'L-BLOCK', 'J-BLOCK', 'S-BLOCK', 'Z-BLOCK',
        'WALL', 'CRYSTAL', 'RUNE', 'ORB', 'SHARD', 'EMBER', 'FROST',
        
        // Spell Properties
        'BOMB', 'LIGHTNING', 'ACID', 'SHIELD', 'FREEZE', 'MAGNET', 'TELEPORT',
        'MULTIPLY', 'SPAWN', 'TRANSFORM', 'HEAL', 'REVEAL', 'SLOW', 'FAST',
        'SOLID', 'GHOST', 'WIN', 'LOSE', 'BLUE', 'RED', 'GREEN'
    ];
    
    private nounWords: string[] = [
        'BLOCK', 'I-BLOCK', 'O-BLOCK', 'T-BLOCK', 'L-BLOCK', 'J-BLOCK', 'S-BLOCK', 'Z-BLOCK',
        'WALL', 'CRYSTAL', 'RUNE', 'ORB', 'SHARD', 'EMBER', 'FROST'
    ];
    
    private propertyWords: string[] = [
        // Basic Properties
        'SOLID', 'GHOST',
        // Destruction Spells
        'BOMB', 'LIGHTNING', 'ACID',
        // Protection Spells  
        'SHIELD', 'FREEZE',
        // Movement Spells
        'MAGNET', 'TELEPORT',
        // Creation Spells
        'MULTIPLY', 'SPAWN', 'TRANSFORM',
        // Utility Spells
        'HEAL', 'REVEAL', 'SLOW', 'FAST',
        // Win/Lose Conditions
        'WIN', 'LOSE',
        // Colors (for visual variety)
        'BLUE', 'RED', 'GREEN'
    ];
    
    private minQueueSize: number = 10;
    
    constructor() {
        this.initializeQueue();
    }
    
    private initializeQueue(): void {
        // Fill initial queue with balanced word types
        for (let i = 0; i < this.minQueueSize; i++) {
            this.generateNewWord();
        }
    }
    
    private generateNewWord(): void {
        // Balance between nouns and properties
        const isNoun = Math.random() > 0.5;
        const wordArray = isNoun ? this.nounWords : this.propertyWords;
        const word = wordArray[Math.floor(Math.random() * wordArray.length)];
        const type = isNoun ? 'noun' : 'property';
        
        const color = this.getColorForWord(word, type);
        
        const wordItem: WordQueueItem = {
            word,
            type,
            color
        };
        
        this.queue.push(wordItem);
    }
    
    private generateBalancedWord(): void {
        // Analyze current queue balance
        const currentQueue = this.queue.slice(0, 8); // Look at next 8 words
        const nounCount = currentQueue.filter(w => w.type === 'noun').length;
        const propertyCount = currentQueue.filter(w => w.type === 'property').length;
        
        // Determine if we need to bias toward nouns or properties
        let preferNoun: boolean;
        if (nounCount < propertyCount - 1) {
            preferNoun = true; // Need more nouns
        } else if (propertyCount < nounCount - 1) {
            preferNoun = false; // Need more properties
        } else {
            preferNoun = Math.random() > 0.5; // Balanced, random choice
        }
        
        const wordArray = preferNoun ? this.nounWords : this.propertyWords;
        const type = preferNoun ? 'noun' : 'property';
        
        // Avoid generating duplicate words in recent queue
        const recentWords = this.queue.slice(0, 5).map(w => w.word);
        let word: string;
        let attempts = 0;
        do {
            word = wordArray[Math.floor(Math.random() * wordArray.length)];
            attempts++;
        } while (recentWords.includes(word) && attempts < 10);
        
        const color = this.getColorForWord(word, type);
        
        const wordItem: WordQueueItem = {
            word,
            type,
            color
        };
        
        this.queue.push(wordItem);
        
        console.log(`🔧 Generated balanced word: ${word}(${type}) - Queue balance: ${nounCount}N/${propertyCount}P`);
    }
    
    private getColorForWord(word: string, type: 'noun' | 'property'): Color {
        // Color coding for different word types
        if (type === 'noun') {
            return { r: 100, g: 150, b: 255 }; // Blue for nouns
        } else {
            return { r: 255, g: 150, b: 100 }; // Orange for properties
        }
    }
    
    public consumeWords(count: number): WordQueueItem[] {
        if (count > this.queue.length) {
            console.warn(`Cannot consume ${count} words, only ${this.queue.length} available`);
            return [];
        }
        
        console.log(`🔧 Word queue before consumption (${this.queue.length} words):`, this.queue.slice(0, 5).map(w => `${w.word}(${w.type})`));
        
        const consumedWords = this.queue.splice(0, count);
        
        console.log(`🔧 Consumed ${count} words:`, consumedWords.map(w => `${w.word}(${w.type})`));
        
        // Refill queue to maintain minimum size with intelligent balancing
        while (this.queue.length < this.minQueueSize) {
            this.generateBalancedWord();
        }
        
        console.log(`🔧 Word queue after refill (${this.queue.length} words):`, this.queue.slice(0, 5).map(w => `${w.word}(${w.type})`));
        
        return consumedWords;
    }
    
    public peekWords(count: number): WordQueueItem[] {
        return this.queue.slice(0, count);
    }
    
    public getQueue(): WordQueueItem[] {
        return [...this.queue]; // Return copy to prevent external modification
    }
    
    public getQueueSize(): number {
        return this.queue.length;
    }
    
    public previewEffect(lineCount: number): string {
        if (lineCount < 1 || lineCount > 4) {
            return 'Invalid line count';
        }
        
        const previewWords = this.peekWords(3);
        if (previewWords.length < 3) {
            return 'Not enough words in queue';
        }
        
        switch (lineCount) {
            case 1:
                return `[SOLID] becomes [${previewWords[0].word}]`;
            case 2:
                return `[BLOCK] becomes [${previewWords[1].word}]`;
            case 3:
                return `New Rule: [${previewWords[2].word}] IS [HOT]`;
            case 4:
                return `FUSION: [${previewWords[0].word}] + [${previewWords[1].word}] + [${previewWords[2].word}]`;
            default:
                return 'Unknown effect';
        }
    }
    
    public updateRuleMatrix(existingRules?: Rule[]): RuleMatrixPreview {
        const matrix: RuleMatrixPreview = {
            oneLineEffect: this.previewEffect(1),
            twoLineEffect: this.previewEffect(2),
            threeLineEffect: this.previewEffect(3),
            fourLineEffect: this.previewEffect(4)
        };
        
        // If existing rules provided, analyze potential conflicts and cascades
        if (existingRules) {
            matrix.conflicts = this.detectPotentialConflicts(existingRules);
            matrix.cascades = this.detectPotentialCascades(existingRules);
        }
        
        return matrix;
    }
    
    private detectPotentialConflicts(existingRules: Rule[]): string[] {
        const conflicts: string[] = [];
        const previewWords = this.peekWords(3);
        
        // Check each potential rule change for conflicts
        for (let i = 0; i < 4; i++) {
            const mockRule = this.createMockRule(i + 1, previewWords, existingRules);
            if (mockRule) {
                const conflict = RuleConflictResolver.detectConflicts(mockRule, existingRules);
                if (conflict) {
                    conflicts.push(`${i + 1}-Line: ${conflict.properties.join(' vs ')}`);
                }
            }
        }
        
        return conflicts;
    }
    
    private detectPotentialCascades(existingRules: Rule[]): string[] {
        const cascades: string[] = [];
        const previewWords = this.peekWords(3);
        
        // Check for dangerous combinations
        previewWords.forEach((word, index) => {
            // Check if this word would create exponential effects
            if (['MULTIPLY', 'SPAWN'].includes(word.word)) {
                const explosiveRules = existingRules.filter(r => 
                    ['BOMB', 'LIGHTNING', 'ACID'].includes(r.property)
                );
                if (explosiveRules.length > 0) {
                    cascades.push(`${index + 1}-Line: ${word.word} + explosives = chain reaction`);
                }
            }
            
            // Check for win condition interactions
            if (word.word === 'WIN') {
                const loseRules = existingRules.filter(r => r.property === 'LOSE');
                if (loseRules.length > 0) {
                    cascades.push(`${index + 1}-Line: WIN + LOSE conflict possible`);
                }
            }
        });
        
        return cascades;
    }
    
    private createMockRule(lineCount: number, previewWords: WordQueueItem[], existingRules: Rule[]): Rule | null {
        if (previewWords.length < 3) return null;
        
        const primaryRule = existingRules.find(r => r.source === 'base') || existingRules[0];
        if (!primaryRule) return null;
        
        const mockId = `mock-${Date.now()}`;
        const now = Date.now();
        
        switch (lineCount) {
            case 1: // Property change
                return {
                    id: mockId,
                    noun: primaryRule.noun,
                    property: previewWords[0].word,
                    active: true,
                    createdAt: now,
                    priority: 200,
                    source: 'line-clear'
                };
                
            case 2: // Noun change  
                return {
                    id: mockId,
                    noun: previewWords[1].word,
                    property: primaryRule.property,
                    active: true,
                    createdAt: now,
                    priority: 200,
                    source: 'line-clear'
                };
                
            case 3: // New rule
                return {
                    id: mockId,
                    noun: 'BLOCK',
                    property: previewWords[2].word,
                    active: true,
                    createdAt: now,
                    priority: 200,
                    source: 'line-clear'
                };
                
            case 4: // Fusion rule
                return {
                    id: mockId,
                    noun: previewWords[1].word,
                    property: `FUSION_${previewWords[0].word}_${previewWords[1].word}_${previewWords[2].word}`,
                    active: true,
                    createdAt: now,
                    priority: 300,
                    source: 'fusion'
                };
                
            default:
                return null;
        }
    }
    
    // Get words formatted for display
    public getDisplayWords(): string[] {
        return this.queue.map(item => item.word);
    }
    
    // Validate word balance to prevent game-breaking combinations
    public validateBalance(): boolean {
        const recentWords = this.peekWords(5);
        
        // Check for too many win conditions
        const winWords = recentWords.filter(w => w.word === 'WIN').length;
        if (winWords > 1) {
            console.warn('Too many WIN words in queue, rebalancing...');
            this.rebalanceQueue();
            return false;
        }
        
        // Check for conflicting properties
        const hotCold = recentWords.filter(w => w.word === 'HOT' || w.word === 'COLD').length;
        if (hotCold > 2) {
            console.warn('Too many temperature words, rebalancing...');
            this.rebalanceQueue();
            return false;
        }
        
        return true;
    }
    
    private rebalanceQueue(): void {
        // Remove problematic words and regenerate
        const problematicWords = ['WIN', 'LOSE'];
        
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (problematicWords.includes(this.queue[i].word)) {
                this.queue.splice(i, 1);
                this.generateNewWord();
            }
        }
    }
}