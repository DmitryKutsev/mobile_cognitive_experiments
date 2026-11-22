import dictionary from '../config/associations.json';
import { Experiment, validateWords } from './domain/experiment';
export function experiments(): Experiment[] {
  return [{ id: 'associations', title: 'Associations Experiment',
    instruction: 'Say the first association that comes to mind when you see and hear each word.',
    trialCount: dictionary.trialCount, words: validateWords(dictionary.words, dictionary.trialCount) }];
}
