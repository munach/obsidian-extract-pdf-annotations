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

describe('extractHighlight - simple text', () => {
	const items = [
		{ str: 'diese', transform: [12.000000267999969, 0, 0, 12.000000267999969, 71.50000108483317, 715.2499987979169], width: 28.68748864068716 },
		{ str: '(S. 1)', transform: [12.000000267999969, 0, 0, 12.000000267999969, 52.00000064933322, 685.2499981279169], width: 29.33788865521276 },
		{ str: 'Word,', transform: [12.000000267999969, 0, 0, 12.000000267999969, 71.50000108483317, 655.2499974579171], width: 31.78710370991189 },
		{ str: '(S. 1)', transform: [12.000000267999969, 0, 0, 12.000000267999969, 52.00000064933322, 625.2499967879171], width: 29.33788865521276 },
		{ str: 'Lesen', transform: [12.000000267999969, 0, 0, 12.000000267999969, 71.50000108483317, 595.2499961179171], width: 32.69529673019486 },
		{ str: '(S. 1)', transform: [12.000000267999969, 0, 0, 12.000000267999969, 52.00000064933322, 565.2499954479173], width: 29.33788865521276 },
	];
	test('should extract highlighted text', () => {
    const annot = {
      quadPoints: [
        [{x: 70.636, y: 634.118}, {x: 81.304, y: 634.118}, {x: 70.636, y: 622.742}, {x: 81.304, y: 622.742}],
      ],
    };
		const result = extractHighlight(annot, items);
		expect(result).toBe('1)');
	});
  test('should extract highlighted text', () => {
    const annot = {
      quadPoints: [
        [{x: 71.5, y: 603.974}, {x: 104.188, y: 603.974}, {x: 71.5, y: 595.118}, {x: 104.188, y: 595.118}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('Lesen');
  });
  test('should extract highlighted text', () => { 
    const annot = {
      quadPoints: [
        [{x: 52, y: 694.118}, {x: 81.304, y: 694.118}, {x: 52, y: 682.742}, {x: 81.304, y: 682.742}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('(S. 1)');
  });

  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [
        [{x: 71.5, y: 663.974}, {x: 82.816, y: 663.974}, {x: 71.5, y: 653.558}, {x: 82.816, y: 653.558}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('W');
  });

  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [
        [{x: 82.609, y: 663.974}, {x: 89.281, y: 663.974}, {x: 82.609, y: 653.558}, {x: 89.281, y: 653.558}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('o');
  });
  
  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [
        [{x: 89.281, y: 663.974}, {x: 93.445, y: 663.974}, {x: 89.281, y: 653.558}, {x: 93.445, y: 653.558}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('r');
  });

  
  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [
        [{x: 93.277, y: 663.974}, {x: 99.949, y: 663.974}, {x: 93.277, y: 653.558}, {x: 99.949, y: 653.558}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('d');
  });

  
  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [
        [{x: 99.949, y: 663.974}, {x: 103.273, y: 663.974}, {x: 99.949, y: 653.558}, {x: 103.273, y: 653.558}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe(',');
  });

  test('should extract underlined word', () => {
    const annot = {
      quadPoints: [
        [{x: 71.5, y: 603.974}, {x: 104.188, y: 603.974}, {x: 71.5, y: 594.118}, {x: 104.188, y: 594.118}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('Word');
  });

  test('should extract underlined letter', () => {
    const annot = {
      quadPoints: [
        [{x: 55.996, y: 634.118}, {x: 63.988, y: 634.118}, {x: 55.996, y: 621.742}, {x: 63.988, y: 621.742}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('S');
  });

  test('should extract swiggled letter', () => {
    const annot = {
      quadPoints: [
        [{x: 71.5, y: 663.974}, {x: 82.816, y: 663.974}, {x: 71.5, y: 652.558}, {x: 82.816, y: 652.558}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('W');
  });

  test('should extract squiggled word', () => {
    const annot = {
      quadPoints: [
        [{x: 71.5, y: 723.974}, {x: 87.508, y: 723.974}, {x: 71.5, y: 714.118}, {x: 87.508, y: 714.118}],
      ],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('die');
  });
});