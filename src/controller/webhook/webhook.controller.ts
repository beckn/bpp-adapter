import {
    controller,
    httpPost,
    interfaces,
    queryParam,
    requestBody,
    response,
} from "inversify-express-utils";
import { SearchService } from "../../service/search/search.service";
import { SelectService } from "../../service/select/select.service";
import { InitService } from "../../service/init/init.service";
import { ConfirmService } from "../../service/confirm/confirm.service";
import { StatusService } from "../../service/status/status.service";
import { XInputService } from "../../service/x-input/x-input.service";
import { SupportService } from "../../service/support/support.service";
import { TrackService } from "../../service/track/track.service";
import { RatingService } from "../../service/rating/rating.service";
import { CancelService } from "../../service/cancel/cancel.service";
import { UpdateService } from "../../service/update/update.service";
import { inject } from "inversify";
import axiosInstance from "axios";
import https from "https";
import config from "../../config";
import { TLService } from "../../tl/tl.service";
import { AppLogger } from "../../app/app.logger";

@controller("/")
export class WebhookController implements interfaces.Controller {
    constructor(
        @inject(SearchService) private searchService: SearchService,
        @inject(SelectService) private selectService: SelectService,
        @inject(InitService) private initService: InitService,
        @inject(ConfirmService) private confirmService: ConfirmService,
        @inject(StatusService) private statusService: StatusService,
        @inject(SupportService) private supportService: SupportService,
        @inject(TrackService) private trackService: TrackService,
        @inject(RatingService) private ratingService: RatingService,
        @inject(CancelService) private cancelService: CancelService,
        @inject(UpdateService) private updateService: UpdateService,
        @inject(XInputService) private xInputService: XInputService,
        @inject(TLService) private tLService: TLService
    ) { }

    @httpPost("/")
    public async get(
        @requestBody() body: any,
        @queryParam("name") name: string
    ): Promise<any> {
        try {
            let responseAction = "";
            const { action } = body.context || {};
            let result;
            switch (action) {
                case "search":
                    result = await this.searchService.search(body);
                    responseAction = "on_search";
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
                case "support":
                    result = await this.supportService.support(body);
                    responseAction = "on_support";
                    break;
                case "track":
                    result = await this.trackService.track(body);
                    responseAction = "on_track";
                    break;
                case "rating":
                    result = await this.ratingService.rating(body);
                    responseAction = "on_rating";
                    break;
                case "cancel":
                    result = await this.cancelService.cancel(body);
                    responseAction = "on_cancel";
                    break;
                case "update":
                    result = await this.updateService.update(body);
                    responseAction = "on_update";
                    break;
                default:
                    const appLogger = new AppLogger();
                    appLogger.error(`No action matched, action name ${action}`, action);
                    throw new Error(`No action matched, action name ${action}`);
            }
            let transformedData = {};
            if (responseAction && result) {
                transformedData = await this.tLService.transform(
                    result,
                    responseAction
                );
                await this.webhookCall(transformedData, responseAction);
            }
            //return transformedData;
        } catch (error) {
            const appLogger = new AppLogger();
            appLogger.error("Error in webhook", error);
            throw error;
        }
    }

    private async webhookCall(data: any, action: string): Promise<any> {
        const url = `${config.PROTOCOL_SERVER_URL}/${action}`;
        try {
            const appLogger = new AppLogger();
            appLogger.debug("response sent to ", { action });
            const axios = axiosInstance.create({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            });
            const bppHeaders = {
                "Content-Type": "application/json",
            };
            await axios.post(url, data, { headers: bppHeaders });
        } catch (error) {
            const appLogger = new AppLogger();
            appLogger.error("Error in pushing to webhook", { url, data, action });
        }
    }
}
