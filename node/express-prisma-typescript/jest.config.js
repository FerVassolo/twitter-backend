module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js'],
    testMatch: ['**/test/**/**/*.test.ts'],
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
        '^@main/(.*)$': '<rootDir>/src/main/$1',
    },
};
