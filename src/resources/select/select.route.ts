import express, { Request, Response, NextFunction ,Router} from "express";
import httpStatus from "http-status";
import * as selectService from "./select.service";



export default function defineSelectRoutes(expressApp: express.Application) {
    const selectRouter = express.Router();
  

    selectRouter.post(
        "/select",
       
        async (request: Request, response: Response, next: NextFunction) => {
          try {
            const filter = request.body;
            console.log("filter",filter)
            const result = await selectService.select(filter);
            response.status(httpStatus.OK).send({ success: true,...result });
          } catch (error) {
            next(error);
          }
        }
      );
    expressApp.use("/v1", selectRouter);
  }