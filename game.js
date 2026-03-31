// Estado del juego
const gameState = {
    board: Array(16).fill(null), // 4x4 = 16 casillas
    availablePieces: [],
    usedPieces: [],
    currentPlayer: 1, // 1 o 2
    selectedPiece: null, // Ficha seleccionada para que el oponente la coloque
    phase: 'selectPiece', // 'selectPiece' o 'placePiece'
    gameOver: false
};

// Historial de movimientos para deshacer
const moveHistory = [];

// Configuración del juego
const gameConfig = {
    boardSize: 4,
    numberRange: 99,
    winLength: 4,
    mathMode: false,
    spyMode: false,
    timerEnabled: false,
    timerDuration: 30,
    writingMode: false,
    aiEnabled: false,
    aiDifficulty: 'off' // 'off', 'easy', 'medium', 'hard'
};

// Estadísticas de la partida
const gameStats = {
    turnStartTime: null,
    turnTimes: [],
    totalTurns: 0,
    player1Turns: 0,
    player2Turns: 0,
    startTime: null,
    numberSelectionTimes: [] // {number, time, player}
};

// Audio context para efectos de sonido
let audioContext = null;

// Inicializar audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Efecto de sonido al colocar ficha
function playPlaceSound() {
    initAudio();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sonido suave de "clic"
    oscillator.frequency.value = 300;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Números aleatorios para fichas y casillas
let pieceNumbers = [];
let cellNumbers = [];
let pieceMathExpressions = [];
let cellMathExpressions = [];
let timerInterval = null;
let timerRemaining = 0;
let spyTimeout = null;

// Características de las fichas (4 características binarias = 16 fichas únicas)
// tall/short, dark/light, square/round, solid/hollow
const pieceAttributes = [
    { tall: true, dark: true, square: true, solid: true },
    { tall: true, dark: true, square: true, solid: false },
    { tall: true, dark: true, square: false, solid: true },
    { tall: true, dark: true, square: false, solid: false },
    { tall: true, dark: false, square: true, solid: true },
    { tall: true, dark: false, square: true, solid: false },
    { tall: true, dark: false, square: false, solid: true },
    { tall: true, dark: false, square: false, solid: false },
    { tall: false, dark: true, square: true, solid: true },
    { tall: false, dark: true, square: true, solid: false },
    { tall: false, dark: true, square: false, solid: true },
    { tall: false, dark: true, square: false, solid: false },
    { tall: false, dark: false, square: true, solid: true },
    { tall: false, dark: false, square: true, solid: false },
    { tall: false, dark: false, square: false, solid: true },
    { tall: false, dark: false, square: false, solid: false }
];

// Inicializar el juego
function initGame() {
    const totalCells = gameConfig.boardSize * gameConfig.boardSize;
    gameState.board = Array(totalCells).fill(null);
    
    // Ajustar piezas según tamaño del tablero
    if (gameConfig.boardSize === 3) {
        // Para 3x3, usar solo 9 piezas (primeras 9 combinaciones)
        gameState.availablePieces = pieceAttributes.slice(0, 9);
    } else {
        gameState.availablePieces = [...pieceAttributes];
    }
    
    gameState.usedPieces = [];
    gameState.currentPlayer = 1;
    gameState.selectedPiece = null;
    gameState.phase = 'selectPiece';
    gameState.gameOver = false;
    
    // Limpiar historial
    moveHistory.length = 0;
    updateUndoButton();

    // Reset stats
    gameStats.turnStartTime = Date.now();
    gameStats.turnTimes = [];
    gameStats.totalTurns = 0;
    gameStats.player1Turns = 0;
    gameStats.player2Turns = 0;
    gameStats.startTime = Date.now();
    gameStats.numberSelectionTimes = [];

    // Generar números aleatorios
    generateRandomNumbers();

    // Renderizar
    renderAvailablePieces();
    renderBoard();
    updateGameInfo();
    hideCharacteristics();

    // Timer
    stopTimer();
    const timerBar = document.getElementById('timerBar');
    if (timerBar) {
        timerBar.classList.toggle('hidden', !gameConfig.timerEnabled);
    }
    startTimer();

    // Spy mode
    startSpyReveal();

    // Writing mode input
    updateWritingModeUI();

    // AI: if AI is player 1 first turn (shouldn't normally happen, AI is player 2)
    // AI plays as Player 2 by default
}

// Generar números aleatorios únicos
function generateRandomNumbers() {
    const numbers = [];
    const totalCells = gameConfig.boardSize * gameConfig.boardSize;
    const totalPieces = gameState.availablePieces.length;
    const totalNumbers = totalPieces + totalCells;
    
    while (numbers.length < totalNumbers) {
        const num = Math.floor(Math.random() * gameConfig.numberRange) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    pieceNumbers = numbers.slice(0, totalPieces);
    cellNumbers = numbers.slice(totalPieces, totalNumbers);
    generateMathExpressions();
}

// Convertir número a texto en español
function numberToSpanish(n) {
    if (n === 0) return 'cero';

    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
        'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
        'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
        'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];

    const decenas = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
        'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (n < 30) return unidades[n];

    if (n < 100) {
        const d = Math.floor(n / 10);
        const u = n % 10;
        return u === 0 ? decenas[d] : decenas[d] + ' y ' + unidades[u];
    }

    if (n === 100) return 'cien';

    if (n < 1000) {
        const c = Math.floor(n / 100);
        const r = n % 100;
        return centenas[c] + (r > 0 ? ' ' + numberToSpanish(r) : '');
    }

    if (n < 10000) {
        const m = Math.floor(n / 1000);
        const r = n % 1000;
        const prefix = m === 1 ? 'mil' : numberToSpanish(m) + ' mil';
        return prefix + (r > 0 ? ' ' + numberToSpanish(r) : '');
    }

    return String(n);
}

// Generar una expresión matemática que dé como resultado n
function generateMathExpression(n) {
    const type = Math.random();
    if (type < 0.5) {
        const a = Math.floor(Math.random() * n);
        return a + ' + ' + (n - a);
    } else {
        const b = Math.floor(Math.random() * 50) + 1;
        return (n + b) + ' − ' + b;
    }
}

// Generar expresiones para todos los números
function generateMathExpressions() {
    pieceMathExpressions = pieceNumbers.map(n => generateMathExpression(n));
    cellMathExpressions = cellNumbers.map(n => generateMathExpression(n));
}

// Text-to-Speech: pronunciar número en español
function speakNumber(n) {
    const text = numberToSpanish(n);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}

// --- Timer ---
function startTimer() {
    if (!gameConfig.timerEnabled || gameState.gameOver) return;
    stopTimer();
    timerRemaining = gameConfig.timerDuration;
    updateTimerDisplay();
    const bar = document.getElementById('timerBar');
    if (bar) bar.classList.remove('hidden');

    timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerDisplay();
        if (timerRemaining <= 0) {
            stopTimer();
            onTimerExpired();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const fill = document.getElementById('timerFill');
    const text = document.getElementById('timerText');
    if (!fill || !text) return;
    const pct = (timerRemaining / gameConfig.timerDuration) * 100;
    fill.style.width = pct + '%';
    fill.className = 'timer-fill' + (pct <= 20 ? ' danger' : pct <= 40 ? ' warning' : '');
    text.textContent = timerRemaining + 's';
}

function onTimerExpired() {
    initAudio();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.5);

    if (gameState.phase === 'selectPiece') {
        const available = gameState.availablePieces
            .map((p, i) => ({ piece: p, index: i }))
            .filter(x => !gameState.usedPieces.includes(x.piece));
        if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            handlePieceClick(pick.index);
        }
    } else if (gameState.phase === 'placePiece') {
        const emptyCells = gameState.board
            .map((c, i) => c === null ? i : -1)
            .filter(i => i >= 0);
        if (emptyCells.length > 0) {
            const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            handleCellClick(pick);
        }
    }
}

// --- Spy Mode ---
function startSpyReveal() {
    if (!gameConfig.spyMode) return;
    document.querySelectorAll('.piece-number, .cell-number').forEach(el => {
        el.classList.remove('spy-hidden');
        if (el.dataset.originalText) {
            el.textContent = el.dataset.originalText;
        }
    });
    if (spyTimeout) clearTimeout(spyTimeout);
    spyTimeout = setTimeout(() => {
        document.querySelectorAll('.piece-number, .cell-number').forEach(el => {
            if (!el.closest('.used') && !el.closest('.occupied')) {
                el.dataset.originalText = el.textContent;
                el.textContent = '?';
                el.classList.add('spy-hidden');
            }
        });
    }, 3000);
}

// --- Number Tooltip (Spanish text) ---
function showNumberTooltip(element, number) {
    if (gameConfig.spyMode && element.classList.contains('spy-hidden')) return;
    let tooltip = document.getElementById('numberTooltip');
    if (!tooltip) return;
    tooltip.textContent = numberToSpanish(number);
    tooltip.classList.add('visible');
    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
    tooltip.style.top = (rect.bottom + 8) + 'px';
}

function hideNumberTooltip() {
    const tooltip = document.getElementById('numberTooltip');
    if (tooltip) tooltip.classList.remove('visible');
}

// --- Writing Mode ---
function updateWritingModeUI() {
    const container = document.getElementById('writingModeContainer');
    if (!container) return;
    if (!gameConfig.writingMode || gameState.gameOver) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    const input = document.getElementById('writingInput');
    const label = document.getElementById('writingLabel');
    if (gameState.phase === 'selectPiece') {
        label.textContent = `Player ${gameState.currentPlayer}: Escribe el número de la pieza en español`;
    } else {
        label.textContent = `Player ${gameState.currentPlayer}: Escribe el número de la casilla en español`;
    }
    input.value = '';
    input.focus();
}

function normalizeSpanishText(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z\s]/g, '') // remove non-alpha
        .replace(/\s+/g, ' ')
        .trim();
}

