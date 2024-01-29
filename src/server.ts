import express from "express";
import httpStatus from "http-status";
import { AddressInfo } from "net";
import { Server } from "http";
import cors from "cors";
import config from "./config";
import AppError from "./library/exception";
import Logger from "./library/logger";
import { server } from "./inversify/inversify.config";

let connection: Server;
export const startAppServer = async (): Promise<AddressInfo> => {
  const expressApp = express();
  server.setConfig((expressApp) => {
    expressApp.use(express.json({ limit: "50mb" }));
    expressApp.use(express.urlencoded({ extended: true, limit: "50mb" }));
  });
  expressApp.use(server.build());

  // expressApp.options(
  //   "*",
  //   cors({
  //     origin: "*",
  //     optionsSuccessStatus: 204,
  //     credentials: true,
  //     methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
  //     allowedHeaders: '*',
  //     exposedHeaders: '*'
  //   })
  // );

  expressApp.options(
    "*",
    (
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      response
        .status(201)
        .send({
          message: 'Message for options'
        });
    }
  );

  expressApp.use((request, _response, next) => {
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
      resolve(connection.address() as AddressInfo);
    });
  });
};

const handleErrorRoute = (expressApp: express.Application) => {
  expressApp.use(
    async (
      error: any,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
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
