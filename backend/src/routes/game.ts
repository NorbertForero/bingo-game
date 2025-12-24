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

// Endpoint para validar un cartón de bingo
router.post('/validate-bingo', (req, res) => {
  try {
    const { card, calledNumbers: calledNumbersFromClient, pattern } = req.body;
    
    if (!card || !card.numbers || !card.matches) {
      return res.status(400).json({ 
        error: 'Datos del cartón inválidos' 
      });
    }

    const numbers = card.numbers;
    const matches = card.matches;
    let isValid = true;

    // Si hay un patrón específico, primero verificar que cumpla con el patrón
    if (pattern) {
      isValid = checkPattern(matches, pattern.type);
      
      console.log('Pattern check result:', isValid);
      console.log('Pattern type:', pattern.type);
      
      // Si cumple con el patrón, verificar que esos números específicos hayan sido llamados
      if (isValid) {
        const requiredPositions = getPatternPositions(pattern.type, matches);
        console.log('Required positions:', requiredPositions);
        
        for (const [row, col] of requiredPositions) {
          // El centro (2,2) es gratis, siempre se considera válido
          if (row === 2 && col === 2) {
            continue;
          }
          const number = numbers[row][col];
          const isMarked = matches[row][col];
          const isCalled = calledNumbersFromClient.includes(number);
          
          console.log(`Position [${row}][${col}]: number=${number}, marked=${isMarked}, called=${isCalled}`);
          
          // Verificar que el número esté marcado Y que haya sido llamado
          if (!isMarked || !isCalled) {
            isValid = false;
            console.log(`Validation failed at position [${row}][${col}]`);
            break;
          }
        }
      }
    } else {
      // Retrocompatibilidad: verificar todos los números marcados y luego el patrón
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
        if (!isValid) break;
      }

      // Verificar cualquier patrón ganador
      if (isValid) {
        isValid = checkWinningPattern(matches);
      }
    }

    res.json({ 
      isValid,
      message: isValid ? '¡BINGO válido!' : 'El cartón no cumple con el patrón requerido'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al validar el bingo',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Función para verificar patrones específicos
function checkPattern(matches: boolean[][], patternType: string): boolean {
  switch (patternType) {
    case 'line':
      // Verificar si hay al menos una línea completa (horizontal, vertical o diagonal)
      // Verificar filas
      for (let i = 0; i < 5; i++) {
        if (matches[i].every(match => match)) return true;
      }
      // Verificar columnas
      for (let i = 0; i < 5; i++) {
        if (matches.every(row => row[i])) return true;
      }
      // Verificar diagonal principal o secundaria
      const mainDiag = matches.every((row, i) => row[i]);
      const secDiag = matches.every((row, i) => row[4 - i]);
      return mainDiag || secDiag;

    case 'horizontal':
      // Verificar si hay al menos una fila completa
      for (let i = 0; i < 5; i++) {
        if (matches[i].every(match => match)) return true;
      }
      return false;

    case 'vertical':
      // Verificar si hay al menos una columna completa
      for (let i = 0; i < 5; i++) {
        if (matches.every(row => row[i])) return true;
      }
      return false;

    case 'diagonal':
      // Verificar diagonal principal o secundaria
      const mainDiagonal = matches.every((row, i) => row[i]);
      const secondaryDiagonal = matches.every((row, i) => row[4 - i]);
      return mainDiagonal || secondaryDiagonal;

    case 'four-corners':
      // Verificar las 4 esquinas del cartón
      return matches[0][0] && matches[0][4] && matches[4][0] && matches[4][4];

    case 'letter-C':
      // Primera y última columna + primera y última fila
      const firstCol = matches.every(row => row[0]);
      const lastCol = matches.every(row => row[4]);
      const firstRow = matches[0].every(match => match);
      const lastRow = matches[4].every(match => match);
      return firstCol && lastCol && firstRow && lastRow;

    case 'letter-N':
      // Primera y última columna + diagonal principal
      const firstColN = matches.every(row => row[0]);
      const lastColN = matches.every(row => row[4]);
      const diagonalN = matches.every((row, i) => row[i]);
      return firstColN && lastColN && diagonalN;

    case 'letter-L':
      // Primera columna + última fila
      const firstColL = matches.every(row => row[0]);
      const lastRowL = matches[4].every(match => match);
      return firstColL && lastRowL;

    case 'letter-M':
      // Primera y última columna + dos diagonales superiores
      const firstColM = matches.every(row => row[0]);
      const lastColM = matches.every(row => row[4]);
      const topCenter = matches[0][2] && matches[1][1] && matches[1][3];
      return firstColM && lastColM && topCenter;

    case 'letter-X':
      // Ambas diagonales completas
      const mainDiagX = matches.every((row, i) => row[i]);
      const secondaryDiagX = matches.every((row, i) => row[4 - i]);
      return mainDiagX && secondaryDiagX;

    case 'full':
      // Todo el cartón marcado
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!matches[row][col]) return false;
        }
      }
      return true;

    default:
      // Si no se reconoce el patrón, usar validación genérica
      return checkWinningPattern(matches);
  }
}

// Función para verificar si hay un patrón ganador
function checkWinningPattern(matches: boolean[][]): boolean {
  // Verificar filas
  for (let i = 0; i < 5; i++) {
    if (matches[i].every(match => match)) return true;
  }

  // Verificar columnas
  for (let i = 0; i < 5; i++) {
    if (matches.every(row => row[i])) return true;
  }

  // Verificar diagonal principal (top-left a bottom-right)
  if (matches.every((row, i) => row[i])) return true;

  // Verificar diagonal secundaria (top-right a bottom-left)
  if (matches.every((row, i) => row[4 - i])) return true;

  return false;
}

// Función para obtener las posiciones requeridas por cada patrón
function getPatternPositions(patternType: string, matches: boolean[][]): [number, number][] {
  const positions: [number, number][] = [];

  switch (patternType) {
    case 'line':
      // Devolver las posiciones de cualquier línea completa (horizontal, vertical o diagonal)
      // Verificar filas
      for (let row = 0; row < 5; row++) {
        if (matches[row].every(match => match)) {
          for (let col = 0; col < 5; col++) {
            positions.push([row, col]);
          }
          return positions; // Retornar la primera línea encontrada
        }
      }
      // Verificar columnas
      for (let col = 0; col < 5; col++) {
        if (matches.every(row => row[col])) {
          for (let row = 0; row < 5; row++) {
            positions.push([row, col]);
          }
          return positions; // Retornar la primera columna encontrada
        }
      }
      // Verificar diagonal principal
      if (matches.every((row, i) => row[i])) {
        for (let i = 0; i < 5; i++) {
          positions.push([i, i]);
        }
        return positions;
      }
      // Verificar diagonal secundaria
      if (matches.every((row, i) => row[4 - i])) {
        for (let i = 0; i < 5; i++) {
          positions.push([i, 4 - i]);
        }
        return positions;
      }
      break;

    case 'horizontal':
      // Devolver solo las posiciones de la fila que está marcada completamente
      for (let row = 0; row < 5; row++) {
        if (matches[row].every(match => match)) {
          // Esta fila está completa, agregar todas sus posiciones
          for (let col = 0; col < 5; col++) {
            positions.push([row, col]);
          }
          break; // Solo necesitamos una fila completa
        }
      }
      break;

    case 'vertical':
      // Devolver solo las posiciones de la columna que está marcada completamente
      for (let col = 0; col < 5; col++) {
        if (matches.every(row => row[col])) {
          // Esta columna está completa, agregar todas sus posiciones
          for (let row = 0; row < 5; row++) {
            positions.push([row, col]);
          }
          break; // Solo necesitamos una columna completa
        }
      }
      break;

    case 'diagonal':
      // Diagonales
      for (let i = 0; i < 5; i++) {
        positions.push([i, i]); // Diagonal principal
        positions.push([i, 4 - i]); // Diagonal secundaria
      }
      break;

    case 'four-corners':
      // Solo las 4 esquinas
      positions.push([0, 0], [0, 4], [4, 0], [4, 4]);
      break;

    case 'letter-C':
      // Primera y última columna + primera y última fila
      for (let i = 0; i < 5; i++) {
        positions.push([i, 0]); // Primera columna
        positions.push([i, 4]); // Última columna
        positions.push([0, i]); // Primera fila
        positions.push([4, i]); // Última fila
      }
      break;

    case 'letter-N':
      // Primera y última columna + diagonal principal
      for (let i = 0; i < 5; i++) {
        positions.push([i, 0]); // Primera columna
        positions.push([i, 4]); // Última columna
        positions.push([i, i]); // Diagonal principal
      }
      break;

    case 'letter-L':
      // Primera columna + última fila
      for (let i = 0; i < 5; i++) {
        positions.push([i, 0]); // Primera columna
        positions.push([4, i]); // Última fila
      }
      break;

    case 'letter-M':
      // Primera y última columna + parte superior
      for (let i = 0; i < 5; i++) {
        positions.push([i, 0]); // Primera columna
        positions.push([i, 4]); // Última columna
      }
      positions.push([0, 2], [1, 1], [1, 3]); // Pico superior
      break;

    case 'letter-X':
      // Ambas diagonales
      for (let i = 0; i < 5; i++) {
        positions.push([i, i]); // Diagonal principal
        positions.push([i, 4 - i]); // Diagonal secundaria
      }
      break;

    case 'full':
      // Todo el cartón
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          positions.push([row, col]);
        }
      }
      break;

    default:
      // Para patrones desconocidos, verificar todas las posiciones
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          positions.push([row, col]);
        }
      }
  }

  return positions;
}

function getBingoColumn(num: number): string {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return 'Desconocido';
}


export default router; 