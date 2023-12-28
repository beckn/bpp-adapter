import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import { DOMAIN } from "../../constants";

@injectable()
export class ConfirmService {
  constructor() { }

  async confirm(filter: any) {
    if (filter.context.domain.trim() === DOMAIN) {
      const itemArray = filter.message.order.items;
      const itemValue = itemArray.map((obj: { id: string }) => `"${obj.id}"`);
      const currentDate = new Date();
      const isoString = currentDate.toISOString();

      const queryMutation = `mutation {
          createOrder(
            data: {
             status:"ACTIVE"
              items: [${itemValue.toString()}]
              publishedAt:"${isoString}"
            }
          ) {
            data {
              id
              attributes {
               status
              }
            }
          }
        }`

      const confirmResponse = await makeGraphQLRequest(queryMutation)

      const order_id = confirmResponse.data.createOrder.data.id;
      //Fetch Fulfillment information
      const fulfilmentQuery = `query{
    itemFulfillments (filters:{item_id:{id:{in:[${itemValue.toString()}]}}})
    {
      data
      {
        id
        attributes
        {
          state
          fulfilment_id
          {
            data
            {
              id
              attributes
              {
                agent_id
                {
                  data
                  {
                    id
                    attributes
                    {
                      first_name
                      description
                      agent_fees
                      agent_profile
                      {
                        data
                        {
                          id
                          attributes
                          {
                            
                            email
                            phone_number
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          item_id
          {
            data
            {
              id
            }
          }
        }
      }
      
    }
  }`
      const fulfillmentResponse = await makeGraphQLRequest(fulfilmentQuery);
      const fulfillmentData = fulfillmentResponse.data.itemFulfillments.data

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
                    additional_fee
                    product_cancel
                    {
                      data
                      {
                        id
                        attributes
                        {
                          state
                          cancel_term_id
                          {
                            data
                            {
                              id
                              attributes
                              {
                                cancel_within
                                cancel_eligible
                                description
                                cancellation_fee
                              }
                            }
                          }
                        }
                      }
                    }
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
      const output = {
        context: filter.context,
        message: {
          order: {
            id: order_id,
            provider: {
              id: res?.attributes?.provider?.data?.id,
              descriptor: {
                name: res?.attributes?.provider?.data?.attributes?.provider_name
                  ? res?.attributes?.provider?.data?.attributes?.provider_name
                  : "",
                short_desc: res?.attributes?.provider?.data?.attributes
                  ?.short_desc
                  ? res?.attributes?.provider?.data?.attributes?.short_desc
                  : "",
                long_desc: res?.attributes?.provider?.data?.attributes
                  ?.long_desc
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
              categories: [{
                id: catData.id,
                descriptor: {
                  code: catData.attributes.category_code,
                  name: catData.attributes.value,
                },
              }],
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
            quote: {
              price: {
                value: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.min_price
                  ? res?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
                  : "0",
                currency: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.currency
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                    ?.currency
                  : "INR",
              },
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
                  currency: res?.attributes?.sc_retail_product?.data
                    ?.attributes?.currency
                    ? res?.attributes?.sc_retail_product?.data?.attributes
                      ?.currency
                    : "INR",
                },
              },
              {
                title: "Fee per hearing",
                price: {
                  value: res?.attributes?.sc_retail_product?.data?.attributes
                    ?.additional_fee
                    ? res?.attributes?.sc_retail_product?.data?.attributes
                      ?.additional_fee
                    : "0",
                  currency: res?.attributes?.sc_retail_product?.data
                    ?.attributes?.currency
                    ? res?.attributes?.sc_retail_product?.data?.attributes
                      ?.currency
                    : "INR",
                },
              },
            ],
            billing: filter.message.order.billing,
            cancellation_terms: [
              {
                fulfillment_state: {
                  descriptor: {
                    code: res?.attributes?.sc_retail_product?.data?.attributes?.product_cancel?.data[0]?.attributes?.state ? res?.attributes?.sc_retail_product?.data?.attributes?.product_cancel?.data[0]?.attributes?.state : "Initiated"
                  }
                },
                cancellation_fee: {
                  percentage: res?.attributes?.sc_retail_product?.data?.attributes?.product_cancel?.data[0]?.attributes?.cancel_term_id?.data?.attributes?.cancellation_fee ? res?.attributes?.sc_retail_product?.data?.attributes?.product_cancel?.data[0]?.attributes?.cancel_term_id?.data?.attributes?.cancellation_fee : "25%"
                },
                external_ref: {
                  mimetype: "text/html",
                  url: "https://alpha.in/charge/tnc.html"
                }
              }
            ],
            payments: filter.message.order.payments,
            fulfillments: [
              {
                customer: filter.message.order.fulfillments[0].customer,

                agent: {
                  person: {
                    id: fulfillmentData[0]?.attributes?.fulfilment_id?.data.attributes?.agent_id?.data?.id,
                    name: fulfillmentData[0]?.attributes?.fulfilment_id?.data.attributes?.agent_id?.data?.attributes?.first_name
                  },
                  contact: {
                    phone: fulfillmentData[0]?.attributes?.fulfilment_id?.data.attributes?.agent_id?.data?.attributes?.agent_profile?.data?.attributes?.phone_number,
                    email: fulfillmentData[0]?.attributes?.fulfilment_id?.data.attributes?.agent_id?.data?.attributes?.agent_profile?.data?.attributes?.email
                  }
                },
                state: {
                  descriptor: {
                    code: fulfillmentData[0]?.attributes?.state,
                    "name": "Dispute Order Confirmed"
                  },
                  updated_at: fulfillmentData[0]?.attributes?.updated_at
                },
                stops: [
                  {
                    "instructions": {
                      "name": "Instructions after order confirm",
                      "short_desc": "Navigate to the following provider link to continue the order",
                      "media": [
                        {
                          "url": "https://alpha-odr-network-bpp.becknprotocol.io/dispute"
                        }
                      ]
                    }
                  }
                ]

              }
            ]
          },
        },
      };
      return output;
    }





    const itemArray = filter.message.order.items;
    const itemValue = itemArray.map((obj: { id: string }) => `"${obj.id}"`);

    const currentDate = new Date();
    const isoString = currentDate.toISOString();


    const query = `mutation {
          createOrder(
            data: {
             status:"ACTIVE"
              items: [${itemValue.toString()}]
              publishedAt:"${isoString}"
            }
          ) {
            data {
              id
              attributes {
               status
              }
            }
          }
        }`

    const confirmResponse = await makeGraphQLRequest(query);
    const output = {
      context: filter.context,
      message:
      {
        order: {
          id: confirmResponse.data.createOrder.data.id,
          status: confirmResponse.data.createOrder.data.attributes.status,
          ...filter.message.order
        }
      }
    }
    return output;
  };
}