function handleWritingSubmit() {
    const input = document.getElementById('writingInput');
    if (!input) return;
    const userText = normalizeSpanishText(input.value);
    if (!userText) return;

    const feedback = document.getElementById('writingFeedback');

    if (gameState.phase === 'selectPiece') {
        // Try to match against available piece numbers
        let matchedIndex = -1;
        for (let i = 0; i < pieceNumbers.length; i++) {
            if (gameState.usedPieces.includes(gameState.availablePieces[i])) continue;
            const expected = normalizeSpanishText(numberToSpanish(pieceNumbers[i]));
            if (userText === expected) {
                matchedIndex = i;
                break;
            }
        }
        if (matchedIndex >= 0) {
            feedback.textContent = '✓ ¡Correcto!';
            feedback.className = 'writing-feedback correct';
            setTimeout(() => { feedback.textContent = ''; feedback.className = 'writing-feedback'; }, 1500);
            handlePieceClick(matchedIndex);
        } else {
            feedback.textContent = '✗ Número no reconocido. Intenta de nuevo.';
            feedback.className = 'writing-feedback incorrect';
            input.value = '';
            input.focus();
        }
    } else if (gameState.phase === 'placePiece') {
        // Try to match against cell numbers
        let matchedIndex = -1;
        for (let i = 0; i < cellNumbers.length; i++) {
            if (gameState.board[i] !== null) continue;
            const expected = normalizeSpanishText(numberToSpanish(cellNumbers[i]));
            if (userText === expected) {
                matchedIndex = i;
                break;
            }
        }
        if (matchedIndex >= 0) {
            feedback.textContent = '✓ ¡Correcto!';
            feedback.className = 'writing-feedback correct';
            setTimeout(() => { feedback.textContent = ''; feedback.className = 'writing-feedback'; }, 1500);
            handleCellClick(matchedIndex);
        } else {
            feedback.textContent = '✗ Número no reconocido. Intenta de nuevo.';
            feedback.className = 'writing-feedback incorrect';
            input.value = '';
            input.focus();
        }
    }
}

