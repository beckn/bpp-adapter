import { Request, Response } from 'express';
import { controller, httpGet, interfaces, request, response } from 'inversify-express-utils';
import httpStatus from "http-status";

@controller('/api/v1/health')
export class HealthController implements interfaces.Controller {
  constructor() { }

  @httpGet('/')
  public async get(@request() _req: Request, @response() res: Response): Promise<void> {
    const healthCheck = {
      sucess: true,
      uptime: process.uptime(),
      responseTime: process.hrtime(),
      date: new Date(),
    };

    try {
      res.status(httpStatus.OK).send(healthCheck);
    } catch (error) {
      res.status(httpStatus.SERVICE_UNAVAILABLE).send();
      return undefined;
    }
  }
}
