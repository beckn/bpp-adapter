import httpStatus from "http-status";
import { makeGraphQLRequest } from "../utils/api";
import { queryFields } from "../../template/retail/search/searchItemProvider.template";
import { queryTable } from "../../template/retail/search/searchItemProvider.template";
import { queryFieldsCatTax } from "../../template/retail/search/searchCatTax.template";
import { queryTableCatTax } from "../../template/retail/search/searchCatTax.template";
import config from "../../config";
const generateItemFilterQuery = (item: any) => {
  const query = item.descriptor.name
    .split(",")
    .map((name: string) => {
      return `{item_id:{name:{contains:"${name}"}}}`;
    })
    .join(",");
  return `or:[${query}]`;
};

const generateProviderFilterQuery = (provider: any) => {
  const query = provider.descriptor.name
    .split(",")
    .map((name: string) => {
      return `{ item_id: { provider_id: { provider_name: { contains: "${name}" } } } }`;
    })
    .join(",");
  return `or:[${query}]`;
};

const generateItemProviderQueryCombo = (
  domainFilterQuery: string,
  providerFilterQuery: string,
  itemFilterQuery: string
) => {
  if (providerFilterQuery === `` && itemFilterQuery === ``) {
    return `filters:{${domainFilterQuery}}`;
  }
  if (providerFilterQuery === `` && itemFilterQuery !== ``) {
    return `filters:{${domainFilterQuery} ${itemFilterQuery}}`;
  }
  if (providerFilterQuery !== `` && itemFilterQuery === ``) {
    return `filters:{${domainFilterQuery} ${providerFilterQuery}}`;
  }
  if (providerFilterQuery !== `` && itemFilterQuery !== ``) {
    return `filters:{${domainFilterQuery}and:[{${providerFilterQuery}},{${itemFilterQuery}}]}`;
  }
  return ``;
};

const catAttrFilter = async (filter: any, domainFilterQuery: string) => {
  const categoryQuery = `categories(filters:{value:{in:[ ${filter.category.descriptor.name
    .split(",")
    .map((str: string) => `"${str.trim()}"`)
    .join(",")} ]}})`;

  const queryStr = `{${categoryQuery}
  {
    data
    {
      id
      attributes
      {
        value
        parent_id{
          data
          
          {
            id
            attributes{
              value
            }
          }
        }
      }
    }
  }
}`;
  const categoryResponse = await makeGraphQLRequest(queryStr)
    .then((res) => res.data)
    .then((res) => res.categories)
    .then((res) => res.data);
  console.log("Category Response", categoryResponse);

  const catIds = categoryResponse.reduce((accum: number[], val: any) => {
    let ids = [val.id];
    if (val.attributes.parent_id.data) {
      ids.push(val.attributes.parent_id.data.id);
    }
    return accum.concat(ids);
  }, []);


  const queryFilters = `
      filters: 
        {
          taxanomy: { contains:"TAG" } 
          taxanomy_id:{ in: [${catIds
            .map((str: string) => `"${str.trim()}"`)
            .join(",")}] }
          and: [
            ${
              filter.item
                ? "{" + generateItemFilterQuery(filter.item) + "},"
                : ""
            }
            ${
              filter.provider
                ? "{" + generateProviderFilterQuery(filter.provider) + "},"
                : ""
            }
            {${domainFilterQuery}}
          ]
        }
      
  `;

  const query = `query {
    ${queryTableCatTax} (
      ${queryFilters}
    )
    ${queryFieldsCatTax}
  }`;
  const response = await makeGraphQLRequest(query)

  return response
};