// --- AI (Solitario) ---
function isAITurn() {
    return gameConfig.aiEnabled && gameState.currentPlayer === 2 && !gameState.gameOver;
}

function scheduleAIMove() {
    if (!isAITurn()) return;
    // Small delay so the human sees what happened
    setTimeout(() => {
        if (!isAITurn()) return;
        if (gameState.phase === 'selectPiece') {
            aiSelectPiece();
        } else if (gameState.phase === 'placePiece') {
            aiPlacePiece();
        }
    }, 800);
}

function aiSelectPiece() {
    const available = gameState.availablePieces
        .map((p, i) => ({ piece: p, index: i }))
        .filter(x => !gameState.usedPieces.includes(x.piece));
    if (available.length === 0) return;

    let pick;
    if (gameConfig.aiDifficulty === 'easy') {
        pick = available[Math.floor(Math.random() * available.length)];
    } else if (gameConfig.aiDifficulty === 'medium') {
        // Avoid giving pieces that could complete a line
        pick = aiSelectPieceMedium(available) || available[Math.floor(Math.random() * available.length)];
    } else {
        // Hard: try harder to avoid giving winning pieces
        pick = aiSelectPieceHard(available) || available[Math.floor(Math.random() * available.length)];
    }
    handlePieceClick(pick.index);
}

