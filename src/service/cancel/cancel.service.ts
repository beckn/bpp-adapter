import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";

@injectable()
export class CancelService {
  constructor() {}

  async cancel(filter: any) {
    const query = `query {
        orders (filters:{id:{in:[${filter.message.order_id.toString()}]}})
        {
          data
          {
            id
            attributes
            {
              status
              items
              {
                data
                {
                  id
                  attributes
                     {
              name
                    long_desc
                    short_desc
                    code
                    provider
                    {
                      data{
                        id
                        attributes
                        {
                          provider_id
                          provider_uri
                          provider_name
                          short_desc
                          long_desc
                          domain_id{
                            data
                            {
                              id
                              attributes
                              {
                                DomainName
                              }
                            }
                            
                          }
                          location_id{
                            data{
                              id
                              attributes
                              {
                                address
                                city
                                state
                                country
                                zip
                              }
                            }
                          }
                          logo{
                            data{
                              id
                              attributes
                              {url}
                            }
                          }
                          category_ids{
                            data
                            {
                              id
                            attributes{
                              category_code
                              value
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
                          
                          sku
                          virtual
                          downloadable
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
              cat_attr_tag_relations
              {
                data
                {
                  id
                  attributes
                  {
                   taxanomy
                    taxanomy_id
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
    const res = response.orders.data[0].attributes.items.data[0];
    const fulfilmentQuery = `query{
        itemFulfillments (filters:{item_id:{id:{in:[${response.orders.data[0].attributes.items.data[0].id.toString()}]}}})
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
      }`;
    const fulfillmentResponse = await makeGraphQLRequest(fulfilmentQuery);
    const fulfillmentData = fulfillmentResponse.data.itemFulfillments.data;
    const output = {
      context: filter.context,
      message: {
        order: {
          id: filter.message.order_id,
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
                  url: res?.attributes?.provider?.data?.attributes?.logo?.data
                    ?.attributes?.url
                    ? res?.attributes?.provider?.data?.attributes?.logo?.data
                        ?.attributes?.url
                    : "http://abc.com/image.jpg",
                },
              ],
            },
            ...(res?.attributes?.provider?.data?.attributes?.category_ids
              ?.data &&
            res?.attributes?.provider?.data?.attributes?.category_ids.data
              .length > 0
              ? {
                  categories:
                    res?.attributes?.provider?.data?.attributes?.category_ids.data
                      .map((cat: any) => {
                        // Check if attributes.value exists
                        return cat.attributes && cat.attributes.value
                          ? {
                              id: cat.id,
                              descriptor: {
                                code: cat.attributes.category_code,
                                name: cat.attributes.value,
                              },
                            }
                          : null; // Return null for categories with missing attributes.value
                      })
                      .filter(Boolean), // Remove null values from the array
                }
              : {}),
            // categories: [{
            //   id: catData.id,
            //   descriptor: {
            //     code: catData.attributes.category_code,
            //     name: catData.attributes.value,
            //   },
            // }],
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
              category_ids: res?.attributes?.cat_attr_tag_relations?.data?.map(
                (e: any) => e.attributes.taxanomy_id
              ),
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
                ? res?.attributes?.sc_retail_product?.data?.attributes?.currency
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
                value: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.additional_fee
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                      ?.additional_fee
                  : "0",
                currency: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.currency
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                      ?.currency
                  : "INR",
              },
            },
          ],
          cancellation_terms: [
            {
              fulfillment_state: {
                descriptor: {
                  code: res?.attributes?.sc_retail_product?.data?.attributes
                    ?.product_cancel?.data[0]?.attributes?.state
                    ? res?.attributes?.sc_retail_product?.data?.attributes
                        ?.product_cancel?.data[0]?.attributes?.state
                    : "Initiated",
                },
              },
              cancellation_fee: {
                percentage: res?.attributes?.sc_retail_product?.data?.attributes
                  ?.product_cancel?.data[0]?.attributes?.cancel_term_id?.data
                  ?.attributes?.cancellation_fee
                  ? res?.attributes?.sc_retail_product?.data?.attributes
                      ?.product_cancel?.data[0]?.attributes?.cancel_term_id
                      ?.data?.attributes?.cancellation_fee
                  : "25%",
              },
              external_ref: {
                mimetype: "text/html",
                url: "https://alpha.in/charge/tnc.html",
              },
            },
          ],
          fulfillments: [
            {
              //customer:filter.message.order.fulfillments[0].customer,

              agent: {
                person: {
                  id: fulfillmentData[0]?.attributes?.fulfilment_id?.data
                    .attributes?.agent_id?.data?.id,
                  name: fulfillmentData[0]?.attributes?.fulfilment_id?.data
                    .attributes?.agent_id?.data?.attributes?.first_name,
                },
                contact: {
                  phone:
                    fulfillmentData[0]?.attributes?.fulfilment_id?.data
                      .attributes?.agent_id?.data?.attributes?.agent_profile
                      ?.data?.attributes?.phone_number,
                  email:
                    fulfillmentData[0]?.attributes?.fulfilment_id?.data
                      .attributes?.agent_id?.data?.attributes?.agent_profile
                      ?.data?.attributes?.email,
                },
              },
              state: {
                descriptor: {
                  code: fulfillmentData[0]?.attributes?.state,
                  name: "Dispute Order Confirmed",
                },
                updated_at: fulfillmentData[0]?.attributes?.updated_at,
              },
              stops: [
                {
                  instructions: {
                    name: "Instructions after order confirm",
                    short_desc:
                      "Navigate to the following provider link to continue the order",
                    media: [
                      {
                        url: "https://alpha-odr-network-bpp.becknprotocol.io/dispute",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    };
    return output;
  }
}
