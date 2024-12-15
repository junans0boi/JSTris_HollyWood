import { blocks } from './Block.js';

export class Tetra {
    constructor(previousBlock = null) {
        const blockCount = 7; // garbage block을 제외한 블록 개수
        if (previousBlock === null) {
            // 랜덤으로 0 ~ 6번 블록 중 하나 선택
            this.type = Math.floor(Math.random() * blockCount);
        } else {
            // 이전 블록 제외
            const availableBlocks = Array.from({ length: blockCount }, (_, i) => i).filter(i => i !== previousBlock);
            this.type = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];
        }
        this.angle = 0; // 기본 각도 설정
        this.x = 0;     // 기본 X 위치 설정
        this.y = 0;     // 기본 Y 위치 설정
    }

    get shape() {
        return blocks[this.type].shape[this.angle];
    }

    rotate() {
        this.angle = (this.angle + 1) % 4; // 각도 회전
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getBlockData() {
        return {
            type: this.type,
            angle: this.angle,
            x: this.x,
            y: this.y
        };
    }

    setBlockData(data) {
        if (data && typeof data.type === 'number' && typeof data.angle === 'number' && typeof data.x === 'number' && typeof data.y === 'number') {
            this.type = data.type;
            this.angle = data.angle;
            this.x = data.x;
            this.y = data.y;
        } else {
            throw new Error("Invalid block data");
        }
    }
}