function aiPlacePiece() {
    const emptyCells = gameState.board
        .map((c, i) => c === null ? i : -1)
        .filter(i => i >= 0);
    if (emptyCells.length === 0) return;

    let cellIndex;
    if (gameConfig.aiDifficulty === 'easy') {
        cellIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else if (gameConfig.aiDifficulty === 'medium') {
        cellIndex = aiFindWinningCell(emptyCells) || aiFindStrategicCell(emptyCells) || emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
        cellIndex = aiFindWinningCell(emptyCells) || aiFindBlockingCell(emptyCells) || aiFindStrategicCell(emptyCells) || emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    handleCellClick(cellIndex);
}

// AI: find a cell that wins immediately
function aiFindWinningCell(emptyCells) {
    const piece = gameState.selectedPiece.piece;
    for (const idx of emptyCells) {
        gameState.board[idx] = piece;
        if (checkWin()) {
            gameState.board[idx] = null;
            return idx;
        }
        gameState.board[idx] = null;
    }
    return null;
}

// AI: find cell that prevents opponent from winning easily
function aiFindBlockingCell(emptyCells) {
    // Place in lines that have the most pieces of the same attribute
    const size = gameConfig.boardSize;
    const lines = getAllLines(size);
    let bestCell = null;
    let bestScore = -1;

    for (const idx of emptyCells) {
        let score = 0;
        for (const line of lines) {
            if (!line.includes(idx)) continue;
            const piecesInLine = line.filter(i => gameState.board[i] !== null).length;
            if (piecesInLine >= size - 2) {
                score += piecesInLine * 2;
            }
        }
        // Prefer center cells
        const row = Math.floor(idx / size);
        const col = idx % size;
        if (row > 0 && row < size - 1 && col > 0 && col < size - 1) score += 1;
        if (score > bestScore) {
            bestScore = score;
            bestCell = idx;
        }
    }
    return bestScore > 0 ? bestCell : null;
}

function aiFindStrategicCell(emptyCells) {
    // Prefer center, then corners
    const size = gameConfig.boardSize;
    const center = Math.floor(size / 2);
    const centerIdx = center * size + center;
    if (emptyCells.includes(centerIdx)) return centerIdx;

    const corners = [0, size - 1, (size - 1) * size, size * size - 1];
    const availCorners = corners.filter(c => emptyCells.includes(c));
    if (availCorners.length > 0) return availCorners[Math.floor(Math.random() * availCorners.length)];

    return null;
}

function getAllLines(size) {
    const lines = [];
    // Rows
    for (let r = 0; r < size; r++) {
        const line = [];
        for (let c = 0; c < size; c++) line.push(r * size + c);
        lines.push(line);
    }
    // Columns
    for (let c = 0; c < size; c++) {
        const line = [];
        for (let r = 0; r < size; r++) line.push(r * size + c);
        lines.push(line);
    }
    // Diagonals
    const d1 = [], d2 = [];
    for (let i = 0; i < size; i++) {
        d1.push(i * size + i);
        d2.push(i * size + (size - 1 - i));
    }
    lines.push(d1, d2);
    return lines;
}

// Medium: avoid giving pieces that have many attributes in common with existing lines
function aiSelectPieceMedium(available) {
    const size = gameConfig.boardSize;
    const lines = getAllLines(size);
    const safePieces = available.filter(({ piece }) => {
        return !wouldPieceBeRisky(piece, lines, size - 1);
    });
    if (safePieces.length > 0) return safePieces[Math.floor(Math.random() * safePieces.length)];
    return null;
}

// Hard: even more careful piece selection
function aiSelectPieceHard(available) {
    const size = gameConfig.boardSize;
    const lines = getAllLines(size);

    // First try: pieces safe even at size-2
    let safePieces = available.filter(({ piece }) => {
        return !wouldPieceBeRisky(piece, lines, size - 2);
    });
    if (safePieces.length > 0) return safePieces[Math.floor(Math.random() * safePieces.length)];

    // Fallback: pieces safe at size-1
    safePieces = available.filter(({ piece }) => {
        return !wouldPieceBeRisky(piece, lines, size - 1);
    });
    if (safePieces.length > 0) return safePieces[Math.floor(Math.random() * safePieces.length)];
    return null;
}

// Check if giving this piece could let opponent complete a line
function wouldPieceBeRisky(piece, lines, threshold) {
    const attributes = ['tall', 'dark', 'square', 'solid'];
    for (const line of lines) {
        const piecesInLine = line.filter(i => gameState.board[i] !== null);
        if (piecesInLine.length < threshold) continue;
        const emptyCellsInLine = line.filter(i => gameState.board[i] === null);
        if (emptyCellsInLine.length !== 1) continue; // only 1 slot left

        const linePieces = piecesInLine.map(i => gameState.board[i]);
        const allPieces = [...linePieces, piece];

        for (const attr of attributes) {
            const allTrue = allPieces.every(p => p[attr] === true);
            const allFalse = allPieces.every(p => p[attr] === false);
            if (allTrue || allFalse) return true;
        }
    }
    return false;
}

// --- Game Stats Tracking ---
function recordTurnTime() {
    if (!gameStats.turnStartTime) return;
    const elapsed = (Date.now() - gameStats.turnStartTime) / 1000;
    gameStats.turnTimes.push({
        player: gameState.currentPlayer,
        time: elapsed,
        phase: gameState.phase
    });
    gameStats.totalTurns++;
    if (gameState.currentPlayer === 1) gameStats.player1Turns++;
    else gameStats.player2Turns++;
    gameStats.turnStartTime = Date.now();
}

// Rotar números aleatorios
function rotateNumbers() {
    // Generar nuevos números para fichas disponibles
    gameState.availablePieces.forEach((_, index) => {
        if (!gameState.usedPieces.includes(gameState.availablePieces[index])) {
            pieceNumbers[index] = Math.floor(Math.random() * gameConfig.numberRange) + 1;
        }
    });
    
    // Generar nuevos números para casillas vacías
    gameState.board.forEach((cell, index) => {
        if (cell === null) {
            cellNumbers[index] = Math.floor(Math.random() * gameConfig.numberRange) + 1;
        }
    });
    
    if (gameConfig.mathMode) {
        generateMathExpressions();
    }
    updateNumbers();
}

// Crear confeti al ganar
function createConfetti(playerColor) {
    const colors = playerColor === 1 ? ['#3498db', '#5dade2', '#2980b9', '#85c1e2'] : ['#e74c3c', '#ec7063', '#c0392b', '#f1948a'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti ' + (Math.random() > 0.5 ? 'square' : 'round');
            
            // Color aleatorio del conjunto del jugador
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Posición horizontal aleatoria
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            
            // Tamaño aleatorio
            const size = Math.random() * 10 + 5;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Duración aleatoria de caída
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';
            
            document.body.appendChild(confetti);
            
            // Eliminar después de la animación
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }, i * 10);
    }
}

// Actualizar solo los números sin re-renderizar todo
function updateNumbers() {
    // Actualizar números de fichas
    document.querySelectorAll('.piece-wrapper').forEach((wrapper, index) => {
        const numberEl = wrapper.querySelector('.piece-number');
        if (numberEl && !wrapper.classList.contains('used')) {
            numberEl.textContent = gameConfig.mathMode ? pieceMathExpressions[index] : pieceNumbers[index];
            numberEl.dataset.number = pieceNumbers[index];
        }
    });
    
    // Actualizar números de casillas
    document.querySelectorAll('.cell').forEach((cell, index) => {
        const numberEl = cell.querySelector('.cell-number');
        if (numberEl && !cell.classList.contains('occupied')) {
            numberEl.textContent = gameConfig.mathMode ? cellMathExpressions[index] : cellNumbers[index];
            numberEl.dataset.number = cellNumbers[index];
        }
    });
}

