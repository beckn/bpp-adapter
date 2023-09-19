import express, { Request, Response, NextFunction ,Router} from "express";
import httpStatus from "http-status";
import * as searchService from "./search.service";



export default function defineSearchRoutes(expressApp: express.Application) {
    const searchRouter = express.Router();
  

    searchRouter.post(
        "/search",
       
        async (request: Request, response: Response, next: NextFunction) => {
          try {
            const filter = request.body;
            console.log("filter",filter)
            const result = await searchService.search(filter);
            response.status(httpStatus.OK).send({ success: true,...result });
          } catch (error) {
            next(error);
          }
        }
      );
    expressApp.use("/v1", searchRouter);
  }