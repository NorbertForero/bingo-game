import { Router } from 'express';

const router = Router();

// Almacena los números que ya han sido llamados
let calledNumbers: number[] = [];
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener el estado del juego',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

function getBingoColumn(num: number): string {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return 'Desconocido';
}


export default router; 