// Renderizar fichas disponibles
function renderAvailablePieces() {
    const container = document.getElementById('availablePieces');
    container.innerHTML = '';
    
    gameState.availablePieces.forEach((piece, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'piece-wrapper';
        wrapper.dataset.index = index;
        
        if (gameState.usedPieces.includes(piece)) {
            wrapper.classList.add('used');
        }
        
        const pieceEl = createPieceElement(piece);
        wrapper.appendChild(pieceEl);
        
        // Agregar número
        const num = pieceNumbers[index] || Math.floor(Math.random() * gameConfig.numberRange) + 1;
        const numberEl = document.createElement('div');
        numberEl.className = 'piece-number';
        if (gameConfig.numberRange === 999) {
            numberEl.classList.add('range-999');
        } else if (gameConfig.numberRange === 9999) {
            numberEl.classList.add('range-9999');
        }
        numberEl.textContent = gameConfig.mathMode ? (pieceMathExpressions[index] || num) : num;
        numberEl.dataset.number = num;
        numberEl.addEventListener('mouseenter', () => showNumberTooltip(numberEl, num));
        numberEl.addEventListener('mouseleave', hideNumberTooltip);
        wrapper.appendChild(numberEl);

        // Botón TTS
        const ttsBtn = document.createElement('button');
        ttsBtn.className = 'tts-btn';
        ttsBtn.textContent = '🔊';
        ttsBtn.title = 'Escuchar en español';
        ttsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const numEl = wrapper.querySelector('.piece-number');
            if (numEl && numEl.classList.contains('spy-hidden')) return;
            speakNumber(num);
        });
        wrapper.appendChild(ttsBtn);
        
        // Event listeners para mostrar características
        if (!gameState.usedPieces.includes(piece)) {
            wrapper.addEventListener('mouseenter', () => showCharacteristics(piece));
            wrapper.addEventListener('mouseleave', () => {
                if (!wrapper.classList.contains('selected') && !wrapper.classList.contains('viewing')) {
                    hideCharacteristics();
                }
            });
        }
        
        // Event listener para clic - siempre añadirlo para manejar selección y deselección
        wrapper.addEventListener('click', (e) => {
            if (!gameState.usedPieces.includes(piece)) {
                // Si está en fase de selección de pieza, manejar selección/deselección
                if (gameState.phase === 'selectPiece') {
                    handlePieceClick(index);
                } else {
                    // Si no está en fase de selección, solo mostrar características
                    e.stopPropagation();
                    togglePieceViewing(wrapper, piece);
                }
            }
        });
        
        container.appendChild(wrapper);
    });
}

// Toggle para ver características en dispositivos táctiles
function togglePieceViewing(wrapper, piece) {
    // Limpiar otros elementos marcados como 'viewing'
    document.querySelectorAll('.piece-wrapper.viewing, .cell.viewing').forEach(el => {
        el.classList.remove('viewing');
    });
    
    // Toggle el estado de viewing
    const isViewing = wrapper.classList.contains('viewing');
    if (!isViewing) {
        wrapper.classList.add('viewing');
        showCharacteristics(piece);
    } else {
        wrapper.classList.remove('viewing');
        hideCharacteristics();
    }
}

// Mostrar características de una ficha
function showCharacteristics(piece) {
    const display = document.getElementById('characteristicsDisplay');
    const content = display.querySelector('.characteristics-content');
    
    const traits = [
        { name: 'Height', value: piece.tall ? 'Tall' : 'Short' },
        { name: 'Color', value: piece.dark ? 'Dark' : 'Light' },
        { name: 'Shape', value: piece.square ? 'Square' : 'Round' },
        { name: 'Fill', value: piece.solid ? 'Solid' : 'Hollow' }
    ];
    
    content.innerHTML = '';
    traits.forEach(trait => {
        const row = document.createElement('div');
        row.className = 'characteristic-row';
        row.innerHTML = `
            <span class="characteristic-label">${trait.name}:</span>
            <span class="characteristic-value">${trait.value}</span>
        `;
        content.appendChild(row);
    });
}

// Ocultar características
function hideCharacteristics() {
    const display = document.getElementById('characteristicsDisplay');
    const content = display.querySelector('.characteristics-content');
    content.innerHTML = '<p class="no-selection">Hover over or select a piece to see its characteristics</p>';
}

// Crear elemento visual de ficha
function createPieceElement(piece) {
    const pieceEl = document.createElement('div');
    pieceEl.className = 'piece';
    
    const shape = document.createElement('div');
    shape.className = 'piece-shape';
    
    // Aplicar clases según características
    shape.classList.add(piece.tall ? 'tall' : 'short');
    shape.classList.add(piece.dark ? 'dark' : 'light');
    shape.classList.add(piece.square ? 'square' : 'round');
    shape.classList.add(piece.solid ? 'solid' : 'hollow');
    
    pieceEl.appendChild(shape);
    return pieceEl;
}

// Renderizar tablero
function renderBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    board.className = 'board';
    
    // Añadir clase de tamaño
    if (gameConfig.boardSize === 3) {
        board.classList.add('size-3');
    }
    
    const totalCells = gameConfig.boardSize * gameConfig.boardSize;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        
        // Agregar número a la casilla si está vacía
        if (gameState.board[i] === null) {
            const cellNum = cellNumbers[i] || Math.floor(Math.random() * gameConfig.numberRange) + 1;
            const numberEl = document.createElement('div');
            numberEl.className = 'cell-number';
            if (gameConfig.numberRange === 999) {
                numberEl.classList.add('range-999');
            } else if (gameConfig.numberRange === 9999) {
                numberEl.classList.add('range-9999');
            }
            numberEl.textContent = gameConfig.mathMode ? (cellMathExpressions[i] || cellNum) : cellNum;
            numberEl.dataset.number = cellNum;
            numberEl.addEventListener('mouseenter', () => showNumberTooltip(numberEl, cellNum));
            numberEl.addEventListener('mouseleave', hideNumberTooltip);
            cell.appendChild(numberEl);

            // Botón TTS en casilla
            const ttsBtn = document.createElement('button');
            ttsBtn.className = 'tts-btn cell-tts';
            ttsBtn.textContent = '🔊';
            ttsBtn.title = 'Escuchar en español';
            ttsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const numEl = cell.querySelector('.cell-number');
                if (numEl && numEl.classList.contains('spy-hidden')) return;
                speakNumber(cellNum);
            });
            cell.appendChild(ttsBtn);
            
            cell.addEventListener('click', () => handleCellClick(i));
        } else {
            // Casilla ocupada
            cell.classList.add('occupied');
            const pieceEl = createPieceElement(gameState.board[i]);
            cell.appendChild(pieceEl);
            
            // Agregar event listeners para mostrar características de la ficha colocada
            const placedPiece = gameState.board[i];
            cell.addEventListener('mouseenter', () => {
                showCharacteristics(placedPiece);
                cell.style.cursor = 'pointer';
            });
            cell.addEventListener('mouseleave', () => {
                if (!cell.classList.contains('viewing')) {
                    hideCharacteristics();
                }
            });
            // Funcionalidad de clic para dispositivos táctiles
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCellViewing(cell, placedPiece);
            });
        }
        
        board.appendChild(cell);
    }
}

