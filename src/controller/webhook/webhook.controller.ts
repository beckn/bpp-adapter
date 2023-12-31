import { controller, httpPost, interfaces, queryParam, requestBody, response } from 'inversify-express-utils';
import { SearchService } from '../../service/search/search.service';
import { SelectService } from '../../service/select/select.service';
import { InitService } from '../../service/init/init.service';
import { ConfirmService } from '../../service/confirm/confirm.service';
import { StatusService } from '../../service/status/status.service';
import { XInputService } from '../../service/x-input/x-input.service';
import { inject } from 'inversify';
import axiosInstance from "axios";
import https from 'https'
import config from "../../config";
import { TLService } from '../../tl/tl.service';

@controller('/')
export class WebhookController implements interfaces.Controller {
    constructor(
        @inject(SearchService) private searchService: SearchService,
        @inject(SelectService) private selectService: SelectService,
        @inject(InitService) private initService: InitService,
        @inject(ConfirmService) private confirmService: ConfirmService,
        @inject(StatusService) private statusService: StatusService,
        @inject(XInputService) private xInputService: XInputService,
        @inject(TLService) private tLService: TLService
    ) { }

    @httpPost('/')
    public async get(@requestBody() body: any, @queryParam('name') name: string): Promise<any> {
        try {
            let responseAction = "";
            const { action } = body.context || {};
            let result = {};
            switch (action) {
                case "search":
                    responseAction = "on_search";
                    result = await this.searchService.search(body);
                    break;

                case "select":
                    result = await this.selectService.select(body);
                    responseAction = "on_select";
                    break;

                case "init":
                    result = await this.initService.init(body);
                    responseAction = "on_init";
                    break;

                case "confirm":
                    result = await this.confirmService.confirm(body);
                    responseAction = "on_confirm";
                    break;

                case "status":
                    result = await this.statusService.status(body);
                    responseAction = "on_status";
                    break;
            }
            let transformedData = {};
            transformedData = await this.tLService.transform(result, responseAction);
            await this.webhookCall(transformedData, responseAction);
            // return transformedData;
        } catch (error) {
            throw error;
        }
    }

    private async webhookCall(data: any, action: string): Promise<any> {
        const axios = axiosInstance.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        const bppHeaders = {
            "Content-Type": "application/json",
        };
        await axios.post(`${config.PROTOCOL_SERVER_URL}/${action}`, data, { headers: bppHeaders });
    }
}
