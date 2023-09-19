"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search1 = exports.search = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const axios = axios_1.default.create({
    httpsAgent: new https_1.default.Agent({
        rejectUnauthorized: false,
    }),
});
const apiUrl = "https://strapi.becknprotocol.io/graphql";
const apiToken = "1b8e2e1f6ce05a6cdae76863c630c6656be19450efdc8fa7196774cb368065c8fbee1b4cdfe8c39fb46d207b7241dc64ece560bc95270c3376dcd7fbe24cf44cd3869737ffcce3bbcb992e3313a183f20a18cbb73fbea9f696a3c852dcc55f4ed70be2f74983f609f7117a2f53c587408838d908a50f0a9597215fb7880111b3";
const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/JSON",
};
const generateItemFilterQuery = (item) => {
    const query = item.descriptor.name
        .split(",")
        .map((name) => {
        return `{item_id:{name:{contains:"${name}"}}}`;
    })
        .join(",");
    return `or:[${query}]`;
};
const generateProviderFilterQuery = (provider) => {
    const query = provider.descriptor.name
        .split(",")
        .map((name) => {
        return `{ item_id: { provider_id: { provider_name: { contains: "${name}" } } } }`;
    })
        .join(",");
    return `or:[${query}]`;
};
const generateItemProviderQueryCombo = (domainFilterQuery, providerFilterQuery, itemFilterQuery) => {
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
const catAttrFilter = (filter, domainFilterQuery) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryQuery = `categories(filters:{value:{in:[ ${filter.category.descriptor.name
        .split(",")
        .map((str) => `"${str.trim()}"`)
        .join(",")} ]}})`;
    const categoryResponse = yield axios
        .post(apiUrl, {
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
    }, {
        headers,
    })
        .then((res) => res.data)
        .then((res) => res.data)
        .then((res) => res.categories)
        .then((res) => res.data);
    const catIds = categoryResponse.reduce((accum, val) => {
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
        .map((str) => `"${str.trim()}"`)
        .join(",")}] }
          and: [
            ${filter.item
        ? "{" + generateItemFilterQuery(filter.item) + "},"
        : ""}
            ${filter.provider
        ? "{" + generateProviderFilterQuery(filter.provider) + "},"
        : ""}
            {${domainFilterQuery}}
          ]
        }
      )
  `;
    console.log(query);
    const response = yield axios
        .post(apiUrl, {
        query: `{${query}${queryFields}}`,
    }, {
        headers,
    })
        .then((res) => res.data);
    return response;
});
const scProductFilter = (filter, domainFilterQuery) => __awaiter(void 0, void 0, void 0, function* () {
    const queryFilters = generateItemProviderQueryCombo(domainFilterQuery, filter.provider ? generateProviderFilterQuery(filter.provider) : ``, filter.item ? generateItemFilterQuery(filter.item) : ``);
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
    const response = yield axios
        .post(apiUrl, {
        query,
    }, {
        headers,
    })
        .then((res) => res.data);
    // return response;
    return response.data.scProducts.data;
});
const search = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const domainFilterQuery = `item_id:{provider_id:{domain_id:{DomainName:{eq:"${filter.context.domain}"}}}}`;
        console.log("filter.message.intent", filter.message.intent);
        const category = filter.message.intent.category;
        if (category) {
            return catAttrFilter(filter.message.intent, domainFilterQuery);
        }
        else {
            const queryResponse = yield scProductFilter(filter.message.intent, domainFilterQuery);
            // return queryResponse;
            return {
                responseData: queryResponse.map((res) => {
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
                                            short_desc: item_id.data.attributes.provider_id.data.attributes
                                                .short_desc,
                                            long_desc: item_id.data.attributes.provider_id.data.attributes
                                                .long_desc,
                                            additional_desc: item_id.data.attributes.provider_id.data
                                                .attributes.additional_desc
                                                ? item_id.data.attributes.additional_desc
                                                : "",
                                            categories: item_id.data.attributes.provider_id.data
                                                .attributes.category
                                                ? item_id.data.attributes.category
                                                : "",
                                            locations: item_id.data.attributes.provider_id.data.attributes
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
    catch (error) {
        console.log(error);
        throw new Error("SONETHING WENT WRONG");
    }
});
exports.search = search;
const search1 = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiUrl = "https://strapi.becknprotocol.io/graphql";
        const apiToken = "1b8e2e1f6ce05a6cdae76863c630c6656be19450efdc8fa7196774cb368065c8fbee1b4cdfe8c39fb46d207b7241dc64ece560bc95270c3376dcd7fbe24cf44cd3869737ffcce3bbcb992e3313a183f20a18cbb73fbea9f696a3c852dcc55f4ed70be2f74983f609f7117a2f53c587408838d908a50f0a9597215fb7880111b3";
        const category = filter.message.intent.category;
        if (category) {
            const categoryResponse = yield axios
                .post(apiUrl, {
                query: `{
            categories(filters:{value:{eq:"${category.descriptor.name}"}})
            
          }`,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + apiToken,
                },
            })
                .then((res) => res.data)
                .then((res) => res.data)
                .then((res) => res.categories)
                .then((res) => res.data);
            const catIds = categoryResponse.reduce((accum, val) => {
                let ids = [val.id];
                if (val.attributes.parent_id.data) {
                    ids.push(val.attributes.parent_id.data.id);
                }
                return accum.concat(ids);
            }, []);
            const fullResponse = yield axios
                .post(apiUrl, {}, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + apiToken,
                },
            })
                .then((res) => res.data);
            return fullResponse;
        }
        const item = filter.message.intent.item;
        let itemFilterQuery = ``;
        if (item) {
            const query = item.descriptor.name
                .split(",")
                .map((name) => {
                return `{item_id:{name:{contains:"${name}"}}}`;
            })
                .join(",");
            itemFilterQuery = `or:[${query}]`;
        }
        const provider = filter.message.intent.provider;
        let providerFilterQuery = ``;
        if (provider) {
            const query = provider.descriptor.name
                .split(",")
                .map((name) => {
                return `{ item_id: { provider_id: { provider_name: { contains: "${name}" } } } }`;
            })
                .join(",");
            providerFilterQuery = `or:[${query}]`;
        }
        const domainFilterQuery = `item_id:{provider_id:{domain_id:{DomainName:{eq:"${filter.context.domain}"}}}}`;
        let filterQuery = ``;
        if (providerFilterQuery === `` && itemFilterQuery === ``) {
            filterQuery = `filters:{${domainFilterQuery}}`;
        }
        if (providerFilterQuery === `` && itemFilterQuery !== ``) {
            filterQuery = `filters:{${domainFilterQuery} ${itemFilterQuery}}`;
        }
        if (providerFilterQuery !== `` && itemFilterQuery === ``) {
            filterQuery = `filters:{${domainFilterQuery} ${providerFilterQuery}}`;
        }
        if (providerFilterQuery !== `` && itemFilterQuery !== ``) {
            filterQuery = `filters:{${domainFilterQuery}and:[{${providerFilterQuery}},{${itemFilterQuery}}]}`;
        }
        console.log("filterQuery:::", filterQuery);
        const query = `query {
        scProducts (
          ${filterQuery}
        )
        {
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
        }
      }`;
        const response = yield axios
            .post(apiUrl, {
            query,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + apiToken,
            },
        })
            .then((res) => res.data);
        const queryResponse = response.data.scProducts.data;
        // console.log("responseData::", queryResponse);
        return {
            responseData: queryResponse.map((res) => {
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
                                media: item_id.data.attributes.provider_id.data.attributes.logo.data
                                    .attributes.url,
                            },
                            providers: {
                                id: item_id.data.attributes.provider_id.data.id,
                                descriptor: {
                                    name: item_id.data.attributes.provider_id.data.attributes
                                        .provider_name,
                                },
                                short_desc: item_id.data.attributes.provider_id.data.attributes
                                    .short_desc,
                                long_desc: item_id.data.attributes.provider_id.data.attributes.long_desc,
                                additional_desc: item_id.data.attributes.provider_id.data
                                    .attributes.additional_desc
                                    ? item_id.data.attributes.additional_desc
                                    : "",
                                categories: item_id.data.attributes.provider_id.data.attributes
                                    .category
                                    ? item_id.data.attributes.category
                                    : "",
                                locations: item_id.data.attributes.provider_id.data.attributes
                                    .location_id.data.attributes,
                                items: {
                                    minimum_price: item_id.data.attributes.min_price,
                                    maximum_price: item_id.data.attributes.max_price,
                                },
                            },
                        },
                    },
                };
            }),
        };
    }
    catch (error) {
        console.log(error);
        throw new Error("SONETHING WENT WRONG");
    }
});
exports.search1 = search1;
//# sourceMappingURL=search.service.js.map