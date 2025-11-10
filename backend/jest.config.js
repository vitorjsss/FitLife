export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/config/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    verbose: true
};
