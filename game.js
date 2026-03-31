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
    boardSize: 4, // 3 o 4
    numberRange: 99, // 99, 999, o 9999
    winLength: 4 // 3 o 4
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

    // Generar números aleatorios
    generateRandomNumbers();

    // Renderizar
    renderAvailablePieces();
    renderBoard();
    updateGameInfo();
    hideCharacteristics();
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
            numberEl.textContent = pieceNumbers[index];
        }
    });
    
    // Actualizar números de casillas
    document.querySelectorAll('.cell').forEach((cell, index) => {
        const numberEl = cell.querySelector('.cell-number');
        if (numberEl && !cell.classList.contains('occupied')) {
            numberEl.textContent = cellNumbers[index];
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
        const numberEl = document.createElement('div');
        numberEl.className = 'piece-number';
        if (gameConfig.numberRange === 999) {
            numberEl.classList.add('range-999');
        } else if (gameConfig.numberRange === 9999) {
            numberEl.classList.add('range-9999');
        }
        numberEl.textContent = pieceNumbers[index] || Math.floor(Math.random() * gameConfig.numberRange) + 1;
        wrapper.appendChild(numberEl);
        
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
            const numberEl = document.createElement('div');
            numberEl.className = 'cell-number';
            if (gameConfig.numberRange === 999) {
                numberEl.classList.add('range-999');
            } else if (gameConfig.numberRange === 9999) {
                numberEl.classList.add('range-9999');
            }
            numberEl.textContent = cellNumbers[i] || Math.floor(Math.random() * gameConfig.numberRange) + 1;
            cell.appendChild(numberEl);
            
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
}

// Manejar clic en casilla
function handleCellClick(index) {
    if (gameState.gameOver) return;
    if (gameState.phase !== 'placePiece') return;
    if (gameState.board[index] !== null) return;
    
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
        cellNumbers: [...cellNumbers]
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
    
    const modal = document.getElementById('winModal');
    const message = document.getElementById('winMessage');
    
    if (draw) {
        message.textContent = 'Draw! No more pieces available.';
    } else {
        message.textContent = `Player ${gameState.currentPlayer} wins!`;
        // Lanzar confeti del color del jugador
        createConfetti(gameState.currentPlayer);
    }
    
    modal.classList.remove('hidden');
}

// Reiniciar juego
function resetGame() {
    const modal = document.getElementById('winModal');
    modal.classList.add('hidden');
    initGame();
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
    
    gameConfig.boardSize = boardSize;
    gameConfig.numberRange = numberRange;
    gameConfig.winLength = boardSize;
    
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
window.addEventListener('DOMContentLoaded', initGame);
