// src/utils/logger.js

export const logInfo = (tag, ...args) => {
    if (__DEV__) {
      console.log(`[${tag}]`, ...args);
    }
  };
  
  export const logError = (tag, ...args) => {
    if (__DEV__) {
      console.error(`[${tag}]`, ...args);
    }
  };
  
  export const logWarn = (tag, ...args) => {
    if (__DEV__) {
      console.warn(`[${tag}]`, ...args);
    }
  };
  