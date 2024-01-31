import { Response } from "express";
import fs from "fs";
import ejs from "ejs";
import {
  controller,
  httpPost,
  httpGet,
  interfaces,
  requestBody,
  response,
  queryParam
} from "inversify-express-utils";
import httpStatus from "http-status";
import path from "path";
import appRootPath from "app-root-path";
import { convertToJoiSchema } from "../../util/validate.util";
import config from "../../config";
import { XInputService } from "../../service/x-input/x-input.service";
import { inject } from "inversify";

@controller("/x-input")
export class XInputController implements interfaces.Controller {
  constructor(@inject(XInputService) private xInputService: XInputService,) { }

  @httpGet("/form")
  public async getForm(
    @queryParam("form_id") form_id: string,
    @response() res: Response
  ): Promise<any> {
    try {
      if (!form_id) {
        return res.status(httpStatus.BAD_REQUEST).send();
      }

      const template = fs.readFileSync(
        path.join(
          appRootPath.toString(),
          `/src/template/x-input/${form_id}.ejs`
        ),
        "utf8"
      );
      const compiledTemplate = ejs.compile(template);
      const renderedHTML = compiledTemplate({ action: `${config.ADAPTER_BASE_URL}/x-input/submit` });
      // res.setHeader("Content-Type", "text/html");
      // res.write(renderedHTML);
      return res.status(httpStatus.OK).send({
        textHtml: renderedHTML
      });
    } catch (error) {
      return res.status(httpStatus.SERVICE_UNAVAILABLE).send();
    }
  }
  @httpPost("/submit")
  public async submitForm(
    @requestBody() body: any,
    @response() res: Response
  ): Promise<any> {
    try {
      const { form_id } = body.message;
      if (!form_id) {
        return res.status(httpStatus.BAD_REQUEST).send();
      }
      const data = body.message;
      const validationRules = fs.readFileSync(
        path.join(
          appRootPath.toString(),
          `/src/template/x-input/${form_id}.json`
        ),
        "utf-8"
      );
      const schema = convertToJoiSchema(JSON.parse(validationRules));
      const { error, value } = schema.validate(data);
      if (error != undefined) {
        return res.status(httpStatus.OK).send({ error: error.details[0].message });
      }

      const result = await this.xInputService.xInput(value);
      return res.status(httpStatus.OK).send(result);
    } catch (error) {
      return res.status(httpStatus.SERVICE_UNAVAILABLE).send();
    }
  }
}