// Toggle para ver características de fichas en el tablero
function toggleCellViewing(cell, piece) {
    // Limpiar otros elementos marcados como 'viewing'
    document.querySelectorAll('.piece-wrapper.viewing, .cell.viewing').forEach(el => {
        el.classList.remove('viewing');
    });
    
    // Toggle el estado de viewing
    const isViewing = cell.classList.contains('viewing');
    if (!isViewing) {
        cell.classList.add('viewing');
        showCharacteristics(piece);
    } else {
        cell.classList.remove('viewing');
        hideCharacteristics();
    }
}

// Manejar clic en ficha
function handlePieceClick(index) {
    if (gameState.gameOver) return;
    if (gameState.phase !== 'selectPiece') return;
    
    const piece = gameState.availablePieces[index];
    if (gameState.usedPieces.includes(piece)) return;
    
    const wrapper = document.querySelector(`.piece-wrapper[data-index="${index}"]`);
    
    // Si ya está seleccionada, deseleccionar
    if (gameState.selectedPiece && gameState.selectedPiece.index === index) {
        wrapper.classList.remove('selected');
        gameState.selectedPiece = null;
        gameState.phase = 'selectPiece';
        hideCharacteristics();
        updateGameInfo();
        return;
    }
    
    // Record turn time
    recordTurnTime();

    // Track number selection
    gameStats.numberSelectionTimes.push({
        number: pieceNumbers[index],
        time: gameStats.turnTimes.length > 0 ? gameStats.turnTimes[gameStats.turnTimes.length - 1].time : 0,
        player: gameState.currentPlayer
    });
    
    // Deseleccionar anteriores
    document.querySelectorAll('.piece-wrapper.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Seleccionar ficha
    gameState.selectedPiece = { piece, index };
    wrapper.classList.add('selected');
    
    // Mostrar características de la ficha seleccionada
    showCharacteristics(piece);
    
    // Cambiar fase
    gameState.phase = 'placePiece';
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    updateGameInfo();
    highlightEmptyCells(true);
    startTimer();
    startSpyReveal();
    updateWritingModeUI();

    // AI turn to place piece
    scheduleAIMove();
}

// Manejar clic en casilla
function handleCellClick(index) {
    if (gameState.gameOver) return;
    if (gameState.phase !== 'placePiece') return;
    if (gameState.board[index] !== null) return;
    
    // Record turn time
    recordTurnTime();

    // Guardar estado antes del movimiento
    saveState();
    
    // Reproducir sonido
    playPlaceSound();
    
    // Colocar ficha
    gameState.board[index] = gameState.selectedPiece.piece;
    gameState.usedPieces.push(gameState.selectedPiece.piece);
    
    // Verificar victoria
    if (checkWin()) {
        endGame();
        return;
    }
    
    // Verificar empate
    if (gameState.usedPieces.length === gameState.availablePieces.length) {
        endGame(true);
        return;
    }
    
    // Preparar siguiente turno
    gameState.selectedPiece = null;
    gameState.phase = 'selectPiece';
    
    // Rotar números para el nuevo turno
    rotateNumbers();
    
    highlightEmptyCells(false);
    renderAvailablePieces();
    renderBoard();
    updateGameInfo();
    updateUndoButton();
    startTimer();
    startSpyReveal();
    updateWritingModeUI();

    // AI turn to select piece
    scheduleAIMove();
}

// Resaltar casillas vacías
function highlightEmptyCells(highlight) {
    document.querySelectorAll('.cell').forEach((cell, index) => {
        if (gameState.board[index] === null) {
            if (highlight) {
                cell.classList.add('highlight');
            } else {
                cell.classList.remove('highlight');
            }
        }
    });
}

// Actualizar información del juego
function updateGameInfo() {
    const playerEl = document.getElementById('currentPlayer');
    const phaseEl = document.getElementById('gamePhase');
    
    playerEl.textContent = `Player ${gameState.currentPlayer}`;
    playerEl.className = `player-indicator player${gameState.currentPlayer}`;
    
    if (gameState.phase === 'selectPiece') {
        phaseEl.textContent = `Player ${gameState.currentPlayer}: Select a piece for your opponent`;
    } else {
        const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        phaseEl.textContent = `Player ${gameState.currentPlayer}: Place the selected piece`;
    }
}

// Guardar estado actual antes de un movimiento
function saveState() {
    const state = {
        board: [...gameState.board],
        usedPieces: [...gameState.usedPieces],
        currentPlayer: gameState.currentPlayer,
        selectedPiece: gameState.selectedPiece ? { ...gameState.selectedPiece } : null,
        phase: gameState.phase,
        gameOver: gameState.gameOver,
        pieceNumbers: [...pieceNumbers],
        cellNumbers: [...cellNumbers],
        pieceMathExpressions: [...pieceMathExpressions],
        cellMathExpressions: [...cellMathExpressions]
    };
    moveHistory.push(state);
    updateUndoButton();
}

// Deshacer último movimiento
function undoLastMove() {
    if (moveHistory.length === 0) return;
    
    const previousState = moveHistory.pop();
    
    // Restaurar estado
    gameState.board = [...previousState.board];
    gameState.usedPieces = [...previousState.usedPieces];
    gameState.currentPlayer = previousState.currentPlayer;
    gameState.selectedPiece = previousState.selectedPiece ? { ...previousState.selectedPiece } : null;
    gameState.phase = previousState.phase;
    gameState.gameOver = previousState.gameOver;
    pieceNumbers = [...previousState.pieceNumbers];
    cellNumbers = [...previousState.cellNumbers];
    pieceMathExpressions = [...(previousState.pieceMathExpressions || [])];
    cellMathExpressions = [...(previousState.cellMathExpressions || [])];
    
    // Cerrar modal si estaba abierto
    const modal = document.getElementById('winModal');
    modal.classList.add('hidden');
    
    // Re-renderizar
    highlightEmptyCells(false);
    renderAvailablePieces();
    renderBoard();
    updateGameInfo();
    updateUndoButton();
    
    // Si había una ficha seleccionada, resaltar casillas
    if (gameState.phase === 'placePiece') {
        highlightEmptyCells(true);
    }
    startTimer();
    startSpyReveal();
}

// Actualizar estado del botón de deshacer
function updateUndoButton() {
    const undoBtn = document.getElementById('undoButton');
    undoBtn.disabled = moveHistory.length === 0;
}

// Verificar victoria
function checkWin() {
    const size = gameConfig.boardSize;
    const winLength = gameConfig.boardSize; // 3 para 3x3, 4 para 4x4
    
    // Verificar filas
    for (let row = 0; row < size; row++) {
        const indices = [];
        for (let col = 0; col < size; col++) {
            indices.push(row * size + col);
        }
        if (checkLine(indices)) return true;
    }
    
    // Verificar columnas
    for (let col = 0; col < size; col++) {
        const indices = [];
        for (let row = 0; row < size; row++) {
            indices.push(row * size + col);
        }
        if (checkLine(indices)) return true;
    }
    
    // Verificar diagonal principal
    const diagonal1 = [];
    for (let i = 0; i < size; i++) {
        diagonal1.push(i * size + i);
    }
    if (checkLine(diagonal1)) return true;
    
    // Verificar diagonal secundaria
    const diagonal2 = [];
    for (let i = 0; i < size; i++) {
        diagonal2.push(i * size + (size - 1 - i));
    }
    if (checkLine(diagonal2)) return true;
    
    return false;
}

// Verificar si una línea tiene las 4 fichas con una característica común
function checkLine(indices) {
    const pieces = indices.map(i => gameState.board[i]);
    
    // Si alguna casilla está vacía, no hay victoria
    if (pieces.some(p => p === null)) return false;
    
    // Verificar cada característica
    const attributes = ['tall', 'dark', 'square', 'solid'];
    
    for (const attr of attributes) {
        // Todas true o todas false
        const allTrue = pieces.every(p => p[attr] === true);
        const allFalse = pieces.every(p => p[attr] === false);
        
        if (allTrue || allFalse) return true;
    }
    
    return false;
}

// Finalizar juego
function endGame(draw = false) {
    gameState.gameOver = true;
    stopTimer();
    
    const modal = document.getElementById('winModal');
    const message = document.getElementById('winMessage');
    
    if (draw) {
        message.textContent = 'Draw! No more pieces available.';
    } else {
        message.textContent = `Player ${gameState.currentPlayer} wins!`;
        // Lanzar confeti del color del jugador
        createConfetti(gameState.currentPlayer);
    }

    // Hide writing mode
    const wc = document.getElementById('writingModeContainer');
    if (wc) wc.classList.add('hidden');

    // Build post-game summary
    buildGameSummary(draw);
    
    modal.classList.remove('hidden');

    // Save to persistent stats
    saveMatchToHistory(draw);
}

// Reiniciar juego
function resetGame() {
    const modal = document.getElementById('winModal');
    modal.classList.add('hidden');
    initGame();
}

// --- Post-game Summary ---
function buildGameSummary(draw) {
    const container = document.getElementById('gameSummary');
    if (!container) return;

    const totalTime = ((Date.now() - gameStats.startTime) / 1000).toFixed(0);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const humanTurns = gameStats.turnTimes.filter(t => !gameConfig.aiEnabled || t.player === 1);
    const avgTime = humanTurns.length > 0
        ? (humanTurns.reduce((s, t) => s + t.time, 0) / humanTurns.length).toFixed(1)
        : '0';

    // Slowest numbers (top 3)
    const sorted = [...gameStats.numberSelectionTimes]
        .filter(t => !gameConfig.aiEnabled || t.player === 1)
        .sort((a, b) => b.time - a.time);
    const slowest = sorted.slice(0, 3);

    let html = '<div class="summary-grid">';
    html += `<div class="summary-stat"><span class="summary-icon">⏱</span><span class="summary-label">Total time</span><span class="summary-value">${timeStr}</span></div>`;
    html += `<div class="summary-stat"><span class="summary-icon">🔄</span><span class="summary-label">Total turns</span><span class="summary-value">${Math.ceil(gameStats.totalTurns / 2)}</span></div>`;
    html += `<div class="summary-stat"><span class="summary-icon">⚡</span><span class="summary-label">Avg. time/turn</span><span class="summary-value">${avgTime}s</span></div>`;

    if (gameConfig.aiEnabled) {
        html += `<div class="summary-stat"><span class="summary-icon">🤖</span><span class="summary-label">AI difficulty</span><span class="summary-value">${gameConfig.aiDifficulty}</span></div>`;
    }
    html += '</div>';

    if (slowest.length > 0) {
        html += '<div class="summary-slow"><h4>🐢 Slowest numbers</h4><div class="slow-list">';
        slowest.forEach(s => {
            html += `<div class="slow-item"><span class="slow-number">${s.number}</span><span class="slow-spanish">${numberToSpanish(s.number)}</span><span class="slow-time">${s.time.toFixed(1)}s</span></div>`;
        });
        html += '</div></div>';
    }

    // Streak / history
    const history = JSON.parse(localStorage.getItem('quartoHistory') || '[]');
    if (history.length > 0) {
        const wins = history.filter(h => h.winner === 1).length;
        const losses = history.filter(h => h.winner === 2).length;
        const draws = history.filter(h => h.winner === 0).length;
        // Current streak
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].winner === 1) streak++;
            else break;
        }
        html += '<div class="summary-history"><h4>📊 Match history</h4>';
        html += `<div class="history-stats"><span>Wins: <strong>${wins}</strong></span><span>Losses: <strong>${losses}</strong></span><span>Draws: <strong>${draws}</strong></span>`;
        if (streak > 1) html += `<span>🔥 Streak: <strong>${streak}</strong></span>`;
        html += '</div></div>';
    }

    container.innerHTML = html;
}

