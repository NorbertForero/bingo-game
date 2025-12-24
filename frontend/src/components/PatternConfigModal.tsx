import React, { useState } from 'react';
import './PatternConfigModal.css';

export type PatternType = 'line' | 'four-corners' | 'letter-C' | 'letter-N' | 'letter-L' | 'letter-M' | 'letter-X' | 'full';

export interface GamePattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  order: number;
}

interface PatternConfigModalProps {
  onConfirm: (patterns: GamePattern[]) => void;
  onCancel: () => void;
}

export const PatternConfigModal: React.FC<PatternConfigModalProps> = ({ onConfirm, onCancel }) => {
  const [selectedLinearPatterns, setSelectedLinearPatterns] = useState<PatternType[]>(['four-corners', 'line']);
  const [selectedLetterPatterns, setSelectedLetterPatterns] = useState<PatternType[]>([]);
  const [includeFull, setIncludeFull] = useState(true);

  const linearPatterns: { type: PatternType; name: string; description: string }[] = [
    { type: 'four-corners', name: '4 Esquinas', description: 'Las cuatro esquinas del cartón' },
    { type: 'line', name: 'Línea', description: 'Cualquier línea completa (horizontal, vertical o diagonal)' },
  ];

  const letterPatterns: { type: PatternType; name: string; description: string }[] = [
    { type: 'letter-C', name: 'Letra C', description: 'Primera y última columna + primera y última fila' },
    { type: 'letter-N', name: 'Letra N', description: 'Primera y última columna + diagonal' },
    { type: 'letter-L', name: 'Letra L', description: 'Primera columna + última fila' },
    { type: 'letter-M', name: 'Letra M', description: 'Primera y última columna + casillas superiores' },
    { type: 'letter-X', name: 'Letra X', description: 'Ambas diagonales completas' },
  ];

  const toggleLinearPattern = (type: PatternType) => {
    setSelectedLinearPatterns(prev =>
      prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
    );
  };

  const toggleLetterPattern = (type: PatternType) => {
    setSelectedLetterPatterns(prev =>
      prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
    );
  };

  const handleConfirm = () => {
    const patterns: GamePattern[] = [];
    let order = 1;

    // Orden específico: 4 esquinas, línea, letras, pleno
    const orderedLinearTypes: PatternType[] = ['four-corners', 'line'];
    
    // Agregar patrones lineales en orden específico
    orderedLinearTypes.forEach(type => {
      if (selectedLinearPatterns.includes(type)) {
        const pattern = linearPatterns.find(p => p.type === type);
        if (pattern) {
          patterns.push({
            id: `${type}-${order}`,
            type: pattern.type,
            name: pattern.name,
            description: pattern.description,
            order: order++
          });
        }
      }
    });

    // Agregar patrones de letras
    selectedLetterPatterns.forEach(type => {
      const pattern = letterPatterns.find(p => p.type === type);
      if (pattern) {
        patterns.push({
          id: `${type}-${order}`,
          type: pattern.type,
          name: pattern.name,
          description: pattern.description,
          order: order++
        });
      }
    });

    // Agregar pleno si está seleccionado
    if (includeFull) {
      patterns.push({
        id: `full-${order}`,
        type: 'full',
        name: 'Cartón Lleno',
        description: 'Todos los números del cartón marcados',
        order: order
      });
    }

    if (patterns.length === 0) {
      alert('Debes seleccionar al menos un patrón');
      return;
    }

    onConfirm(patterns);
  };

  return (
    <div className="pattern-modal-overlay">
      <div className="pattern-modal">
        <div className="pattern-modal-header">
          <h2>Configurar Patrones del Juego</h2>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <div className="pattern-modal-content">
          <div className="pattern-section">
            <h3>1. Patrones Lineales</h3>
            <p className="section-description">Selecciona los tipos de líneas que quieres incluir:</p>
            <div className="pattern-options">
              {linearPatterns.map(pattern => (
                <div
                  key={pattern.type}
                  className={`pattern-option ${selectedLinearPatterns.includes(pattern.type) ? 'selected' : ''}`}
                  onClick={() => toggleLinearPattern(pattern.type)}
                >
                  <div className="pattern-checkbox">
                    {selectedLinearPatterns.includes(pattern.type) && '✓'}
                  </div>
                  <div className="pattern-info">
                    <h4>{pattern.name}</h4>
                    <p>{pattern.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pattern-section">
            <h3>2. Patrones de Letras</h3>
            <p className="section-description">Selecciona las letras que quieres incluir:</p>
            <div className="pattern-options">
              {letterPatterns.map(pattern => (
                <div
                  key={pattern.type}
                  className={`pattern-option ${selectedLetterPatterns.includes(pattern.type) ? 'selected' : ''}`}
                  onClick={() => toggleLetterPattern(pattern.type)}
                >
                  <div className="pattern-checkbox">
                    {selectedLetterPatterns.includes(pattern.type) && '✓'}
                  </div>
                  <div className="pattern-info">
                    <h4>{pattern.name}</h4>
                    <p>{pattern.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pattern-section">
            <h3>3. Cartón Lleno (Pleno)</h3>
            <div className="pattern-options">
              <div
                className={`pattern-option ${includeFull ? 'selected' : ''}`}
                onClick={() => setIncludeFull(!includeFull)}
              >
                <div className="pattern-checkbox">
                  {includeFull && '✓'}
                </div>
                <div className="pattern-info">
                  <h4>Cartón Lleno</h4>
                  <p>Todos los números del cartón deben estar marcados</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pattern-summary">
            <h4>Resumen:</h4>
            <p>
              Total de patrones seleccionados: {' '}
              <strong>{selectedLinearPatterns.length + selectedLetterPatterns.length + (includeFull ? 1 : 0)}</strong>
            </p>
            <p className="summary-note">
              Los patrones se jugarán en orden: 4 esquinas, líneas, letras, y finalmente el pleno.
            </p>
          </div>
        </div>

        <div className="pattern-modal-actions">
          <button className="cancel-button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirm-button" onClick={handleConfirm}>
            Iniciar Juego
          </button>
        </div>
      </div>
    </div>
  );
};
