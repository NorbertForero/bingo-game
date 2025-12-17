"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Almacena los números que ya han sido llamados
let calledNumbers = [];
let isGameActive = false;
// Endpoint para generar un nuevo número
router.post('/generate-number', (req, res) => {
    try {
        // Si ya se llamaron todos los números (del 1 al 75)
        if (calledNumbers.length >= 75) {
            return res.json({
                message: 'Ya se han llamado todos los números',
                gameComplete: true
            });
        }
        // Crear array con números disponibles (no llamados)
        const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
            .filter(num => !calledNumbers.includes(num));
        // Generar número aleatorio de los disponibles
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const number = availableNumbers[randomIndex];
        // Obtener la columna del número
        const column = getBingoColumn(number);
        // Agregar el número a la lista de llamados
        calledNumbers.push(number);
        // Responder con el número generado
        res.json({
            column, // B | I | N | G | O
            number,
            remainingNumbers: 75 - calledNumbers.length,
            calledNumbers
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error al generar número',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
// Endpoint para reiniciar el juego
router.post('/reset', (req, res) => {
    try {
        calledNumbers = [];
        isGameActive = false;
        res.json({ message: 'Juego reiniciado exitosamente' });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error al reiniciar el juego',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
// Endpoint para obtener el estado actual del juego
router.get('/status', (req, res) => {
    try {
        res.json({
            calledNumbers,
            remainingNumbers: 75 - calledNumbers.length,
            isGameActive
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error al obtener el estado del juego',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
// Endpoint para validar un cartón de bingo
router.post('/validate-bingo', (req, res) => {
    try {
        const { card, calledNumbers: calledNumbersFromClient } = req.body;
        if (!card || !card.numbers || !card.matches) {
            return res.status(400).json({
                error: 'Datos del cartón inválidos'
            });
        }
        // Verificar que los números marcados como "match" estén en calledNumbers
        let isValid = true;
        const numbers = card.numbers;
        const matches = card.matches;
        // Verificar todas las celdas marcadas
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (matches[row][col]) {
                    const number = numbers[row][col];
                    // El centro (2,2) es gratis
                    if (row === 2 && col === 2) {
                        continue;
                    }
                    // Verificar que el número esté en calledNumbers
                    if (!calledNumbersFromClient.includes(number)) {
                        isValid = false;
                        break;
                    }
                }
            }
            if (!isValid)
                break;
        }
        // Verificar si tiene un patrón ganador (línea, columna o diagonal)
        if (isValid) {
            isValid = checkWinningPattern(matches);
        }
        res.json({
            isValid,
            message: isValid ? '¡BINGO válido!' : 'El cartón no tiene un patrón ganador'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error al validar el bingo',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
// Función para verificar si hay un patrón ganador
function checkWinningPattern(matches) {
    // Verificar filas
    for (let i = 0; i < 5; i++) {
        if (matches[i].every(match => match))
            return true;
    }
    // Verificar columnas
    for (let i = 0; i < 5; i++) {
        if (matches.every(row => row[i]))
            return true;
    }
    // Verificar diagonal principal (top-left a bottom-right)
    if (matches.every((row, i) => row[i]))
        return true;
    // Verificar diagonal secundaria (top-right a bottom-left)
    if (matches.every((row, i) => row[4 - i]))
        return true;
    return false;
}
function getBingoColumn(num) {
    if (num >= 1 && num <= 15)
        return 'B';
    if (num >= 16 && num <= 30)
        return 'I';
    if (num >= 31 && num <= 45)
        return 'N';
    if (num >= 46 && num <= 60)
        return 'G';
    if (num >= 61 && num <= 75)
        return 'O';
    return 'Desconocido';
}
exports.default = router;
