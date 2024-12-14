import {describe, expect, test, jest} from '@jest/globals';
import {extractHighlight} from '../src/extractHighlight';
import {beforeEach } from 'node:test';

jest.mock('src/settings', () => {
  return {
    ANNOTS_TREATED_AS_HIGHLIGHTS: ['Highlight', 'Underline', 'Squiggly'],
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('extractHighlight', () => {
	const items = [
		{ str: 'Hello', transform: [0, 0, 0, 0, 10, 10], width: 50 },
		{ str: 'World', transform: [0, 0, 0, 0, 60, 10], width: 50 },
	];
	const annot = {
		quadPoints: [
			[{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 20 }, { x: 10, y: 20 }],
		],
	};
	test('should extract highlighted text', () => {
		const result = extractHighlight(annot, items);
		expect(result).toBe('Hello World');
	});
});