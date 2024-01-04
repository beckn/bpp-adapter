import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import { DOMAIN } from "../../constants";
import config from "../../config";

@injectable()
export class InitService {
  constructor() { }

  async init(filter: any) {
    if (filter.context.domain.trim() === DOMAIN) {
      const itemArray = filter.message.order.items;
      const itemValue = itemArray.map((obj: { id: string }) => obj.id);

      const query = `query {
 items(filters: { id: { in: [${itemValue}] } }) {
   data {
     id
     attributes {
       name
       long_desc
       short_desc
       code
       image {
         data {
           id
           attributes {
             url
           }
         }
       }
       provider {
         data {
           id
           attributes {
             provider_id
             provider_uri
             provider_name
             short_desc
             long_desc
             logo {
               data {
                 id
                 attributes {
                   url
                 }
               }
             }
              
           }
         }
       }
        sc_retail_product{
               data
               {
                 id
                 attributes
                 {
                   
                  
                   min_price
                   max_price
                   on_sale
                   stock_status
                   stock_quantity
                   rating_count
                   average_rating
                   tax_class
                   tax_status
                   total_sales
                   currency
                   base_fee
                 }
               }
             }
     }
   }
 }
}`;
      const response = await makeGraphQLRequest(query).then((res) => res.data);
      const res = response.items.data[0];

      const fetchCategory = filter.message.order.items[0].category_ids[0];
      const fetchCategoryQuery = `query
{
 categories (filters:{id:{in:[${fetchCategory}]}})
 {
   data
   {
     id
     attributes
     {
       category_code
       value
     }
   }
 }
}`;
      const categoryresponse = await makeGraphQLRequest(fetchCategoryQuery);
      const catData = categoryresponse.data.categories.data[0];
      const itemDataOrder: any = {
        provider: {
          id: res?.attributes?.provider?.data?.id,
          descriptor: {
            name: res?.attributes?.provider?.data?.attributes?.provider_name
              ? res?.attributes?.provider?.data?.attributes?.provider_name
              : "",
            short_desc: res?.attributes?.provider?.data?.attributes?.short_desc
              ? res?.attributes?.provider?.data?.attributes?.short_desc
              : "",
            long_desc: res?.attributes?.provider?.data?.attributes?.long_desc
              ? res?.attributes?.provider?.data?.attributes?.long_desc
              : "",
            additional_desc: {
              url: res?.attributes?.provider?.data?.attributes?.provider_uri
                ? res?.attributes?.provider?.data?.attributes?.provider_uri
                : "http://abc.com/image.jpg",
            },
            images: [
              {
                url: res?.attributes?.provider?.logo?.data?.attributes?.url
                  ? res?.attributes?.provider?.logo?.data?.attributes?.url
                  : "http://abc.com/image.jpg",
              },
            ],
          },
          categories: [
            {
              id: catData.id,
              descriptor: {
                code: catData.attributes.category_code,
                name: catData.attributes.value,
              },
            },
          ],
        },
        items: [
          {
            id: res.id,
            descriptor: {
              name: res.attributes.name,
              code: res.attributes.code,
              long_desc: res.attributes.long_desc,
              short_desc: res.attributes.short_desc,
              images: [
                {
                  url: res?.attributes?.image?.data[0]?.attributes?.url
                    ? res?.attributes?.image?.data[0]?.attributes?.url
                    : "https://imgs.search.brave.com/HJwyZoG5OILiz5APZC6fTdryfIWTfYBw7azIWCFNOag/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9zdDIu/ZGVwb3NpdHBob3Rv/cy5jb20vMTcwMTY1/MS83MTkxL2kvNjAw/L2RlcG9zaXRwaG90/b3NfNzE5MTUxOTEt/c3RvY2stcGhvdG8t/YXJiaXRyYXRpb24t/Y29uY2VwdC5qcGc",
                },
              ],
            },
            category_ids: filter.message.order.items[0].category_ids,
          },
        ],
        xinput: {
          form: {
            url: `${config.ADAPTER_BASE_URL}/x-input/form`,
            mime_type: "text/html",
          },
        },
        quote: {
          price: {
            value: res?.attributes?.sc_retail_product?.data?.attributes
              ?.min_price
              ? res?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
              : "0",
            currency: res?.attributes?.sc_retail_product?.data?.attributes
              ?.currency
              ? res?.attributes?.sc_retail_product?.data?.attributes?.currency
              : "INR",
          },
          breakup: [
            {
              title: "Base fee",
              price: {
                value: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.base_fee
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                    ?.base_fee
                  : "0",
                currency: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.currency
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                    ?.currency
                  : "INR",
              },
            },
            {
              title: "Fee per hearing",
              price: {
                value: "500",
                currency: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.currency
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                    ?.currency
                  : "INR",
              },
            },
          ],
        },
      };

      const billing: any = filter.message.order.billing;
      const fulfillmentDetail: any = filter.message.order.fulfillments;

      itemDataOrder["billing"] = billing;
      itemDataOrder["fulfillments"] = fulfillmentDetail;
      const itemData = {
        order: itemDataOrder,
      };

      const result = {
        context: filter.context,
        message: itemData,
      };
      return result;
    }

    const output = {
      context: filter.context,
      message: filter.message,
    };
    return output;
  }
}
