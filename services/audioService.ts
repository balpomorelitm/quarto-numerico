
const spanishNumbers: { [key: number]: string } = {
  1: 'Uno',
  2: 'Dos',
  3: 'Tres',
  4: 'Cuatro',
  5: 'Cinco',
  6: 'Seis',
  7: 'Siete',
  8: 'Ocho',
  9: 'Nueve',
  10: 'Diez',
  11: 'Once',
  12: 'Doce',
  13: 'Trece',
  14: 'Catorce',
  15: 'Quince',
  16: 'Dieciséis',
};

export const speakSpanishNumber = (number: number): void => {
  if ('speechSynthesis' in window && spanishNumbers[number]) {
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(spanishNumbers[number]);
    utterance.lang = 'es-ES';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Text-to-Speech not supported or invalid number provided.');
    alert('Your browser does not support audio playback.');
  }
};
