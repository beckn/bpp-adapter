import { injectable } from "inversify";

import config from "../../config";

@injectable()
export class RatingService {
  constructor() {}
  async rating(filter: any) {
    try {
      const commerceWorkFlow = config.ECOMMERCE.split(",");

      if (commerceWorkFlow.includes(filter.context.domain)) {
        const output: any = {
          context: filter.context,
          message: {
            feedback_form: {
              xinput: {
                form: {
                  url: `${config.ADAPTER_BASE_URL}/x-input/form?form_id=abcd`,
                  mime_type: "text/html",
                },
                required: "false",
              },
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
