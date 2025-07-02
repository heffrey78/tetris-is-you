// Core game types and interfaces

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a?: number;
}

// Rule system types
export interface Rule {
    id: string;
    noun: string;
    property: string;
    active: boolean;
    createdAt: number;
    priority: number; // Higher number = higher priority for conflict resolution
    source: 'base' | 'line-clear' | 'fusion'; // Track rule origin
    cooldownMs?: number; // For time-based effects
    lastTriggered?: number; // Throttling
}

export interface WordQueueItem {
    word: string;
    type: 'noun' | 'property';
    color: Color;
}

export interface RuleMatrixPreview {
    oneLineEffect: string;
    twoLineEffect: string;
    threeLineEffect: string;
    fourLineEffect: string;
    conflicts?: string[]; // Show potential conflicts
    cascades?: string[]; // Show potential chain reactions
}

// Tetris piece types
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetrisBlock {
    x: number;
    y: number;
    color: Color;
    solid: boolean;
    type: string;
}

export type PlayfieldCell = TetrisBlock | null;

export interface TetrisPiece {
    type: PieceType;
    position: Position;
    rotation: number;
    blocks: Position[];
    color: Color;
    falling: boolean;
}

// Rule conflict resolution
export interface RuleConflict {
    conflictingRules: Rule[];
    noun: string;
    properties: string[];
    resolution: 'priority' | 'newest' | 'fusion' | 'cancel';
    resolvedRule?: Rule;
}

// Effect throttling
export interface EffectThrottle {
    effectName: string;
    maxPerSecond: number;
    currentCount: number;
    windowStart: number;
}

// Game state
export interface GameState {
    score: number;
    level: number;
    linesCleared: number;
    gameOver: boolean;
    paused: boolean;
    currentPiece: TetrisPiece | null;
    nextPiece: TetrisPiece | null;
    playfield: PlayfieldCell[][];
    rules: Rule[];
    wordQueue: WordQueueItem[];
    ruleMatrix: RuleMatrixPreview;
    ruleConflicts: RuleConflict[]; // Track active conflicts
    effectThrottles: EffectThrottle[]; // Rate limiting
}

// Layout constants
export const LAYOUT = {
    PLAYFIELD_WIDTH_RATIO: 0.8,
    SIDE_PANEL_WIDTH_RATIO: 0.2,
    GRID_SIZE: 30,
    PLAYFIELD_COLS: 10,
    PLAYFIELD_ROWS: 20,
    MARGIN: 20,
    // Scaled values (set at runtime)
    SCALED_GRID_SIZE: 30,
    SCALED_MARGIN: 20,
    PLAYFIELD_PIXEL_WIDTH: 300,
    PLAYFIELD_PIXEL_HEIGHT: 600
} as const;