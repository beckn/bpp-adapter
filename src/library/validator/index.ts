import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import Logger from "../logger";

export const validateRequest =
  (schema: any) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(request.body);
      next();
    } catch (validationError: any) {
      try {
        Logger.error(validationError);
        const parsedError = JSON.parse(validationError);
        const result = {
          success: false,
          error: parsedError.length
            ? parsedError[0].message
            : "Something went wrong",
        };
        response.status(httpStatus.BAD_REQUEST).send(result);
      } catch (error) {
        next(validationError);
      }
    }
  };
