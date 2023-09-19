import httpStatus from "http-status";

import AppError from "../../library/exception";
import axiosInstance from "axios";
import https from "https";
import qs from "qs";

const axios = axiosInstance.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const apiUrl = "https://strapi.becknprotocol.io/graphql";

const apiToken =
  "1b8e2e1f6ce05a6cdae76863c630c6656be19450efdc8fa7196774cb368065c8fbee1b4cdfe8c39fb46d207b7241dc64ece560bc95270c3376dcd7fbe24cf44cd3869737ffcce3bbcb992e3313a183f20a18cbb73fbea9f696a3c852dcc55f4ed70be2f74983f609f7117a2f53c587408838d908a50f0a9597215fb7880111b3";

const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/JSON",
};

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

  const categoryResponse = await axios
    .post(
      apiUrl,
      {
        query: `{${categoryQuery}
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
          }`,
      },
      {
        headers,
      }
    )
    .then((res) => res.data)
    .then((res) => res.data)
    .then((res) => res.categories)
    .then((res) => res.data);

  const catIds = categoryResponse.reduce((accum: number[], val: any) => {
    let ids = [val.id];
    if (val.attributes.parent_id.data) {
      ids.push(val.attributes.parent_id.data.id);
    }
    return accum.concat(ids);
  }, []);

  const queryFields = `
    {
      data
      {
        id
        attributes{
          taxanomy
          taxanomy_id
          item_id
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
                provider_id
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
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

  const query = `
      catAttrTagRelations(filters: 
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
      )
  `;

  console.log(query);

  const response = await axios
    .post(
      apiUrl,
      {
        query: `{${query}${queryFields}}`,
      },
      {
        headers,
      }
    )
    .then((res) => res.data);

  return response;
};

const scProductFilter = async (filter: any, domainFilterQuery: string) => {
  const queryFilters = generateItemProviderQueryCombo(
    domainFilterQuery,
    filter.provider ? generateProviderFilterQuery(filter.provider) : ``,
    filter.item ? generateItemFilterQuery(filter.item) : ``
  );
  const queryFields = `{
    data {
      id
      attributes{
        sku
        downloadable
        min_price
        max_price
        on_sale
        stock_quantity
        stock_status
        rating_count
        average_rating
        total_sales
        tax_class
        virtual
        item_id{
          data{
            id
            attributes{
              name
              short_desc
              long_desc
              provider_id{
                data{
                  id
                  attributes{
                    provider_name
                    short_desc
                    long_desc
                    domain_id{
                      data{
                        id
                        attributes{
                          DomainName
                        }
                      }
                    }
                    location_id{
                      data{
                        id
                        attributes{
                          address
                          city
                          state
                          country
                          zip
                        }
                      }
                    }
                    logo{
                      data
                      {
                        id
                        attributes{
                          url
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

  const query = `query {
    scProducts (
      ${queryFilters}
    )
    ${queryFields}
  }`;

  const response = await axios
    .post(
      apiUrl,
      {
        query,
      },
      {
        headers,
      }
    )
    .then((res) => res.data);

  // return response;
  return response.data.scProducts.data;
};

export const search = async (filter: any) => {
  try {
    const domainFilterQuery = `item_id:{provider_id:{domain_id:{DomainName:{eq:"${filter.context.domain}"}}}}`;
    console.log("filter.message.intent", filter.message.intent);
    const category = filter.message.intent.category;
    if (category) {
      return catAttrFilter(filter.message.intent, domainFilterQuery);
    } else {
      const queryResponse = await scProductFilter(
        filter.message.intent,
        domainFilterQuery
      );

      // return queryResponse;
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
                  additional_desc: item_id.data.attributes.additional_desc
                    ? item_id.data.attributes.additional_desc
                    : "",
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
                            rating:
                              res.attributes.average_rating,
                            quantity:
                              res.attributes.stock_quantity,
                            price: {
                              minimum_value:
                                res.attributes.min_price,
                              maximum_value:
                                res.attributes.max_price,
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
  } catch (error) {
    console.log(error);
    throw new Error("SONETHING WENT WRONG");
  }
};


