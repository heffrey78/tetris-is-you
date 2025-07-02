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
export interface Rule {
    id: string;
    noun: string;
    property: string;
    active: boolean;
    createdAt: number;
    priority: number;
    source: 'base' | 'line-clear' | 'fusion';
    cooldownMs?: number;
    lastTriggered?: number;
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
    conflicts?: string[];
    cascades?: string[];
}
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
export interface RuleConflict {
    conflictingRules: Rule[];
    noun: string;
    properties: string[];
    resolution: 'priority' | 'newest' | 'fusion' | 'cancel';
    resolvedRule?: Rule;
}
export interface EffectThrottle {
    effectName: string;
    maxPerSecond: number;
    currentCount: number;
    windowStart: number;
}
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
    ruleConflicts: RuleConflict[];
    effectThrottles: EffectThrottle[];
}
export declare const LAYOUT: {
    readonly PLAYFIELD_WIDTH_RATIO: 0.8;
    readonly SIDE_PANEL_WIDTH_RATIO: 0.2;
    readonly GRID_SIZE: 30;
    readonly PLAYFIELD_COLS: 10;
    readonly PLAYFIELD_ROWS: 20;
    readonly MARGIN: 20;
    readonly SCALED_GRID_SIZE: 30;
    readonly SCALED_MARGIN: 20;
    readonly PLAYFIELD_PIXEL_WIDTH: 300;
    readonly PLAYFIELD_PIXEL_HEIGHT: 600;
};
