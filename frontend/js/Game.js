// Game.js
import { Tetra } from './Tetra.js';
import { Grid } from './Grid.js';
import { blocks } from './Block.js';

export class Game {
  constructor(stageCanvas, nextCanvas, network) {
    this.network = network; // Network 인스턴스를 받아옵니다.
    this.isPaused = false;
    this.isRunning = false;
    this.isGameOver = false;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMoveLeft = this.moveLeft.bind(this);
    this.handleRotate = this.rotate.bind(this);
    this.handleMoveRight = this.moveRight.bind(this);
    this.handleFall = this.fall.bind(this);

    this.stageCanvas = stageCanvas;
    this.nextCanvas = nextCanvas;
    this.stageWidth = 10;
    this.stageHeight = 20;
    this.onGameOver = null;
    this.cellSize = this.calculateCellSize();
    this.stageLeftPadding = (this.stageCanvas.width - this.cellSize * this.stageWidth) / 2;
    this.stageTopPadding = (this.stageCanvas.height - this.cellSize * this.stageHeight) / 2;

    this.grid = new Grid(this.stageWidth, this.stageHeight);
    this.currentTetra = null;
    this.nextTetra = new Tetra();
    this.score = 0;
    this.deletedLines = 0;

    this.previousBlock = null; // 이전 블록을 추적
    this.storedTetra = null; // 저장된 테트로미노 변수

    this.context = this.stageCanvas.getContext('2d');
    this.nextContext = this.nextCanvas.getContext('2d');

    this.isArrowUpPressed = false; // ArrowUp 키 입력 상태 저장
    this.rotateTimer = null; // ArrowUp 키로 인한 회전 타이머

    this.isLeftPressed = false;  // ArrowLeft 키 상태
    this.isRightPressed = false; // ArrowRight 키 상태
    this.moveLeftTimer = null;  // 왼쪽 이동 타이머
    this.moveRightTimer = null; // 오른쪽 이동 타이머

    this.gameOverSent = false;
  }

  // Calculate cell size dynamically based on canvas dimensions
  calculateCellSize() {
    const cellWidth = this.stageCanvas.width / this.stageWidth;
    const cellHeight = this.stageCanvas.height / this.stageHeight;
    return Math.min(cellWidth, cellHeight);
  }

  // Start the game
  start() {
    if (this.isRunning) return; // Prevent multiple game loops
    console.log("Game started");
    this.bindEvents();
    this.reset();
    this.gameSpeed = 500;
    this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    this.isRunning = true;
  }

