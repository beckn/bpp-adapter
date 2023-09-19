import * as util from "util";

import Logger from "../logger";

class AppError extends Error {
  constructor(
    public name: string,
    public message: string,
    public HTTPStatus: number = 500,
    public isTrusted = true
  ) {
    super(message);
  }
}

const normalizeError = (errorToHandle: unknown): AppError => {
  if (errorToHandle instanceof AppError) {
    return errorToHandle;
  }
  if (errorToHandle instanceof Error) {
    const appError = new AppError(errorToHandle.name, errorToHandle.message);
    appError.stack = errorToHandle.stack;
    return appError;
  }

  const inputType = typeof errorToHandle;
  return new AppError(
    "general error",
    `Error Handler received a none error instance with type - ${inputType}, value - ${util.inspect(
      errorToHandle
    )}`
  );
};

export const HandleError = (errorToHandle: unknown): void => {
  const appError: AppError = normalizeError(errorToHandle);

  Logger.info(appError.message);
};

export default AppError;
