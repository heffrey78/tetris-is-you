interface LogEntry {
    timestamp: number;
    level: 'INFO' | 'RULE' | 'EFFECT' | 'CONFLICT' | 'METRIC';
    category: string;
    message: string;
    data?: any;
}
interface GameMetrics {
    totalRuleChanges: number;
    spellEffectsTriggered: number;
    conflictsResolved: number;
    linesCleared: number;
    gameStartTime: number;
    lastActivity: number;
}
export declare class GameLogger {
    private logs;
    private metrics;
    private logBuffer;
    private maxBufferSize;
    constructor();
    private createLogEntry;
    private addLog;
    private formatLogEntry;
    logInfo(category: string, message: string, data?: any): void;
    logRuleChange(action: string, rule: {
        noun: string;
        property: string;
    }, details?: any): void;
    logRuleConflict(conflictType: string, rules: any[], resolution: string): void;
    logSpellEffect(spellName: string, position: {
        x: number;
        y: number;
    }, result: string, affected?: any[]): void;
    logThrottledEffect(spellName: string, position: {
        x: number;
        y: number;
    }, throttleInfo: any): void;
    logLineClear(lineCount: number, lines: number[], spellsTriggered: string[]): void;
    logGameEvent(event: string, details?: any): void;
    logMetrics(): void;
    getInteractivityScore(): number;
    private flushLogs;
    downloadLogs(): void;
    private generateGameReport;
    clearLogs(): void;
    getLogs(): LogEntry[];
    getMetrics(): GameMetrics;
}
export {};
