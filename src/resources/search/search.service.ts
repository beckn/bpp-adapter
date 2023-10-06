import { makeGraphQLRequest } from "../utils/api";
import { queryFields } from "../../template/retail/search/searchItemProvider.template";
import { queryTable } from "../../template/retail/search/searchItemProvider.template";
import { queryFieldsCatTax } from "../../template/retail/search/searchCatTax.template";
import { queryTableCatTax } from "../../template/retail/search/searchCatTax.template";
import { serviceQueryFields } from "../../template/service/search/searchItemProvider.template";
import { serviceQueryTable } from "../../template/service/search/searchItemProvider.template";
import { serviceQueryFieldsCatTax } from "../../template/service/search/searchCatTax.template";
import { serviceQueryTableCatTax } from "../../template/service/search/searchCatTax.template";
import config from "../../config";
const generateItemFilterQuery = (item: any) => {
  const query = item.descriptor.name
    .split(",")
    .map((name: string) => {
      return `{items:{name:{contains:"${name}"}}}`;
    })
    .join(",");
  return `or:[${query}]`;
};

const generateProviderFilterQuery = (provider: any) => {
  const query = provider.descriptor.name
    .split(",")
    .map((name: string) => {
      return ` { provider_name: { contains: "${name}" } }`;
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

const catAttrFilter = async (
  filter: any,
  domainFilterQuery: string,
  fields: string,
  table: string
) => {
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
  console.log("CATEGORY QUERY", queryStr);
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
          taxanomy: { contains:"CAT" } 
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
    ${table} (
      ${queryFilters}
    )
    ${fields}
  }`;
  const response = await makeGraphQLRequest(query);

  return response;
};

const itemFilter = async (
  filter: any,
  domainFilterQuery: string,
  fields: string,
  table: string
) => {
  const queryFilters = generateItemProviderQueryCombo(
    domainFilterQuery,
    filter.provider ? generateProviderFilterQuery(filter.provider) : ``,
    filter.item ? generateItemFilterQuery(filter.item) : ``
  );
  console.log("QueryFILTERS:::", queryFilters);
  const query = `query {
    ${table} (
      ${queryFilters}
    )
    ${fields}
  }`;

  const response = await makeGraphQLRequest(query);
  console.log("responsE::", response);

  return response;
};

export const search = async (filter: any) => {
  try {
    const commerceWorkFlow = config.ECOMMERCE.split(",");
    const appointmentWorkFlow = config.APPOINTMENT.split(",");
    const category = filter.message.intent.category;
    const domainFilterQuery = `domain_id:{DomainName:{eq:"${filter.context.domain}"}}`;
    if (commerceWorkFlow.includes(filter.context.domain)) {
      if (category) {
        const result = await catAttrFilter(
          filter.message.intent,
          domainFilterQuery,
          queryFieldsCatTax,
          queryTableCatTax
        );
        const queryResponse = result.data.catAttrTagRelations.data;
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
                        additional_desc: item_id.data.attributes.provider_id
                          .data.attributes.additional_desc
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
                              rating:
                                res.attributes.item_id.data.attributes
                                  .sc_retail_product.data.attributes
                                  .rating_count,
                              quantity:
                                res.attributes.item_id.data.attributes
                                  .sc_retail_product.data.attributes
                                  .stock_quantity,
                              price: {
                                minimum_value:
                                  res.attributes.item_id.data.attributes
                                    .sc_retail_product.data.attributes
                                    .min_price,
                                maximum_value:
                                  res.attributes.item_id.data.attributes
                                    .sc_retail_product.data.attributes
                                    .max_price,
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
      } else {
        console.log("ENTER LOGICC")
        const result = await itemFilter(
          filter.message.intent,
          domainFilterQuery,
          queryFields,
          queryTable
        );
        const queryResponse = result.data.providers.data;
        console.log(queryResponse);
        filter.context["action"] = "on_search";

        filter.context["bpp_id"] =
          "beckn-strapi-sandbox-bpp-network.becknprotocol.io";

        filter.context["bpp_uri"] =
          "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";
        return {
          context: filter.context,
          message: {
            catalog: {
              descriptor: {
                name: "BPP",
                code: "bpp",
                short_desc: "Unified Strapi BPP",
              },
              providers: queryResponse.map((e: any) => {
                return {
                  id: e.id,
                  descriptor: {
                    name: e?.attributes?.provider_name?e?.attributes?.name:"",
                    short_desc: e?.attributes?.short_desc?e?.attributes?.short_desc:"",
                  },
                    categories: e?.attributes?.category_ids?.data.map(
                      (cat: any) => {
                        return {
                          id:cat?.attributes?.value
                        };
                      }
                    ),
                    items: e?.attributes?.items?.data?.map((item: any) => {
                      return {
                        id: item.id,
                        description: {
                          name: item.attributes.name,
                          long_desc: item.attributes.long_desc,
                          short_desc: item.attributes.short_desc,
                          code: item.attributes.code,
                        },
                        price: {
                          minimum_value:
                            item?.attributes?.sc_retail_product?.data?.attributes?.min_price?item?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString():"0",
                          currency:
                            item?.attributes?.sc_retail_product?.data?.attributes?.currency?item?.attributes?.sc_retail_product?.data?.attributes?.currency:"INR"
                        },
                        quantity: {
                          available: {
                            count:
                              item?.attributes?.sc_retail_product?.data?.attributes?.stock_quantity?item?.attributes?.sc_retail_product?.data?.attributes?.stock_quantity:0
                          },
                        }
                      };
                    }),
                  
                };
              }),
            },
          },
        };
      }
    } else if (appointmentWorkFlow.includes(filter.context.domain))
     {
      if (category) {
        const result = await catAttrFilter(
          filter.message.intent,
          domainFilterQuery,
          serviceQueryFieldsCatTax,
          serviceQueryTableCatTax
        );
        return result;
      } else {
        const result = await itemFilter(
          filter.message.intent,
          domainFilterQuery,
          serviceQueryFields,
          serviceQueryTable
        );
        const queryResponse = result.data.services.data;
        console.log("queryResponse::", queryResponse);

        console.log(
          "queryResponse::item_id",
          queryResponse[0].attributes.item_id
        );
        // console.log(
        //   "queryResponse::item_id:::provider_id",
        //   queryResponse[0].attributes.item_id.data.attributes.provider_id
        // );
        // console.log(
        //   "queryResponse::item_id:::provider_id:::location_id",
        //   queryResponse[0].attributes.item_id.data.attributes.provider_id.data
        //     .attributes.location_id
        // );
        // console.log(
        //   "queryResponse::item_id:::provider_id::category_ids",
        //   queryResponse[0].attributes.item_id.data.attributes.provider_id.data
        //     .attributes.category_ids
        // );
        // console.log(
        //   "queryResponse::item_id:::provider_id::category_ids::attributes",
        //   queryResponse[0].attributes.item_id.data.attributes.provider_id.data
        //     .attributes.category_ids.data[0].attributes
        // );
        // console.log("queryResponse::agent_id", queryResponse[0].attributes.agent_id);
        // console.log("queryResponse::agent_id::agent_profile", queryResponse[0].attributes.agent_id.data.attributes.agent_profile);
        // console.log("queryResponse::agent_id::locations", queryResponse[0].attributes.agent_id.data.attributes.locations);
        return {
          responseData: queryResponse.map((res: any) => {
            const item_id = res.attributes.item_id;
            const agent_id = res.attributes.agent_id;
            return {
              context: filter.context,
              message: {
                catalog: {
                  descriptor: {
                    name: item_id.data.attributes.name,
                    code: item_id.data.attributes.code,
                    short_desc: item_id.data.attributes.short_desc,
                    long_desc: item_id.data.attributes.long_desc,
                  },
                  fulfillments: [
                    {
                      agent: {
                        person: {
                          name: agent_id.data.attributes.first_name,
                          image: "",
                          gender: "",
                          skills:
                            agent_id.data.attributes.agent_profile.data
                              .attributes.qualification,
                        },
                        contact: {
                          phone: "",
                          email: "",
                        },
                      },
                    },
                  ],
                  providers: [
                    {
                      id: item_id.data.attributes.provider_id.data.attributes
                        .provider_id,
                      descriptor: {
                        name: item_id.data.attributes.provider_id.data
                          .attributes.provider_name,
                        code: "",
                        short_desc: "",
                        long_desc: "",
                      },
                      categories:
                        item_id.data.attributes.provider_id.data.attributes.category_ids.data.map(
                          (eve: any) => {
                            return {
                              description: eve.attributes.value,
                              id: eve.id,
                              parent_category_id: eve.attributes.parent_id.data,
                            };
                          }
                        ),
                    },
                  ],
                  locations: [
                    {
                      address:
                        item_id.data.attributes.provider_id.data.attributes
                          .location_id.data.attributes.address,
                      city: item_id.data.attributes.provider_id.data.attributes
                        .location_id.data.attributes.city,
                      state:
                        item_id.data.attributes.provider_id.data.attributes
                          .location_id.data.attributes.state,
                      country:
                        item_id.data.attributes.provider_id.data.attributes
                          .location_id.data.attributes.country,
                    },
                  ],
                  items: [
                    {
                      descriptor: {
                        name: item_id.data.attributes.name,
                        code: item_id.data.attributes.code,
                        short_desc: item_id.data.attributes.short_desc,
                        long_desc: item_id.data.attributes.long_desc,
                      },
                      creator: {
                        descriptor: {
                          name: agent_id.data.attributes.first_name,
                          code: agent_id.data.id,
                          short_desc: agent_id.data.attributes.description,
                          long_desc: "",
                        },
                      },
                      price: {
                        value: res.attributes.service_fee,
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
