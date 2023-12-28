import { Container } from 'inversify';
import "reflect-metadata";
import { TLService } from '../tl/tl.service';
import { InversifyExpressServer } from 'inversify-express-utils';
import { AppLogger } from '../app/app.logger';
import { HealthController } from '../controller/health/health.controller';
import { WebhookController } from '../controller/webhook/webhook.controller';
import { SearchService } from '../service/search/search.service';
import { SelectService } from '../service/select/select.service';
import { InitService } from '../service/init/init.service';
import { ConfirmService } from '../service/confirm/confirm.service';
import { StatusService } from '../service/status/status.service';
import { XInputService } from '../service/x-input/x-input.service';


const container = new Container();
const server = new InversifyExpressServer(container);

container.bind<TLService>(TLService).to(TLService);
container.bind<AppLogger>(AppLogger).to(AppLogger);
container.bind<HealthController>(HealthController).toSelf();
container.bind<WebhookController>(WebhookController).toSelf();
container.bind<SearchService>(SearchService).to(SearchService);
container.bind<SelectService>(SelectService).to(SelectService);
container.bind<InitService>(InitService).to(InitService);
container.bind<ConfirmService>(ConfirmService).to(ConfirmService);
container.bind<StatusService>(StatusService).to(StatusService);
container.bind<XInputService>(XInputService).to(XInputService);

export { server, container };
