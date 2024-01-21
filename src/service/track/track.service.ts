import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import config from "../../config";
import {
  retailQueryFields,
  retailQueryTable,
} from "../../template/retail/track/trackItem.template";

@injectable()
export class TrackService {
  constructor() {}
  async track(filter: any) {
    try {
      const commerceWorkFlow = config.ECOMMERCE.split(",");

      if (commerceWorkFlow.includes(filter.context.domain)) {
        const orderId = filter.message.order_id;
        const orderTrackResponse = await this.trackItem(
          orderId,
          retailQueryFields,
          retailQueryTable
        );

        const trackingData =
          orderTrackResponse.orderFulfillments.data.map((track: any) => {
            return {
              id: track?.attributes?.order_tracking_id?.data?.id
                ? track?.attributes?.order_tracking_id?.data?.id
                : "Default",
              url: track?.attributes?.order_tracking_id?.data?.attributes?.url
                ? track?.attributes?.order_tracking_id?.data?.attributes?.url
                : "https://merkspace/tracking/201f6fa2-a2f7-42e7-a2e5-8947398747",
              status: track?.attributes?.order_tracking_id?.data?.attributes
                ?.status
                ? track?.attributes?.order_tracking_id?.data?.attributes?.status
                : "active",
            };
          })[0] || {};

        const output: any = {
          context: filter.context,
          message: {
            tracking: trackingData,
          },
        };
        return output;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async trackItem(itemValue: any, fields: string, table: string) {
    const queryFilter = `filters:{order_id:{id:{in:[${itemValue}]}}}`;
    const query = `query {
          ${table} (
            ${queryFilter}
          )
          ${fields}
        }`;

    const response = await makeGraphQLRequest(query).then((res) => res.data);
    return response;
  }
}
