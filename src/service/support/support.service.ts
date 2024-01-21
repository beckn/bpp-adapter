import { injectable } from "inversify";
import config from "../../config";

@injectable()
export class SupportService {
  constructor() {}
  async support(filter: any) {
    try {
      const commerceWorkFlow = config.ECOMMERCE.split(",");

      if (commerceWorkFlow.includes(filter.context.domain)) {
        const output: any = {
          context: filter.context,
          message: {
            support: {
              ref_id: filter.message.support.ref_id,
              callback_phone: "+91-9876543210",
              phone: "+91-9876543210",
              email: "support@strapi.io",
              url: "https://support.strapi.io/support",
            },
          },
        };
        return output;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
