// test_logger.js - simple script to test logger
const logger = require('./logger'); // adjust path if needed

// Initialize logger (adds transports and handlers)
logger.initLogger();

logger.debug('Debug message', { foo: 'bar' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error occurred', new Error('Test error'));

console.log('Logging done');
