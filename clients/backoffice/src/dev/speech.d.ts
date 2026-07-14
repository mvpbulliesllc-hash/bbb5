// Minimal Web Speech API surface — not in lib.dom, and only used behind
// runtime feature detection in DevPortal.
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  [Symbol.iterator](): IterableIterator<SpeechRecognitionResult>;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
declare class SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