const scProductFilter = async (filter: any, domainFilterQuery: string) => {
  const queryFilters = generateItemProviderQueryCombo(
    domainFilterQuery,
    filter.provider ? generateProviderFilterQuery(filter.provider) : ``,
    filter.item ? generateItemFilterQuery(filter.item) : ``
  );

  //     id
  //     attributes{
  //       sku
  //       downloadable
  //       min_price
  //       max_price
  //       on_sale
  //       stock_quantity
  //       stock_status
  //       rating_count
  //       average_rating
  //       total_sales
  //       tax_class
  //       virtual
  //       item_id{
  //         data{
  //           id
  //           attributes{
  //             name
  //             short_desc
  //             long_desc
  //             provider_id{
  //               data{
  //                 id
  //                 attributes{
  //                   provider_name
  //                   short_desc
  //                   long_desc
  //                   domain_id{
  //                     data{
  //                       id
  //                       attributes{
  //                         DomainName
  //                       }
  //                     }
  //                   }
  //                   location_id{
  //                     data{
  //                       id
  //                       attributes{
  //                         address
  //                         city
  //                         state
  //                         country
  //                         zip
  //                       }
  //                     }
  //                   }
  //                   logo{
  //                     data
  //                     {
  //                       id
  //                       attributes{
  //                         url
  //                       }
  //                     }
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }`;

  const query = `query {
    ${queryTable} (
      ${queryFilters}
    )
    ${queryFields}
  }`;

  const response = await makeGraphQLRequest(query);
  console.log("responsE::", response);

  return response;
};

export const search = async (filter: any) => {
  try {
    const commerceWorkFlow=config.ECOMMERCE.split(',')
    const appointmentWorkFlow=config.APPOINTMENT.split(',')

    if(commerceWorkFlow.includes(filter.context.domain))
    {
      const domainFilterQuery = `item_id:{provider_id:{domain_id:{DomainName:{eq:"${filter.context.domain}"}}}}`;
      const category = filter.message.intent.category;
      if (category) {
        const result =  await catAttrFilter(filter.message.intent, domainFilterQuery);
        const queryResponse =result.data.catAttrTagRelations.data
        return queryResponse.map((res: any) => {
          const item_id = res.attributes.item_id;
          return {
            context: filter.context,
            message: {
              catalog: {
                descriptor: {
                  name: item_id.data.attributes.name,
                  short_desc: item_id.data.attributes.short_desc,
                  long_desc: item_id.data.attributes.long_desc,
                  additional_desc: {
                    url: item_id.data.attributes.additional_desc
                      ? item_id.data.attributes.additional_desc
                      : "",
                  },
                  images: [
                    {
                      url: item_id.data.attributes.provider_id.data.attributes
                        .logo.data.attributes.url,
                    },
                  ],
                },
                providers: [
                  {
                    Provider: {
                      id: item_id.data.attributes.provider_id.data.id,
                      descriptor: {
                        name: item_id.data.attributes.provider_id.data
                          .attributes.provider_name,
                      },
                      short_desc:
                        item_id.data.attributes.provider_id.data.attributes
                          .short_desc,
                      long_desc:
                        item_id.data.attributes.provider_id.data.attributes
                          .long_desc,
                      additional_desc: item_id.data.attributes.provider_id.data
                        .attributes.additional_desc
                        ? item_id.data.attributes.additional_desc
                        : "",
                      categories: item_id.data.attributes.provider_id.data
                        .attributes.category
                        ? item_id.data.attributes.category
                        : "",
                      locations:
                        item_id.data.attributes.provider_id.data.attributes
                          .location_id.data.attributes,
                      items: [
                        {
                          item: {
                            rating: res.attributes.item_id.data.attributes.sc_retail_product.data.attributes.rating_count,
                            quantity: res.attributes.item_id.data.attributes.sc_retail_product.data.attributes.stock_quantity,
                            price: {
                              minimum_value: res.attributes.item_id.data.attributes.sc_retail_product.data.attributes.min_price,
                              maximum_value: res.attributes.item_id.data.attributes.sc_retail_product.data.attributes.max_price,
                            },
                            descriptor: {
                              name: item_id.data.attributes.name,
                              short_desc: item_id.data.attributes.short_desc,
                              long_desc: item_id.data.attributes.long_desc,
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              }
            }
          }
        })
      } 
      else {
       
        const result = await scProductFilter(
          filter.message.intent,
          domainFilterQuery
        );
        const queryResponse = result.data.scProducts.data;
        
        filter.context["action"] = "on_search";
        return {
          responseData: queryResponse.map((res: any) => {
            const item_id = res.attributes.item_id;
            return {
              context: filter.context,
              message: {
                catalog: {
                  descriptor: {
                    name: item_id.data.attributes.name,
                    short_desc: item_id.data.attributes.short_desc,
                    long_desc: item_id.data.attributes.long_desc,
                    additional_desc: {
                      url: item_id.data.attributes.additional_desc
                        ? item_id.data.attributes.additional_desc
                        : "",
                    },
                    images: [
                      {
                        url: item_id.data.attributes.provider_id.data.attributes
                          .logo.data.attributes.url,
                      },
                    ],
                  },
                  providers: [
                    {
                      Provider: {
                        id: item_id.data.attributes.provider_id.data.id,
                        descriptor: {
                          name: item_id.data.attributes.provider_id.data
                            .attributes.provider_name,
                        },
                        short_desc:
                          item_id.data.attributes.provider_id.data.attributes
                            .short_desc,
                        long_desc:
                          item_id.data.attributes.provider_id.data.attributes
                            .long_desc,
                        additional_desc: item_id.data.attributes.provider_id.data
                          .attributes.additional_desc
                          ? item_id.data.attributes.additional_desc
                          : "",
                        categories: item_id.data.attributes.provider_id.data
                          .attributes.category
                          ? item_id.data.attributes.category
                          : "",
                        locations:
                          item_id.data.attributes.provider_id.data.attributes
                            .location_id.data.attributes,
                        items: [
                          {
                            item: {
                              rating: res.attributes.average_rating,
                              quantity: res.attributes.stock_quantity,
                              price: {
                                minimum_value: res.attributes.min_price,
                                maximum_value: res.attributes.max_price,
                              },
                              descriptor: {
                                name: item_id.data.attributes.name,
                                short_desc: item_id.data.attributes.short_desc,
                                long_desc: item_id.data.attributes.long_desc,
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            };
          }),
        };
      }
    }
   
  } catch (error: any) {
    throw new Error(error.message);
  }
};
