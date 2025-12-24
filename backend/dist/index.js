"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const cards_1 = __importDefault(require("./routes/cards"));
const game_1 = __importDefault(require("./routes/game"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:9002',
            'http://127.0.0.1:9002',
            'http://192.168.20.22:9001',
            'http://192.168.20.22:9002',
            'http://192.168.20.27:9001',
            'http://192.168.20.27:9002',
        ],
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:9002',
        'http://127.0.0.1:9002',
        'http://192.168.20.22:9001',
        'http://192.168.20.22:9002',
        'http://192.168.20.27:9001',
        'http://192.168.20.27:9002',
    ],
    methods: ['GET', 'POST'],
}));
app.use(express_1.default.json());
// Rutas
app.use('/api/cards', cards_1.default);
app.use('/api/game', game_1.default);
const gameState = {
    players: new Map(),
    currentNumber: null,
    calledNumbers: [],
    isGameActive: false
};
// Relación entre sockets conectados y jugadores que se han registrado vía websockets
const connectedPlayers = new Map();
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
// Endpoints REST
app.post('/api/players', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const player = {
            id: Date.now().toString(),
            name,
            card: generateBingoCard(),
            matches: Array(5).fill(null).map(() => Array(5).fill(false))
        };
        gameState.players.set(player.id, player);
        res.status(201).json(player);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear el jugador' });
    }
});
app.get('/api/players', (req, res) => {
    try {
        const players = Array.from(gameState.players.values());
        res.json(players);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener los jugadores' });
    }
});
app.get('/api/game/status', (req, res) => {
    try {
        res.json({
            isGameActive: gameState.isGameActive,
            currentNumber: gameState.currentNumber,
            calledNumbers: gameState.calledNumbers,
            totalPlayers: gameState.players.size
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener el estado del juego' });
    }
});
app.post('/api/game/start', (req, res) => {
    try {
        if (gameState.players.size < 1) {
            return res.status(400).json({ error: 'Se necesitan jugadores para iniciar el juego' });
        }
        gameState.isGameActive = true;
        gameState.calledNumbers = [];
        io.emit('gameStarted');
        callNumber();
        res.json({
            message: 'Juego iniciado',
            gameState: {
                isActive: gameState.isGameActive,
                currentNumber: gameState.currentNumber,
                totalPlayers: gameState.players.size
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al iniciar el juego' });
    }
});
app.post('/api/game/check-number', (req, res) => {
    try {
        const { playerId, row, col } = req.body;
        const player = gameState.players.get(playerId);
        if (!player) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }
        if (!gameState.isGameActive) {
            return res.status(400).json({ error: 'El juego no está activo' });
        }
        const number = player.card[row][col];
        const isMatch = gameState.calledNumbers.includes(number) || (row === 2 && col === 2);
        if (isMatch) {
            player.matches[row][col] = true;
        }
        res.json({ isMatch, number });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al verificar el número' });
    }
});
app.post('/api/game/check-bingo', (req, res) => {
    try {
        const { playerId } = req.body;
        const player = gameState.players.get(playerId);
        if (!player) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }
        const hasBingo = verifyBingo(player);
        if (hasBingo) {
            gameState.isGameActive = false;
            io.emit('gameWon', player.name);
        }
        res.json({ hasBingo });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al verificar el bingo' });
    }
});
// Eventos de Socket.IO
io.on('connection', (socket) => {
    console.log(`Cliente conectado (Socket ID: ${socket.id})`);
    socket.on('disconnect', () => {
        // Si este socket estaba asociado a un jugador, avisar al panel admin
        const player = connectedPlayers.get(socket.id);
        if (player) {
            console.log(`Jugador desconectado: ${player.name} (ID: ${player.id})`);
            io.emit('playerLeft', player.id);
            connectedPlayers.delete(socket.id);
        }
        else {
            console.log(`Cliente desconectado (Socket ID: ${socket.id})`);
        }
    });
    // Jugador que se conecta desde GamePage.tsx
    socket.on('playerJoined', (player) => {
        console.log(`Jugador conectado: ${player.name}`);
        connectedPlayers.set(socket.id, player);
        io.emit('playerJoined', player);
    });
    // Eventos que vienen desde el panel de admin y deben propagarse a todos los clientes
    socket.on('gameStarted', () => {
        io.emit('gameStarted');
    });
    socket.on('numberCalled', (number) => {
        io.emit('numberCalled', number);
    });
    socket.on('gameReset', () => {
        io.emit('gameReset');
    });
    socket.on('gameEnded', () => {
        io.emit('gameEnded');
    });
    socket.on('bingoValidationResult', (payload) => {
        var _a;
        // Buscar el socket del jugador específico
        const playerSocketId = (_a = Array.from(connectedPlayers.entries())
            .find(([_, player]) => player.id === payload.playerId)) === null || _a === void 0 ? void 0 : _a[0];
        if (playerSocketId) {
            // Enviar solo al jugador específico
            io.to(playerSocketId).emit('bingoValidationResult', payload);
        }
    });
    socket.on('bingoClaimed', (data) => {
        console.log(`¡BINGO reclamado por ${data.playerName}!`);
        console.log(`- Player ID: ${data.playerId}`);
        console.log(`- Card ID: ${data.cardId}`);
        // Propagar el evento a TODOS los clientes (especialmente al admin)
        io.emit('bingoClaimed', data);
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
const PORT = process.env.PORT || 9001;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
