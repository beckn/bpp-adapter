const Logger = {
  debug: (message: string, metadata: object = {}): void => {
    console.log(message, metadata);
  },

  info: (message: string, metadata: object = {}): void => {
    console.log(message, metadata);
  },

  warning: (message: string, metadata: object = {}): void => {
    console.log(message, metadata);
  },

  error: (message: string, metadata: object = {}): void => {
    console.log(message, metadata);
  },
};

export default Logger;
