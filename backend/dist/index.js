"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:9002",
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const gameState = {
    players: new Map(),
    currentNumber: null,
    calledNumbers: [],
    isGameActive: false
};
// Función para generar un cartón de bingo
function generateBingoCard() {
    const card = Array(5).fill(null).map(() => Array(5).fill(0));
    for (let col = 0; col < 5; col++) {
        const min = col * 15 + 1;
        const max = min + 14;
        const numbers = new Set();
        while (numbers.size < 5) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            numbers.add(num);
        }
        let row = 0;
        for (const num of numbers) {
            card[row][col] = num;
            row++;
        }
    }
    // El espacio central es libre
    card[2][2] = 0;
    return card;
}
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    socket.on('joinGame', (playerName) => {
        const player = {
            id: socket.id,
            name: playerName,
            card: generateBingoCard(),
            matches: Array(5).fill(null).map(() => Array(5).fill(false))
        };
        gameState.players.set(socket.id, player);
        socket.emit('gameJoined', player);
        io.emit('playerList', Array.from(gameState.players.values()));
    });
    // Nueva funcionalidad: verificar número marcado
    socket.on('checkNumber', ({ row, col }) => {
        const player = gameState.players.get(socket.id);
        if (player && gameState.isGameActive) {
            const number = player.card[row][col];
            // El espacio central (FREE) siempre está marcado
            if (row === 2 && col === 2) {
                player.matches[row][col] = true;
                socket.emit('numberChecked', { row, col, isMatch: true });
                return;
            }
            // Verificar si el número ha sido llamado
            if (gameState.calledNumbers.includes(number)) {
                player.matches[row][col] = true;
                socket.emit('numberChecked', { row, col, isMatch: true });
            }
            else {
                socket.emit('numberChecked', { row, col, isMatch: false });
            }
        }
    });
    socket.on('startGame', () => {
        if (gameState.players.size >= 1) {
            gameState.isGameActive = true;
            gameState.calledNumbers = [];
            io.emit('gameStarted');
            callNumber();
        }
    });
    socket.on('checkBingo', () => {
        const player = gameState.players.get(socket.id);
        if (player && verifyBingo(player)) {
            io.emit('gameWon', player.name);
            gameState.isGameActive = false;
        }
    });
    socket.on('disconnect', () => {
        gameState.players.delete(socket.id);
        io.emit('playerList', Array.from(gameState.players.values()));
    });
});
function callNumber() {
    if (!gameState.isGameActive)
        return;
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
        .filter(n => !gameState.calledNumbers.includes(n));
    if (availableNumbers.length === 0) {
        gameState.isGameActive = false;
        io.emit('gameOver');
        return;
    }
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers[randomIndex];
    gameState.currentNumber = number;
    gameState.calledNumbers.push(number);
    io.emit('numberCalled', number);
    setTimeout(callNumber, 3000);
}
function verifyBingo(player) {
    // Verificar filas
    for (let i = 0; i < 5; i++) {
        if (player.matches[i].every(match => match))
            return true;
    }
    // Verificar columnas
    for (let i = 0; i < 5; i++) {
        if (player.matches.every(row => row[i]))
            return true;
    }
    // Verificar diagonales
    if (player.matches.every((row, i) => row[i]))
        return true;
    if (player.matches.every((row, i) => row[4 - i]))
        return true;
    return false;
}
// Nuevo endpoint HTTP para iniciar el juego
app.get('/StartGame', (req, res) => {
    try {
        gameState.isGameActive = true;
        gameState.calledNumbers = [];
        io.emit('gameStarted');
        callNumber();
        res.status(200).json({
            status: "success",
            message: "Juego iniciado correctamente",
            gameState: {
                isActive: gameState.isGameActive,
                currentNumber: gameState.currentNumber,
                totalPlayers: gameState.players.size,
                calledNumbers: gameState.calledNumbers
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error al iniciar el juego",
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Error desconocido'
        });
    }
});
const PORT = process.env.PORT || 9001;
httpServer.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
