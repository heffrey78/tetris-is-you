import { WordQueueItem, RuleMatrixPreview, Rule } from './types.js';
export declare class WordQueue {
    private queue;
    private wordPool;
    private nounWords;
    private propertyWords;
    private minQueueSize;
    constructor();
    private initializeQueue;
    private generateNewWord;
    private generateBalancedWord;
    private getColorForWord;
    consumeWords(count: number): WordQueueItem[];
    peekWords(count: number): WordQueueItem[];
    getQueue(): WordQueueItem[];
    getQueueSize(): number;
    previewEffect(lineCount: number): string;
    updateRuleMatrix(existingRules?: Rule[]): RuleMatrixPreview;
    private detectPotentialConflicts;
    private detectPotentialCascades;
    private createMockRule;
    getDisplayWords(): string[];
    validateBalance(): boolean;
    private rebalanceQueue;
}
