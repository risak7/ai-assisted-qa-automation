import { faker } from '@faker-js/faker';

export type ProgramHappyPath = {
  name: string;
  description: string;
};

/**
 * Happy-path program fields for UI or API create flows. Names stay unique per run.
 */
export function buildProgramHappyPath(overrides: Partial<ProgramHappyPath> = {}): ProgramHappyPath {
  const year = faker.number.int({ min: 2024, max: 2030 });
  const token = faker.string.alphanumeric(8);
  return {
    name: `${faker.commerce.productAdjective()} ${faker.word.noun()} ${year} ${token}`,
    description: faker.lorem.paragraph({ min: 1, max: 3 }),
    ...overrides,
  };
}
