# Sistema de Patrones de Bingo

## Descripción General

El juego de Bingo ahora soporta múltiples patrones de juego que se pueden configurar al inicio de cada partida. Esto permite tener varios ganadores en diferentes etapas del juego.

## Tipos de Patrones

### 1. Patrones Lineales

#### Línea Horizontal
- **Descripción**: Cualquier fila completa del cartón (5 números en línea horizontal)
- **Ejemplo**: B-5, I-20, N-35, G-50, O-65

#### Línea Vertical
- **Descripción**: Cualquier columna completa del cartón (5 números en línea vertical)
- **Ejemplo**: B-3, B-8, B-12, B-15, B-1

#### Diagonal
- **Descripción**: Cualquiera de las dos diagonales completas
- **Tipos**:
  - Diagonal principal (esquina superior izquierda a inferior derecha)
  - Diagonal secundaria (esquina superior derecha a inferior izquierda)

### 2. Patrones de Letras

#### Letra C
- **Descripción**: Primera y última columna completas + primera y última fila completas
- **Forma**: Dibuja la letra "C" en el cartón

#### Letra N
- **Descripción**: Primera y última columna completas + diagonal principal
- **Forma**: Dibuja la letra "N" en el cartón

#### Letra L
- **Descripción**: Primera columna completa + última fila completa
- **Forma**: Dibuja la letra "L" en el cartón

#### Letra M
- **Descripción**: Primera y última columna completas + casillas superiores centrales
- **Forma**: Dibuja la letra "M" en el cartón

#### Letra X
- **Descripción**: Ambas diagonales completas
- **Forma**: Dibuja la letra "X" en el cartón

### 3. Cartón Lleno (Pleno)

- **Descripción**: Todos los números del cartón deben estar marcados
- **Nota**: Este patrón típicamente se juega como último para determinar el ganador final

## Orden de Juego Recomendado

1. **Fase 1: Patrones Lineales** (1-3 ganadores)
   - Línea Horizontal
   - Línea Vertical
   - Diagonal

2. **Fase 2: Patrones de Letras** (1-2 ganadores)
   - Letra L, C, N, M o X según configuración

3. **Fase 3: Cartón Lleno** (1 ganador)
   - Pleno completo

## Cómo Configurar un Juego

1. El administrador hace clic en "Iniciar Juego"
2. Se abre un modal de configuración de patrones
3. Selecciona los patrones lineales que desea incluir
4. Selecciona los patrones de letras que desea incluir
5. Decide si incluir el cartón lleno como patrón final
6. Confirma la configuración

## Flujo del Juego

1. Se inicia el juego con los patrones configurados
2. El administrador genera balotas
3. Los jugadores marcan sus cartones
4. Cuando un jugador completa el patrón actual, reclama BINGO
5. El administrador valida el cartón
6. Si es válido, se avanza al siguiente patrón
7. El proceso se repite hasta completar todos los patrones

## Características

- **Múltiples ganadores**: Cada patrón puede tener un ganador diferente
- **Progresión clara**: Los jugadores ven qué patrón se está jugando
- **Validación automática**: El sistema verifica que el cartón cumpla con el patrón específico
- **Flexibilidad**: El administrador decide qué patrones incluir en cada juego

## Ejemplo de Configuración

**Juego con 4 ganadores:**
1. Línea Horizontal (Ganador #1)
2. Letra L (Ganador #2)
3. Letra X (Ganador #3)
4. Cartón Lleno (Ganador #4 - Gran Premio)

## Notas Técnicas

- Los patrones se validan en el backend para prevenir trampas
- El centro del cartón (FREE) siempre cuenta como marcado
- Solo se puede reclamar BINGO cuando se complete el patrón actual
- Los patrones completados se marcan visualmente en la interfaz del administrador
