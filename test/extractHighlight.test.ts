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
      quadPoints: [70.636, 634.118, 81.304, 634.118, 70.636, 622.742, 81.304, 622.742],
    };
		const result = extractHighlight(annot, items);
		expect(result).toBe('1)');
	});
  test('should extract highlighted text', () => {
    const annot = {
      quadPoints: [71.5, 603.974, 104.188, 603.974, 71.5, 595.118, 104.188, 595.118],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('Lesen');
  });
  test('should extract highlighted text', () => { 
    const annot = {
      quadPoints: [52, 694.118, 81.304, 694.118, 52, 682.742, 81.304, 682.742],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('(S. 1)');
  });

  test('should extract highlighted text over multiple lines', () => {
    const annot = {
      quadPoints: [93.50800323486328, 723.9739990234375, 100.18000030517578, 723.9739990234375, 93.50800323486328, 715.1179809570312, 100.18000030517578, 715.1179809570312, 52, 694.1179809570312, 63.987998962402344, 694.1179809570312, 52, 682.7420043945312, 63.987998962402344, 682.7420043945312],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('e (S');
  });

  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [71.5, 663.974, 82.816, 663.974, 71.5, 653.558, 82.816, 653.558],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('W');
  });

  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [82.609, 663.974, 89.281, 663.974, 82.609, 653.558, 89.281, 653.558],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('o');
  });
  
  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [89.281, 663.974, 93.445, 663.974, 89.281, 653.558, 93.445, 653.558],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('r');
  });

  
  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [93.277, 663.974, 99.949, 663.974, 93.277, 653.558, 99.949, 653.558],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('d');
  });

  
  test('should extract highlighted letter', () => {
    const annot = {
      quadPoints: [99.949, 663.974, 103.273, 663.974, 99.949, 653.558, 103.273, 653.558],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe(',');
  });

  test('should extract underlined word', () => {
    const annot = {
      quadPoints: [71.5, 603.974, 104.188, 603.974, 71.5, 594.118, 104.188, 594.118],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('Lesen');
  });

  test('should extract underlined letter', () => {
    const annot = {
      quadPoints: [55.996, 634.118, 63.988, 634.118, 55.996, 621.742, 63.988, 621.742],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('S');
  });

  test('should extract swiggled letter', () => {
    const annot = {
      quadPoints: [71.5, 663.974, 82.816, 663.974, 71.5, 652.558, 82.816, 652.558],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('W');
  });

  test('should extract squiggled word', () => {
    const annot = {
      quadPoints: [71.5, 723.974, 87.508, 723.974, 71.5, 714.118, 87.508, 714.118],
    };
    const result = extractHighlight(annot, items);
    expect(result).toBe('die');
  });
});