require('dotenv').config();

// Mock console.warn to keep test output clean for expected warnings
console.warn = jest.fn();
