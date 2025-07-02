import { PieceType, Position, Color, TetrisPiece as TetrisPieceInterface } from './types.js';

export class TetrisPiece implements TetrisPieceInterface {
    public type: PieceType;
    public position: Position;
    public rotation: number;
    public blocks!: Position[];
    public color: Color;
    public falling: boolean;

    private static readonly PIECE_SHAPES: Record<PieceType, Position[][]> = {
        'I': [
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }], // 0°
            [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }], // 90°
            [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }], // 180°
            [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }]  // 270°
        ],
        'O': [
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], // All rotations the same
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }]
        ],
        'T': [
            [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
            [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }], // 90°
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }], // 180°
            [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }]  // 270°
        ],
        'S': [
            [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], // 0°
            [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], // 90°
            [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }], // 180°
            [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }]  // 270°
        ],
        'Z': [
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
            [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }], // 90°
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // 180°
            [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }]  // 270°
        ],
        'J': [
            [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
            [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }], // 90°
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], // 180°
            [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }]  // 270°
        ],
        'L': [
            [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
            [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // 90°
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }], // 180°
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }]  // 270°
        ]
    };

    private static readonly PIECE_COLORS: Record<PieceType, Color> = {
        'I': { r: 0, g: 255, b: 255 },   // Cyan
        'O': { r: 255, g: 255, b: 0 },   // Yellow
        'T': { r: 128, g: 0, b: 128 },   // Purple
        'S': { r: 0, g: 255, b: 0 },     // Green
        'Z': { r: 255, g: 0, b: 0 },     // Red
        'J': { r: 0, g: 0, b: 255 },     // Blue
        'L': { r: 255, g: 165, b: 0 }    // Orange
    };

    constructor(type: PieceType, startPosition: Position) {
        this.type = type;
        this.position = { ...startPosition };
        this.rotation = 0;
        this.color = TetrisPiece.PIECE_COLORS[type];
        this.falling = true;
        this.updateBlocks();
    }

    private updateBlocks(): void {
        this.blocks = TetrisPiece.PIECE_SHAPES[this.type][this.rotation];
    }

    public rotate(clockwise: boolean = true): void {
        if (clockwise) {
            this.rotation = (this.rotation + 1) % 4;
        } else {
            this.rotation = (this.rotation + 3) % 4; // +3 is same as -1 mod 4
        }
        this.updateBlocks();
    }

    public move(dx: number, dy: number): void {
        this.position.x += dx;
        this.position.y += dy;
    }

    public getWorldBlocks(): Position[] {
        return this.blocks.map(block => ({
            x: this.position.x + block.x,
            y: this.position.y + block.y
        }));
    }

    public clone(): TetrisPiece {
        const cloned = new TetrisPiece(this.type, this.position);
        cloned.rotation = this.rotation;
        cloned.falling = this.falling;
        cloned.updateBlocks();
        return cloned;
    }

    public static createRandomPiece(startPosition: Position): TetrisPiece {
        const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new TetrisPiece(randomType, startPosition);
    }

    public static getNextPieces(count: number): PieceType[] {
        const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const pieces: PieceType[] = [];
        
        for (let i = 0; i < count; i++) {
            pieces.push(types[Math.floor(Math.random() * types.length)]);
        }
        
        return pieces;
    }
}