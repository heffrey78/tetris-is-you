export class TetrisPiece {
    constructor(type, startPosition) {
        this.type = type;
        this.position = { ...startPosition };
        this.rotation = 0;
        this.color = TetrisPiece.PIECE_COLORS[type];
        this.falling = true;
        this.updateBlocks();
    }
    updateBlocks() {
        this.blocks = TetrisPiece.PIECE_SHAPES[this.type][this.rotation];
    }
    rotate(clockwise = true) {
        if (clockwise) {
            this.rotation = (this.rotation + 1) % 4;
        }
        else {
            this.rotation = (this.rotation + 3) % 4; // +3 is same as -1 mod 4
        }
        this.updateBlocks();
    }
    move(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
    }
    getWorldBlocks() {
        return this.blocks.map(block => ({
            x: this.position.x + block.x,
            y: this.position.y + block.y
        }));
    }
    clone() {
        const cloned = new TetrisPiece(this.type, this.position);
        cloned.rotation = this.rotation;
        cloned.falling = this.falling;
        cloned.updateBlocks();
        return cloned;
    }
    static createRandomPiece(startPosition) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new TetrisPiece(randomType, startPosition);
    }
    static getNextPieces(count) {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const pieces = [];
        for (let i = 0; i < count; i++) {
            pieces.push(types[Math.floor(Math.random() * types.length)]);
        }
        return pieces;
    }
}
TetrisPiece.PIECE_SHAPES = {
    'I': [
        [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }], // 0°
        [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }], // 90°
        [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }], // 180°
        [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }] // 270°
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
        [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }] // 270°
    ],
    'S': [
        [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], // 0°
        [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], // 90°
        [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }], // 180°
        [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }] // 270°
    ],
    'Z': [
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
        [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }], // 90°
        [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // 180°
        [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }] // 270°
    ],
    'J': [
        [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
        [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }], // 90°
        [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }], // 180°
        [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] // 270°
    ],
    'L': [
        [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // 0°
        [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // 90°
        [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }], // 180°
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }] // 270°
    ]
};
TetrisPiece.PIECE_COLORS = {
    'I': { r: 0, g: 255, b: 255 }, // Cyan
    'O': { r: 255, g: 255, b: 0 }, // Yellow
    'T': { r: 128, g: 0, b: 128 }, // Purple
    'S': { r: 0, g: 255, b: 0 }, // Green
    'Z': { r: 255, g: 0, b: 0 }, // Red
    'J': { r: 0, g: 0, b: 255 }, // Blue
    'L': { r: 255, g: 165, b: 0 } // Orange
};
//# sourceMappingURL=TetrisPiece.js.map