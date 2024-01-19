import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import config from "../../config";
import { retailQueryFields, retailQueryTable } from "../../template/retail/init/initItem.template";

@injectable()
export class InitService {
  constructor() { }

  async init(filter: any) {
    try {
      const commerceWorkFlow = config.ECOMMERCE.split(",");

      if (commerceWorkFlow.includes(filter.context.domain)) {
        const itemArray = filter.message.order.items;
        const itemValue = itemArray.map((obj: { id: string }) => obj.id);

        const result = await this.initItem(
          itemValue,
          retailQueryFields,
          retailQueryTable
        );

        const res = result.items.data;
        const resProvider = result.items.data[0].attributes.provider.data;

        const providerData = {
          id: resProvider?.id,
          descriptor: {
            name: resProvider?.attributes?.provider_name
              ? resProvider.attributes?.provider_name
              : "",
            short_desc: resProvider?.attributes?.short_desc
              ? resProvider?.attributes?.short_desc
              : "",
            long_desc: resProvider?.attributes?.long_desc
              ? resProvider?.attributes?.long_desc
              : "",
            additional_desc: {
              url: resProvider?.attributes?.provider_uri
                ? resProvider?.attributes?.provider_uri
                : "http://abc.com/image.jpg",
            },
            images: [
              {
                url: resProvider?.attributes?.logo?.data?.attributes?.url
                  ? resProvider?.attributes?.logo?.data?.attributes?.url
                  : "http://abc.com/image.jpg",
                size_type: resProvider?.attributes?.logo?.data?.attributes
                  ?.size_type
                  ? resProvider?.attributes?.logo?.data?.attributes?.size_type
                  : "sm",
              },
            ],
          },
        };
        const itemData = res.map((item: any) => {
          return {
            id: item.id,
            descriptor: {
              name: item?.attributes?.name ? item?.attributes?.name : "",
              long_desc: item.attributes.long_desc
                ? item.attributes.long_desc
                : "",
              short_desc: item.attributes.short_desc
                ? item.attributes.short_desc
                : "",
              images: [
                {
                  url: item?.attributes?.image?.url
                    ? item?.attributes?.image?.url
                    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJQbANiJKOddLqjBqk3Y-bws-pUxisbxvhrw&usqp=CAU",
                  size_type: item?.attributes?.image?.size_type
                    ? item?.attributes?.image?.size_type
                    : "sm",
                },
              ],
            },
            price: {
              value: item?.attributes?.sc_retail_product?.data?.attributes
                ?.min_price
                ? item?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
                : "0",
              currency: item?.attributes?.sc_retail_product?.data?.attributes
                ?.currency
                ? item?.attributes?.sc_retail_product?.data?.attributes
                  ?.currency
                : "INR",
            },
          };
        });

        const quoteData: any = {
          price: {
            value: res[0]?.attributes?.sc_retail_product?.data?.attributes
              ?.min_price
              ? res[0]?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
              : "0",
            currency: res[0]?.attributes?.sc_retail_product?.data?.attributes
              ?.currency
              ? res[0]?.attributes?.sc_retail_product?.data?.attributes
                ?.currency
              : "INR",
          },
          breakup:
            res[0]?.attributes?.sc_retail_product?.data?.attributes?.price_bareakup_ids?.data.map(
              (item: any) => {
                return {
                  item: {
                    id: item.attributes.item_id,
                  },
                  title: item.attributes.title,
                  price: {
                    currency: item.attributes.currency,
                    value: item.attributes.value,
                  },
                };
              }
            ),
        };

        const paymentData = res.map((payDetails: any) => {
          return {
            collected_by: "BPP",
            params:
              payDetails.attributes.provider.data.attributes.payment_methods.data.map(
                (payItem: any) => {
                  return {
                    bank_account: payItem.attributes.bank_account_number,
                    bank_code: payItem.attributes.bank_code,
                    price: quoteData.price,
                    currency: quoteData.currency,
                  };
                }
              )[0] || {},
            type: "PRE-ORDER",
          };
        });

        const output: any = {
          context: filter.context,
          message: {
            order: {
              provider: providerData,
              items: itemData,
              fulfillments: filter.message.order.fulfillments,
              billing: filter.message.order.billing,
              payments: paymentData,
              quote: quoteData,
            },
          },
        };
        return output;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async initItem(itemValue: any, fields: string, table: string) {
    const queryFilter = `filters:{id:{in:[${itemValue}]}}`;
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
