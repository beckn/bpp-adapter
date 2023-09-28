import express from "express";
import mongoose from "mongoose";
import httpStatus from "http-status";

import { AddressInfo } from "net";
import { Server } from "http";
import { inspect } from "util";

import config from "./config";

import AppError from "./library/exception";
import Logger from "./library/logger";



import defineHealthRoutes from "./resources/health/health.route";

import defineBppHandlerRoutes from "./resources/bppHandler/bppHandler.route";


let connection: Server;

export const startAppServer = async (): Promise<AddressInfo> => {
  const expressApp = express();

  expressApp.use(express.urlencoded({ extended: true, limit: "50mb" }));
  expressApp.use(express.json({ limit: "50mb" }));

  defineHealthRoutes(expressApp)
  
  defineBppHandlerRoutes(expressApp)


  expressApp.use((request, response, next) => {
    try {
      throw new AppError(
        "ROUTE_NOT_FOUND",
        `Request URL (${request.originalUrl}) is not available`,
        httpStatus.NOT_FOUND
      );
    } catch (error) {
      next(error);
    }
  });

  
  handleErrorRoute(expressApp);
  const APIAddress = await openConnection(expressApp);
  return APIAddress;
};

const openConnection = async (
  expressApp: express.Application
): Promise<AddressInfo> => {
  return new Promise((resolve) => {
    Logger.info(`Server is about to listen to port ${config.PORT}`, {
      name: "Application",
    });
    connection = expressApp.listen(config.PORT, () => {
      // mongoose
      //   .connect(config.DATABASE_URL, {
      //     autoCreate: true,
      //   })
      //   .then(() => {
      //     Logger.info("ENV config::", config);
      //     Logger.info("Mongodb connected", {
      //       name: "Application",
      //     });
          resolve(connection.address() as AddressInfo);
        // });
    });
  });
};

const handleErrorRoute = (expressApp: express.Application) => {
  expressApp.use(
    async (
      error: any,
      request: express.Request,
      response: express.Response,
      next: express.NextFunction
    ) => {
      Logger.error("Error:::", error);
      response
        .status(error instanceof AppError ? error.HTTPStatus : 500)
        .send(
          error instanceof AppError
            ? {
                success: false,
                error: true,
                errorType: error.name,
                statusCode: error.HTTPStatus,
                message: error.message,
              }
            : {
                success: false,
                error: true,
                errorType: "internal server error",
                message: error.message
                  ? error.message
                  : "internal server error",
                statusCode: 500,
              }
        )
        .end();
    }
  );
};