function saveMatchToHistory(draw) {
    const history = JSON.parse(localStorage.getItem('quartoHistory') || '[]');
    history.push({
        date: new Date().toISOString(),
        winner: draw ? 0 : gameState.currentPlayer,
        turns: Math.ceil(gameStats.totalTurns / 2),
        totalTime: ((Date.now() - gameStats.startTime) / 1000).toFixed(0),
        ai: gameConfig.aiEnabled ? gameConfig.aiDifficulty : null
    });
    // Keep last 50 games
    while (history.length > 50) history.shift();
    localStorage.setItem('quartoHistory', JSON.stringify(history));
}

// Event listeners
document.getElementById('resetButton').addEventListener('click', () => {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.remove('hidden');
});

document.getElementById('newGameButton').addEventListener('click', resetGame);

// Undo button
document.getElementById('undoButton').addEventListener('click', undoLastMove);

// Settings modal
document.getElementById('startGameButton').addEventListener('click', () => {
    const boardSize = parseInt(document.getElementById('boardSize').value);
    const numberRange = parseInt(document.getElementById('numberRange').value);
    const timerDuration = parseInt(document.getElementById('timerDuration').value);
    const aiDifficulty = document.getElementById('aiDifficulty').value;
    
    gameConfig.boardSize = boardSize;
    gameConfig.numberRange = numberRange;
    gameConfig.winLength = boardSize;
    gameConfig.mathMode = document.getElementById('mathMode').checked;
    gameConfig.spyMode = document.getElementById('spyMode').checked;
    gameConfig.writingMode = document.getElementById('writingMode').checked;
    gameConfig.timerEnabled = timerDuration > 0;
    gameConfig.timerDuration = timerDuration || 30;
    gameConfig.aiEnabled = aiDifficulty !== 'off';
    gameConfig.aiDifficulty = aiDifficulty;
    
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.add('hidden');
    
    resetGame();
});

