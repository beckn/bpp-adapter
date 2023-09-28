import express, { Request, Response, NextFunction ,Router} from "express";
import httpStatus from "http-status";
import * as searchService from "../search/search.service";
import * as selectService from "../select/select.service";
import * as initService from "../init/init.service";
import axiosInstance from "axios";
import https from 'https'
import config from "../../config";
const axios = axiosInstance.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});
const bppHeaders = {
  
  "Content-Type": "application/json",
};
const webhookCall = (data: any,action:string) => Promise.all(
  
    data.map((value: any) => axios.post(`${config.BPP_URL}/${action}`, value,{header:bppHeaders))
)


export default function defineBppHandlerRoutes(expressApp: express.Application) {
    const bppHandlerRouter = express.Router();
    bppHandlerRouter.post(
        "/",
       
        async (request: Request, response: Response, next: NextFunction) => {
          try {
            let responseAction=""
            const filter = request.body;
            if(filter.context.action==="search"){
                responseAction="on_search"
                const result = await searchService.search(filter);
                console.log(result)
                 await webhookCall(result.responseData,responseAction)
                //response.status(httpStatus.OK).send(result.responseData);
            }
            if(filter.context.action==="select"){
                const result = await selectService.select(filter);
                response.status(httpStatus.OK).send(result);
            }
            if(filter.context.action==="init"){
                const result = await initService.init(filter);
                response.status(httpStatus.OK).send(result);
            }
            

            //response.status(httpStatus.OK).send({"success": ACK});
            
            
          
          } catch (error) {
            next(error);
          }
        }
      );
    expressApp.use( bppHandlerRouter);
  }

 
