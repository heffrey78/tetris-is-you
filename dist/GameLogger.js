export class GameLogger {
    constructor() {
        this.logs = [];
        this.logBuffer = [];
        this.maxBufferSize = 100;
        this.metrics = {
            totalRuleChanges: 0,
            spellEffectsTriggered: 0,
            conflictsResolved: 0,
            linesCleared: 0,
            gameStartTime: Date.now(),
            lastActivity: Date.now()
        };
        this.logInfo('SYSTEM', 'Game logger initialized');
    }
    createLogEntry(level, category, message, data) {
        return {
            timestamp: Date.now(),
            level,
            category,
            message,
            data
        };
    }
    addLog(entry) {
        this.logs.push(entry);
        this.metrics.lastActivity = entry.timestamp;
        // Add to buffer for file writing
        const formattedLog = this.formatLogEntry(entry);
        this.logBuffer.push(formattedLog);
        // Console output for immediate feedback
        console.log(`[${entry.level}:${entry.category}] ${entry.message}`);
        if (entry.data) {
            console.log('  Data:', entry.data);
        }
        // Manage buffer size
        if (this.logBuffer.length > this.maxBufferSize) {
            this.flushLogs();
        }
    }
    formatLogEntry(entry) {
        const time = new Date(entry.timestamp).toISOString();
        const dataStr = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
        return `${time} [${entry.level}:${entry.category}] ${entry.message}${dataStr}`;
    }
    // General logging methods
    logInfo(category, message, data) {
        this.addLog(this.createLogEntry('INFO', category, message, data));
    }
    // Rule system logging
    logRuleChange(action, rule, details) {
        this.metrics.totalRuleChanges++;
        this.addLog(this.createLogEntry('RULE', 'CHANGE', `${action}: [${rule.noun}] IS [${rule.property}]`, {
            action,
            rule,
            changeCount: this.metrics.totalRuleChanges,
            ...details
        }));
    }
    logRuleConflict(conflictType, rules, resolution) {
        this.metrics.conflictsResolved++;
        this.addLog(this.createLogEntry('CONFLICT', 'RESOLUTION', `${conflictType} conflict resolved: ${resolution}`, {
            conflictType,
            conflictingRules: rules.map(r => `[${r.noun}] IS [${r.property}]`),
            resolution,
            conflictCount: this.metrics.conflictsResolved
        }));
    }
    // Effect logging
    logSpellEffect(spellName, position, result, affected) {
        this.metrics.spellEffectsTriggered++;
        this.addLog(this.createLogEntry('EFFECT', 'SPELL', `${spellName} triggered at (${position.x}, ${position.y}): ${result}`, {
            spellName,
            position,
            result,
            affectedBlocks: affected?.length || 0,
            effectCount: this.metrics.spellEffectsTriggered,
            affected
        }));
    }
    logThrottledEffect(spellName, position, throttleInfo) {
        this.addLog(this.createLogEntry('EFFECT', 'THROTTLED', `${spellName} throttled at (${position.x}, ${position.y})`, {
            spellName,
            position,
            throttleInfo
        }));
    }
    // Gameplay logging
    logLineClear(lineCount, lines, spellsTriggered) {
        this.metrics.linesCleared += lineCount;
        this.addLog(this.createLogEntry('INFO', 'LINE_CLEAR', `${lineCount} lines cleared: [${lines.join(', ')}]`, {
            lineCount,
            clearedLines: lines,
            spellsTriggered,
            totalLinesCleared: this.metrics.linesCleared
        }));
    }
    logGameEvent(event, details) {
        this.addLog(this.createLogEntry('INFO', 'GAME', event, details));
    }
    // Metrics and analysis
    logMetrics() {
        const gameTime = Date.now() - this.metrics.gameStartTime;
        const activity = {
            ...this.metrics,
            gameTimeMs: gameTime,
            gameTimeMinutes: Math.round(gameTime / 60000 * 100) / 100,
            ruleChangesPerMinute: Math.round((this.metrics.totalRuleChanges / (gameTime / 60000)) * 100) / 100,
            effectsPerMinute: Math.round((this.metrics.spellEffectsTriggered / (gameTime / 60000)) * 100) / 100
        };
        this.addLog(this.createLogEntry('METRIC', 'SUMMARY', 'Game activity metrics', activity));
    }
    getInteractivityScore() {
        const gameTime = Date.now() - this.metrics.gameStartTime;
        const minutes = gameTime / 60000;
        if (minutes < 0.1)
            return 0; // Need at least 6 seconds of gameplay
        const ruleActivity = this.metrics.totalRuleChanges / minutes;
        const effectActivity = this.metrics.spellEffectsTriggered / minutes;
        const conflictActivity = this.metrics.conflictsResolved / minutes;
        // Weighted score: rule changes (40%), effects (40%), conflicts (20%)
        return Math.round((ruleActivity * 0.4 + effectActivity * 0.4 + conflictActivity * 0.2) * 100) / 100;
    }
    // File output methods
    flushLogs() {
        if (this.logBuffer.length === 0)
            return;
        // In browser environment, we'll store in localStorage or offer download
        try {
            const existingLogs = localStorage.getItem('tetris-is-you-logs') || '';
            const newLogs = this.logBuffer.join('\\n');
            localStorage.setItem('tetris-is-you-logs', existingLogs + '\\n' + newLogs);
            console.log(`📝 Flushed ${this.logBuffer.length} log entries to localStorage`);
            this.logBuffer = [];
        }
        catch (error) {
            console.warn('Failed to save logs to localStorage:', error);
        }
    }
    downloadLogs() {
        this.flushLogs(); // Ensure all logs are in localStorage
        try {
            const allLogs = localStorage.getItem('tetris-is-you-logs') || '';
            const gameReport = this.generateGameReport();
            const fullReport = gameReport + '\\n\\n=== DETAILED LOGS ===\\n' + allLogs;
            const blob = new Blob([fullReport], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tetris-is-you-log-${new Date().toISOString().slice(0, 16).replace(':', '-')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('📥 Game logs downloaded');
        }
        catch (error) {
            console.error('Failed to download logs:', error);
        }
    }
    generateGameReport() {
        this.logMetrics(); // Update final metrics
        const gameTime = Date.now() - this.metrics.gameStartTime;
        const interactivity = this.getInteractivityScore();
        return `=== TETRIS-IS-YOU GAME AUDIT REPORT ===
Game Start: ${new Date(this.metrics.gameStartTime).toISOString()}
Game Duration: ${Math.round(gameTime / 60000 * 100) / 100} minutes
Interactivity Score: ${interactivity}/10

METRICS SUMMARY:
- Total Rule Changes: ${this.metrics.totalRuleChanges}
- Spell Effects Triggered: ${this.metrics.spellEffectsTriggered}
- Conflicts Resolved: ${this.metrics.conflictsResolved}
- Lines Cleared: ${this.metrics.linesCleared}

ACTIVITY RATES:
- Rule Changes/Minute: ${Math.round((this.metrics.totalRuleChanges / (gameTime / 60000)) * 100) / 100}
- Effects/Minute: ${Math.round((this.metrics.spellEffectsTriggered / (gameTime / 60000)) * 100) / 100}
- Conflicts/Minute: ${Math.round((this.metrics.conflictsResolved / (gameTime / 60000)) * 100) / 100}

INTERACTIVITY ANALYSIS:
${interactivity >= 5 ? '✅ High interactivity - Rule system is actively engaging' :
            interactivity >= 2 ? '⚠️  Moderate interactivity - Some rule activity present' :
                '❌ Low interactivity - Rule system underutilized'}`;
    }
    clearLogs() {
        this.logs = [];
        this.logBuffer = [];
        localStorage.removeItem('tetris-is-you-logs');
        console.log('🗑️  Logs cleared');
    }
    // Get logs for debugging
    getLogs() {
        return [...this.logs];
    }
    getMetrics() {
        return { ...this.metrics };
    }
}
//# sourceMappingURL=GameLogger.js.map