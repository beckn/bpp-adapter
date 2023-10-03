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
exports.search = void 0;
const api_1 = require("../utils/api");
const searchItemProvider_template_1 = require("../../template/ecommerce/search/searchItemProvider.template");
const searchItemProvider_template_2 = require("../../template/ecommerce/search/searchItemProvider.template");
const searchCatTax_template_1 = require("../../template/ecommerce/search/searchCatTax.template");
const searchCatTax_template_2 = require("../../template/ecommerce/search/searchCatTax.template");
const config_1 = __importDefault(require("../../config"));
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
    const categoryResponse = yield (0, api_1.makeGraphQLRequest)(queryStr)
        .then((res) => res.data)
        .then((res) => res.categories)
        .then((res) => res.data);
    console.log("Category Response", categoryResponse);
    const catIds = categoryResponse.reduce((accum, val) => {
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
      
  `;
    const query = `query {
    ${searchCatTax_template_2.queryTableCatTax} (
      ${queryFilters}
    )
    ${searchCatTax_template_1.queryFieldsCatTax}
  }`;
    const response = yield (0, api_1.makeGraphQLRequest)(query);
    return response;
});
const scProductFilter = (filter, domainFilterQuery) => __awaiter(void 0, void 0, void 0, function* () {
    const queryFilters = generateItemProviderQueryCombo(domainFilterQuery, filter.provider ? generateProviderFilterQuery(filter.provider) : ``, filter.item ? generateItemFilterQuery(filter.item) : ``);
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
    ${searchItemProvider_template_2.queryTable} (
      ${queryFilters}
    )
    ${searchItemProvider_template_1.queryFields}
  }`;
    const response = yield (0, api_1.makeGraphQLRequest)(query);
    console.log("responsE::", response);
    return response;
});
const search = (filter) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const commerceWorkFlow = config_1.default.ECOMMERCE.split(',');
        const appointmentWorkFlow = config_1.default.APPOINTMENT.split(',');
        if (commerceWorkFlow.includes(filter.context.domain)) {
            const domainFilterQuery = `item_id:{provider_id:{domain_id:{DomainName:{eq:"${filter.context.domain}"}}}}`;
            const category = filter.message.intent.category;
            if (category) {
                const result = yield catAttrFilter(filter.message.intent, domainFilterQuery);
                const queryResponse = result.data.catAttrTagRelations.data;
                return queryResponse.map((res) => {
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
                    };
                });
            }
            else {
                const result = yield scProductFilter(filter.message.intent, domainFilterQuery);
                const queryResponse = result.data.scProducts.data;
                filter.context["action"] = "on_search";
                filter.context["bpp_id"] = "beckn-strapi-sandbox-bpp-network.becknprotocol.io";
                filter.context["bpp_uri"] = "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";
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
        else {
        }
    }
    catch (error) {
        throw new Error(error.message);
    }
});
exports.search = search;
//# sourceMappingURL=search.service.js.map