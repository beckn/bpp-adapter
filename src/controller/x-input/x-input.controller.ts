import { Request, Response } from 'express';
import fs from 'fs';
import ejs from 'ejs';
import { controller, httpPost, interfaces, requestBody, response } from 'inversify-express-utils';
import httpStatus from "http-status";
import path from 'path';
import appRootPath from "app-root-path";
import Joi from 'joi'
import { convertToJoiSchema } from "../../util/validate.util";



@controller('/x-input')
export class XInputController implements interfaces.Controller {
  constructor() { }

  @httpPost('/form')
  public async getForm(@requestBody() body: any, @response() res: Response): Promise<void> {
    try {
      const { action } = body.context || {};
      if (!action) {
        res.status(httpStatus.BAD_REQUEST).send();
        return;
      }
      
      const template = fs.readFileSync(path.join(appRootPath.toString(), `/src/template/x-input/${action}/${action}.ejs`), "utf8")
      const compiledTemplate = ejs.compile(template);
      const renderedHTML = compiledTemplate();
      res.setHeader('Content-Type', 'text/html');
      res.write(renderedHTML);
      res.status(httpStatus.OK).send();
    } catch (error) {
      res.status(httpStatus.SERVICE_UNAVAILABLE).send();
      return undefined;
    }
  }
  @httpPost('/submit')
  public async submitForm(@requestBody() body: any, @response() res: Response): Promise<void> {
    try {
      interface Payload {
        name?: string;
        age?: number;
        [key: string]: unknown; 
      }
      const { action } = body.context || {};
      if (!action) {
        res.status(httpStatus.BAD_REQUEST).send();
        return;
      }
      const data=body.message
      const validationRules=fs.readFileSync(path.join(appRootPath.toString(),`/src/template/x-input/on_init/validation_rules.json`),"utf-8")
      const schema = convertToJoiSchema(JSON.parse(validationRules));
      const { error, value } = schema.validate(data);
      if(error != undefined){
        res.status(httpStatus.OK).send({error: error.details[0].message});
        return;
      }
   
 
      res.status(httpStatus.OK).send(value);
    } catch (error) {
      res.status(httpStatus.SERVICE_UNAVAILABLE).send();
      return undefined;
    }
  }
}
