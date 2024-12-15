// Grid.js

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = this.createEmptyGrid();
        this.reset();
    }

    // 특정 y라인의 블록 상태를 배열로 반환
    getLine(y) {
        const lineData = [];
        for (let x = 0; x < this.width; x++) {
            lineData.push(this.cells[x][y]);
        }
        return lineData;
    }

    // 비어있는 그리드 생성
    createEmptyGrid() {
        const grid = [];
        for (let x = 0; x < this.width; x++) {
            grid[x] = new Array(this.height).fill(null);
        }
        return grid;
    }

    // 셀 상태 확인
    isCellEmpty(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.cells[x][y] === null;
    }

    // 블록 배치
    placeBlock(x, y, type) {
        if (y >= 0) {
            this.cells[x][y] = type;
        }
    }

    // 라인 체크
    checkLines() {
        const fullLines = [];
        for (let y = this.height - 1; y >= 0; y--) {
            let isFull = true;
            for (let x = 0; x < this.width; x++) {
                if (this.cells[x][y] === null) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                fullLines.push(y);
            }
        }
        return fullLines;
    }

    // 라인 삭제
    clearLines(lines) {
        // Sort the lines in ascending order to process from bottom to top
        lines.sort((a, b) => a - b);

        for (let i = 0; i < lines.length; i++) {
            const clearedLine = lines[i];
            for (let y = clearedLine; y > 0; y--) {
                for (let x = 0; x < this.width; x++) {
                    this.cells[x][y] = this.cells[x][y - 1];
                }
            }
            // Clear the topmost line
            for (let x = 0; x < this.width; x++) {
                this.cells[x][0] = null;
            }
        }
    }


    // 그리드 초기화
    reset() {
        this.cells = this.createEmptyGrid();
    }

    // 2D 배열(cells)을 1D 배열로 변환.
    flattenCells() {
        const result = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.cells[x][y];
                result.push(cell === null ? -1 : cell);
            }
        }
        return result;
    }
    addGarbageLine(garbageLine) {
        // 모든 행을 위로 한 줄씩 이동
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[x][y] = this.cells[x][y + 1];
            }
        }
        // 하단에 GarbageLine 추가
        for (let x = 0; x < this.width; x++) {
            this.cells[x][this.height - 1] = garbageLine[x];
        }
    }

    removeGarbageLines(count) {
        for (let i = 0; i < count; i++) {
            // 가장 위쪽의 GarbageLine을 제거
            let removed = false;
            for (let y = 0; y < this.height; y++) {
                let isGarbageLine = true;
                for (let x = 0; x < this.width; x++) {
                    if (this.cells[x][y] !== 6 && this.cells[x][y] !== null) { // 6은 garbage block의 type index
                        isGarbageLine = false;
                        break;
                    }
                }
                if (isGarbageLine) {
                    // GarbageLine 제거 및 모든 행을 아래로 한 줄씩 이동
                    for (let x = 0; x < this.width; x++) {
                        for (let row = y; row > 0; row--) {
                            this.cells[x][row] = this.cells[x][row - 1];
                        }
                        this.cells[x][0] = null; // 최상단은 비워둠
                    }
                    removed = true;
                    break;
                }
            }
            if (!removed) {
                break; // 더 이상 제거할 GarbageLine이 없으면 중지
            }
        }
    }

    // 배열 직렬화 (2D -> 1D)
    serialize() {
        return this.flattenCells();
    }
}
