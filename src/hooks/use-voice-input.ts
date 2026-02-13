import { useState, useCallback, useRef } from 'react';

interface UseVoiceInputOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({ lang = 'es-ES', onResult, onError }: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      onError?.('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        onError?.('No se pudo reconocer la voz. Inténtalo de nuevo.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}

/**
 * Parse a voice command like "quiero ir a la calle lima 13 en granada"
 * or "desde plaza españa hasta calle lima 13 granada"
 */
export function parseVoiceCommand(transcript: string): {
  origin?: string;
  destination?: string;
} | null {
  const text = transcript.toLowerCase().trim();

  // Pattern: "desde X hasta/a Y"
  const desdeHasta = text.match(/desde\s+(.+?)\s+(?:hasta|a)\s+(.+)/);
  if (desdeHasta) {
    return { origin: desdeHasta[1].trim(), destination: desdeHasta[2].trim() };
  }

  // Pattern: "quiero ir a/hasta X" / "llévame a X" / "ir a X" / "navegar a X"
  const irA = text.match(/(?:quiero ir|llévame|ir|navegar|navega|ruta|ve)\s+(?:a|al|hasta|hacia)\s+(.+)/);
  if (irA) {
    return { destination: irA[1].trim() };
  }

  // Pattern: "de X a Y"
  const deA = text.match(/de\s+(.+?)\s+a\s+(.+)/);
  if (deA) {
    return { origin: deA[1].trim(), destination: deA[2].trim() };
  }

  // Fallback: treat entire text as destination
  if (text.length > 3) {
    return { destination: text };
  }

  return null;
}