  // Reset the game state
  reset() {
    this.grid.reset();
    this.currentTetra = null;
    this.nextTetra = new Tetra();
    this.score = 0;
    this.deletedLines = 0;
    this.isGameOver = false;

    document.getElementById("lines").innerText = "0";
    document.getElementById("message").innerText = "";
  }
  // Game.js 내에 stop 메소드 추가
  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.isRunning = false;
    this.isGameOver = true;
    this.unbindEvents(); // 이벤트 리스너 해제
    this.clearCanvas(this.context, this.stageCanvas); // 캔버스 초기화
    this.clearCanvas(this.nextContext, this.nextCanvas); // 다음 블록 캔버스 초기화
    console.log("게임이 중지되고 캔버스가 초기화되었습니다.");
  }


  // 입력 이벤트 해제를 위한 메소드 추가
  unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    // 추가적인 이벤트 해제 필요 시 여기서 처리
  }


  // Bind user input events
  bindEvents() {
    if (this.isRunning) return;

    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowLeft':
          if (!this.isLeftPressed) {
            this.isLeftPressed = true;
            this.startMoveLeftTimer();
          }
          break;
        case 'ArrowRight':
          if (!this.isRightPressed) {
            this.isRightPressed = true;
            this.startMoveRightTimer();
          }
          break;
        default:
          this.handleKeyDown(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowLeft':
          this.isLeftPressed = false;
          this.stopMoveLeftTimer();
          break;
        case 'ArrowRight':
          this.isRightPressed = false;
          this.stopMoveRightTimer();
          break;
      }
    });

    document.getElementById("tetris-move-left-button").addEventListener('click', this.handleMoveLeft);
    document.getElementById("tetris-rotate-button").addEventListener('click', this.handleRotate);
    document.getElementById("tetris-move-right-button").addEventListener('click', this.handleMoveRight);
    document.getElementById("tetris-fall-button").addEventListener('click', this.handleFall);

    document.getElementById("tetris-move-left-button").addEventListener('touchstart', this.handleMoveLeft);
    document.getElementById("tetris-rotate-button").addEventListener('touchstart', this.handleRotate);
    document.getElementById("tetris-move-right-button").addEventListener('touchstart', this.handleMoveRight);
    document.getElementById("tetris-fall-button").addEventListener('touchstart', this.handleFall);

    // // 테스트 버튼 이벤트 핸들러 추가
    // document.getElementById("add-garbage-button").addEventListener('click', () => {
    //   this.addGarbageLines([[1, 1, 1, 1, null, 1, 1, 1, 1, 1]]); // 임의의 장애 라인 추가
    // });
  }

  // 왼쪽 이동 타이머 시작
  startMoveLeftTimer() {
    if (this.moveLeftTimer) return; // 이미 타이머가 작동 중이면 중복 방지
    this.moveLeft(); // 즉시 한 번 이동
    this.moveLeftTimer = setInterval(() => {
      this.moveLeft();
    }, 100); // 100ms 간격으로 이동
  }

  // 왼쪽 이동 타이머 정지
  stopMoveLeftTimer() {
    if (this.moveLeftTimer) {
      clearInterval(this.moveLeftTimer);
      this.moveLeftTimer = null;
    }
  }

  // 오른쪽 이동 타이머 시작
  startMoveRightTimer() {
    if (this.moveRightTimer) return; // 이미 타이머가 작동 중이면 중복 방지
    this.moveRight(); // 즉시 한 번 이동
    this.moveRightTimer = setInterval(() => {
      this.moveRight();
    }, 100); // 100ms 간격으로 이동
  }

  // 오른쪽 이동 타이머 정지
  stopMoveRightTimer() {
    if (this.moveRightTimer) {
      clearInterval(this.moveRightTimer);
      this.moveRightTimer = null;
    }
  }


  // ArrowUp 입력 시 회전 타이머 시작
  startRotateTimer() {
    if (this.rotateTimer) return; // 이미 타이머가 작동 중이면 중복 방지
    this.rotateTimer = setInterval(() => {
      this.rotate(); // 지속적으로 블록 회전
    }, 200); // 200ms 간격으로 회전
  }

  // ArrowUp 입력 해제 시 회전 타이머 정지
  stopRotateTimer() {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  // Handle keydown events
  handleKeyDown(e) {
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'Space', 'Escape', 'KeyC'].includes(e.code)) {
      e.preventDefault(); // Prevent default browser actions
    }

    switch (e.code) {
      case 'ArrowLeft': this.moveLeft(); break;
      case 'ArrowUp': this.rotate(); break;
      case 'ArrowRight': this.moveRight(); break;
      case 'Space': this.fall(); break;
      case 'Escape': this.togglePause(); break;
      case 'KeyC': this.storeBlock(); break;  // 블록 저장
    }
  }

  storeBlock() {
    if (this.storedTetra) {
      // Swap the current Tetra with the stored one
      const temp = this.currentTetra;
      this.currentTetra = this.storedTetra;
      this.storedTetra = temp;

      // Reset positions of swapped tetriminos
      this.currentTetra.setPosition(Math.floor(this.stageWidth / 2 - 1), 0);

      // Make sure the swapped tetrimino is valid
      if (!this.canMove(this.currentTetra.x, this.currentTetra.y, this.currentTetra.type, this.currentTetra.angle)) {
        this.gameOver();
      }
    } else {
      // If no tetrimino is stored, just store the current one
      this.storedTetra = this.currentTetra;
      this.currentTetra = null; // Set current Tetra to null, as it was stored
      this.spawnTetra(); // Spawn a new block to continue the game
    }

    this.draw();  // Redraw the game state
  }

  // Update the game state and render it
  update() {
    if (this.isGameOver) {
      clearInterval(this.gameLoop);
      return;
    }

    if (!this.currentTetra) {
      if (!this.spawnTetra()) {
        this.gameOver();
        return;
      }
    } else {
      if (this.canMove(this.currentTetra.x, this.currentTetra.y + 1, this.currentTetra.type, this.currentTetra.angle)) {
        this.currentTetra.y++;
      } else {
        // ArrowUp이 눌리지 않았을 때만 고정
        if (!this.isArrowUpPressed) {
          this.mergeTetra();
          this.clearFullLines();
          this.currentTetra = null;
        }
      }
    }

    console.log("Game updated");
    this.draw();

    // // Increase speed after every 10 lines
    // if (this.deletedLines % 10 === 0 && this.deletedLines !== 0) {
    //   this.increaseSpeed();
    // }
  }



  // Spawn a new tetromino
  spawnTetra() {
    if (this.nextTetra) {
      this.currentTetra = this.nextTetra;
    } else {
      this.currentTetra = new Tetra();
    }

    this.previousBlock = this.currentTetra.type;

    this.nextTetra = new Tetra(this.previousBlock);

    this.drawNextTetra();

    this.currentTetra.setPosition(Math.floor(this.stageWidth / 2 - 1), 0);

    if (!this.canMove(this.currentTetra.x, this.currentTetra.y, this.currentTetra.type, this.currentTetra.angle)) {
      return false; // Game over if no space for new Tetra
    }
    return true;
  }

  // Check if movement is possible
  canMove(x, y, type, angle) {
    const shape = blocks[type].shape[angle];
    for (let i = 0; i < shape.length; i++) {
      const cellX = x + shape[i][0];
      const cellY = y + shape[i][1];
      if (cellX < 0 || cellX >= this.stageWidth || cellY >= this.stageHeight) return false;
      if (cellY >= 0 && !this.grid.isCellEmpty(cellX, cellY)) return false;
    }
    return true;
  }

  // Merge Tetra into the grid
  mergeTetra() {
    const { x, y, type, angle } = this.currentTetra;
    const shape = blocks[type].shape[angle];
    for (let i = 0; i < shape.length; i++) {
      const cellX = x + shape[i][0];
      const cellY = y + shape[i][1];
      this.grid.placeBlock(cellX, cellY, type);
    }
  }

  // Move Tetra down immediately
  fall() {
    if (this.currentTetra) {
      // 블록이 끝까지 떨어질 수 있는 y 위치 계산
      while (this.canMove(this.currentTetra.x, this.currentTetra.y + 1, this.currentTetra.type, this.currentTetra.angle)) {
        this.currentTetra.y++;
      }

      // 바닥에 도달한 블록 즉시 고정
      this.mergeTetra();
      this.clearFullLines(); // 가득 찬 라인 삭제
      this.currentTetra = null; // 새로운 블록 생성을 준비

      // 서버로 떨어지기 메시지 전송
      this.network.send({ type: 'player_move', direction: 'fall' });

      // 새 블록 생성 시도
      if (!this.spawnTetra()) {
        this.gameOver(); // 블록 생성 실패 시 게임 오버
      }

      // 화면 갱신
      this.draw();
    }
  }

  // Move Tetra left
  moveLeft() {
    if (this.currentTetra && this.canMove(this.currentTetra.x - 1, this.currentTetra.y, this.currentTetra.type, this.currentTetra.angle)) {
      this.currentTetra.x--;
      this.network.send({ type: 'player_move', direction: 'left' }); // 서버로 이동 메시지 전송
      this.draw();
    }
  }

  // Move Tetra right
  moveRight() {
    if (this.currentTetra && this.canMove(this.currentTetra.x + 1, this.currentTetra.y, this.currentTetra.type, this.currentTetra.angle)) {
      this.currentTetra.x++;
      this.network.send({ type: 'player_move', direction: 'right' }); // 서버로 이동 메시지 전송
      this.draw();
    }
  }

  // Rotate Tetra
  rotate() {
    if (this.currentTetra) {
      const oldAngle = this.currentTetra.angle;
      this.currentTetra.rotate();
      if (!this.canMove(this.currentTetra.x, this.currentTetra.y, this.currentTetra.type, this.currentTetra.angle)) {
        this.currentTetra.angle = oldAngle; // 회전이 불가능하면 되돌리기
      } else {
        this.network.send({ type: 'player_move', direction: 'rotate' }); // 서버로 회전 메시지 전송
        this.draw();
      }
    }
  }

  // Increase game speed
  increaseSpeed() {
    this.gameSpeed = Math.max(200, this.gameSpeed - 30);
    clearInterval(this.gameLoop);
    this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
  }

  // Game over logic
  gameOver() {
    if (this.isGameOver) {
      console.log("이미 게임 오버 상태");
      return;
    }
    console.log("게임 오버 처리 시작");
    this.isGameOver = true;
    document.getElementById("message").innerText = "GAME OVER";
    if (this.onGameOver) {
      this.onGameOver();
    }
    if (!this.gameOverSent) { // 게임 오버 메시지가 아직 전송되지 않은 경우
      this.network.send({ type: 'game_over' });
      this.gameOverSent = true; // 메시지 전송 플래그 설정
      console.log("게임 오버 메시지가 전송되었습니다.");
    }
    console.log("게임 오버 처리 완료");
  }




  // Clear full lines
  clearFullLines() {
    const fullLines = this.grid.checkLines();
    if (fullLines.length > 0) {
      // 클리어된 줄 수
      const clearedCount = fullLines.length;

      // 라인 삭제
      this.grid.clearLines(fullLines);
      this.deletedLines += clearedCount;
      document.getElementById("lines").innerText = this.deletedLines.toString();

      // 서버에 클리어된 라인 수 전송
      this.network.send({
        type: 'clear_lines',
        count: clearedCount
      });

      // 가비지 라인 추가는 서버에서 처리하도록 함
    }
  }

  addGarbageLines(count) {
    for (let i = 0; i < count; i++) {
      const garbageLine = new Array(this.stageWidth).fill(6); // 6은 garbage block의 type index
      const gapIndex = Math.floor(Math.random() * this.stageWidth);
      garbageLine[gapIndex] = null;
      this.grid.addGarbageLine(garbageLine);
    }
    this.draw();
  }

  removeGarbageLines(count) {
    this.grid.removeGarbageLines(count);
    this.draw();
  }

  hasGarbageLines() {
    for (let y = 0; y < this.stageHeight; y++) {
      let isGarbageLine = true;
      for (let x = 0; x < this.stageWidth; x++) {
        if (this.grid.cells[x][y] !== 7 && this.grid.cells[x][y] !== null) { // 7은 garbage block의 type index
          isGarbageLine = false;
          break;
        }
      }
      if (isGarbageLine) {
        return true;
      }
    }
    return false;
  }
  removeGarbageLines(count) {
    let removed = 0;
    for (let y = this.stageHeight - 1; y >= 0 && removed < count; y--) {
      let isGarbageLine = true;
      for (let x = 0; x < this.stageWidth; x++) {
        if (this.grid.cells[x][y] !== 7 && this.grid.cells[x][y] !== null) {
          isGarbageLine = false;
          break;
        }
      }
      if (isGarbageLine) {
        // 해당 라인 제거
        for (let x = 0; x < this.stageWidth; x++) {
          this.grid.cells[x][y] = null;
        }
        removed++;
      }
    }
    if (removed > 0) {
      // 위쪽 라인들을 아래로 밀어냄
      for (let y = this.stageHeight - 1; y >= removed; y--) {
        for (let x = 0; x < this.stageWidth; x++) {
          this.grid.cells[x][y] = this.grid.cells[x][y - removed];
        }
      }
      this.draw(); // 필드 갱신
    }
  }

  // Render the game
  draw() {
    console.log("Drawing game state");
    this.clearCanvas(this.context, this.stageCanvas);
    this.drawGridLines();
    this.drawGrid();
    if (this.currentTetra) {
      this.drawTetra(this.currentTetra, this.context, this.stageLeftPadding, this.stageTopPadding);
    }
  }


  // Draw next Tetra on nextCanvas
  drawNextTetra() {
    // 다음 블록 캔버스 초기화
    this.clearCanvas(this.nextContext, this.nextCanvas);

    // 다음 블록을 표시
    if (this.nextTetra) {
      this.drawTetra(this.nextTetra, this.nextContext, this.cellSize * 2, this.cellSize);
    }
  }

  // Draw grid lines
  drawGridLines() {
    const ctx = this.context;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= this.stageWidth; x++) {
      const xPos = this.stageLeftPadding + x * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(xPos, this.stageTopPadding);
      ctx.lineTo(xPos, this.stageTopPadding + this.cellSize * this.stageHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= this.stageHeight; y++) {
      const yPos = this.stageTopPadding + y * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(this.stageLeftPadding, yPos);
      ctx.lineTo(this.stageLeftPadding + this.cellSize * this.stageWidth, yPos);
      ctx.stroke();
    }
  }

  // Draw the grid of fixed blocks
  drawGrid() {
    for (let x = 0; x < this.stageWidth; x++) {
      for (let y = 0; y < this.stageHeight; y++) {
        const type = this.grid.cells[x][y];
        if (type !== null) {
          this.drawCell(this.context, x, y, type, this.stageLeftPadding, this.stageTopPadding, this.cellSize);
        }
      }
    }
  }
  // Draw a tetromino
  drawTetra(tetra, context, offsetX, offsetY) {
    const shape = blocks[tetra.type].shape[tetra.angle];

    for (let i = 0; i < shape.length; i++) {
      const cellX = tetra.x + shape[i][0];
      const cellY = tetra.y + shape[i][1];
      if (cellY >= 0) { // y가 음수일 경우 그리지 않도록 조건 추가
        this.drawCell(context, cellX, cellY, tetra.type, offsetX, offsetY, this.cellSize);
      }
    }
  }

  // Draw a single cell
  drawCell(context, x, y, type, offsetX, offsetY, size) {
    const block = blocks[type];
    const cellX = offsetX + x * size;
    const cellY = offsetY + y * size;

    context.fillStyle = block.color;
    context.fillRect(cellX + 0.5, cellY + 0.5, size - 1, size - 1);

    context.strokeStyle = block.highlight;
    context.beginPath();
    context.moveTo(cellX + 0.5, cellY + size - 0.5);
    context.lineTo(cellX + 0.5, cellY + 0.5);
    context.lineTo(cellX + size - 0.5, cellY + 0.5);
    context.stroke();

    context.strokeStyle = block.shadow;
    context.beginPath();
    context.moveTo(cellX + 0.5, cellY + size - 0.5);
    context.lineTo(cellX + size - 0.5, cellY + size - 0.5);
    context.lineTo(cellX + size - 0.5, cellY + 0.5);
    context.stroke();
  }

  // Clear canvas
  clearCanvas(context, canvas) {
    context.fillStyle = 'rgb(0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
}
