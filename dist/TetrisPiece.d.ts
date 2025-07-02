import { PieceType, Position, Color, TetrisPiece as TetrisPieceInterface } from './types.js';
export declare class TetrisPiece implements TetrisPieceInterface {
    type: PieceType;
    position: Position;
    rotation: number;
    blocks: Position[];
    color: Color;
    falling: boolean;
    private static readonly PIECE_SHAPES;
    private static readonly PIECE_COLORS;
    constructor(type: PieceType, startPosition: Position);
    private updateBlocks;
    rotate(clockwise?: boolean): void;
    move(dx: number, dy: number): void;
    getWorldBlocks(): Position[];
    clone(): TetrisPiece;
    static createRandomPiece(startPosition: Position): TetrisPiece;
    static getNextPieces(count: number): PieceType[];
}
