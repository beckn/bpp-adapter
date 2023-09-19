import express, { Request, Response, NextFunction ,Router} from "express";
import httpStatus from "http-status";
import * as initService from "./init.service";



export default function defineInitRoutes(expressApp: express.Application) {
    const initRouter = express.Router();
  

    initRouter.post(
        "/init",
       
        async (request: Request, response: Response, next: NextFunction) => {
          try {
            const filter = request.body;
            console.log("filter",filter)
            const result = await initService.init(filter);
            response.status(httpStatus.OK).send({ success: true,...result });
          } catch (error) {
            next(error);
          }
        }
      );
    expressApp.use("/v1", initRouter);
  }