document.getElementById('cancelSettingsButton').addEventListener('click', () => {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.add('hidden');
});

// Undo button
document.getElementById('undoButton').addEventListener('click', undoLastMove);

// Tooltip functionality
const helpBtn = document.getElementById('helpBtn');
const tooltip = document.getElementById('tooltip');
let tooltipVisible = false;

helpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tooltipVisible = !tooltipVisible;
    tooltip.classList.toggle('show', tooltipVisible);
});

// Cerrar tooltip al hacer clic fuera
document.addEventListener('click', (e) => {
    if (tooltipVisible && !tooltip.contains(e.target) && e.target !== helpBtn) {
        tooltipVisible = false;
        tooltip.classList.remove('show');
    }
});

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Cargar preferencia guardada
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Cerrar características al hacer clic fuera (para dispositivos táctiles)
document.addEventListener('click', (e) => {
    const isClickOnPiece = e.target.closest('.piece-wrapper') || e.target.closest('.cell.occupied');
    const isClickOnCharacteristics = e.target.closest('.characteristics-display');
    
    if (!isClickOnPiece && !isClickOnCharacteristics) {
        document.querySelectorAll('.piece-wrapper.viewing, .cell.viewing').forEach(el => {
            el.classList.remove('viewing');
        });
        hideCharacteristics();
    }
});

// Iniciar juego al cargar
window.addEventListener('DOMContentLoaded', () => {
    initGame();

    // Writing mode event listeners
    const writingSubmit = document.getElementById('writingSubmit');
    const writingInput = document.getElementById('writingInput');
    if (writingSubmit) {
        writingSubmit.addEventListener('click', handleWritingSubmit);
    }
    if (writingInput) {
        writingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleWritingSubmit();
            }
        });
    }
});
