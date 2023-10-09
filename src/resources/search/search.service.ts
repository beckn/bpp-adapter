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

  const categoryResponse = await makeGraphQLRequest(queryStr)
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

  const query = `query {
    ${table} (
      ${queryFilters}
    )
    ${fields}
  }`;

  const response = await makeGraphQLRequest(query);

  return response;
};

export const search = async (filter: any) => {
  try {
    const commerceWorkFlow = config.ECOMMERCE.split(",");
    const appointmentWorkFlow = config.APPOINTMENT.split(",");
    const category = filter.message.intent.category;
    const domainFilterQuery = `domain_id:{DomainName:{eq:"${filter.context.domain}"}}`;
    filter.context["action"] = "on_search";
    filter.context["bpp_id"] =
      "beckn-strapi-sandbox-bpp-network.becknprotocol.io";
    filter.context["bpp_uri"] =
      "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";
    if (commerceWorkFlow.includes(filter.context.domain)) {
      console.log("ENTER LOGICC");
      const result = await itemFilter(
        filter.message.intent,
        domainFilterQuery,
        queryFields,
        queryTable
      );
      //Filter the request payload items from items array
      const providers = result.data.providers.data;
      function containsValue(item: any, values: any) {
        const name = item.attributes.name.toLowerCase();
        return values.some((value: any) => name.includes(value.toLowerCase()));
      }
      const requestPayloadItem = filter.message.intent.item.descriptor.name
        .split(",")
        .filter(Boolean);
      // Use the filter method to filter the items based on the request payload.This happens when provider lists all the items under them
      const filteredItems = providers.reduce((result: any, obj: any) => {
        const filteredData = obj.attributes.items.data.filter((item: any) =>
          containsValue(item, requestPayloadItem)
        );
        if (filteredData.length > 0) {
          result.push({
            id: obj.id,
            provider_name: obj.attributes.provider_name,
            short_desc: obj.attributes.short_desc,
            long_desc: obj.attributes.long_desc,
            provider_uri: obj.attributes.provider_uri,
            category_ids: obj.attributes.category_ids,
            domain_id: obj.attributes.category_ids,
            location_id: obj.attributes.location_id,
            logo: obj.attributes.logo,
            items: filteredData,
          });
        }
        return result;
      }, []);
      console.log("FILTEROP:::", JSON.stringify(filteredItems));
      //Fetch tag ids of item
      const fetchTagId = filteredItems
        .flatMap((provider: any) =>
          provider.items.flatMap((item: any) =>
            item.attributes.cat_attr_tag_relations.data
              .filter(
                (tagTaxonomy: any) => tagTaxonomy.attributes.taxanomy === "TAG"
              )
              .map((tagTaxonomy: any) => ({
                itemId: item.id,
                tagId: tagTaxonomy.attributes.taxanomy_id,
              }))
          )
        )
        .reduce((accumulator: any, currentValue: any) => {
          const existingItem = accumulator.find(
            (item: any) => item.itemId === currentValue.itemId
          );
          if (existingItem) {
            existingItem.tagIds.push(currentValue.tagId);
          } else {
            accumulator.push({
              itemId: currentValue.itemId,
              tagIds: [currentValue.tagId],
            });
          }
          return accumulator;
        }, []);

      console.log("Grouped Tag Data:", JSON.stringify(fetchTagId));

      //Fetch tag details of an item
      const tagData = await Promise.all(
        fetchTagId.map(async (item: any) => {
          const tagQuery = `query {
          tags (filters:{id:{in:[${item.tagIds}]}}){
            data{
              id
              attributes
              {
                tag_name
                tag_group_id
                {
                  data
                  {
                    id
                    attributes
                    {
                      tag_group_name
                    }
                  }
                }
              }
            }
          }
        }
    
          `;
          const tag = await makeGraphQLRequest(tagQuery);
          return {
            itemId: item.itemId,
            tag: tag.data.tags.data,
          };
        })
      );
      console.log("tagData", JSON.stringify(tagData));

      //Fetch categoryids of an item
      const fetchCatId = filteredItems
        .flatMap((provider: any) =>
          provider.items.flatMap((item: any) =>
            item.attributes.cat_attr_tag_relations.data
              .filter(
                (catTaxonomy: any) =>
                  catTaxonomy.attributes.taxanomy === "CATEGORY"
              )
              .map((catTaxonomy: any) => ({
                itemId: item.id,
                catId: catTaxonomy.attributes.taxanomy_id,
              }))
          )
        )
        .reduce((accumulator: any, currentValue: any) => {
          const existingItem = accumulator.find(
            (item: any) => item.itemId === currentValue.itemId
          );
          if (existingItem) {
            existingItem.catIds.push(currentValue.catId);
          } else {
            accumulator.push({
              itemId: currentValue.itemId,
              catIds: [currentValue.catId],
            });
          }
          return accumulator;
        }, []);
      console.log("Grouped Cat Data:", JSON.stringify(fetchCatId));

      //Fetch category details of an item
      const catData = await Promise.all(
        fetchCatId.map(async (item: any) => {
          const catQuery = `query {
      categories (filters:{id:{in:[${item.catIds}]}}){
        data{
          id
          attributes
          {
            value
            parent_id
            {
              data{
                id
                attributes
                {
                  value
                }
              }
            }
          }
  
        }
      }
}`;
          const cat = await makeGraphQLRequest(catQuery);
          return {
            itemId: item.itemId,
            cat: cat.data.categories.data,
          };
        })
      );
      console.log("catData", JSON.stringify(catData));
      console.log("FILTEROP1:::", JSON.stringify(filteredItems));

      //Add tags to item array
      const itemTagsMap = new Map();

      tagData.forEach((tagDetail) => {
        const { itemId, tag } = tagDetail;
        itemTagsMap.set(itemId, tag);
      });
      const providersWithTags = filteredItems.map((provider: any) => ({
        ...provider,
        items: provider.items.map((item: any) => ({
          ...item,
          tags: itemTagsMap.get(item.id) || [], // Default to an empty array if no tags are found
        })),
      }));
      console.log("providersWithTags", JSON.stringify(providersWithTags));

       //Add categories to item array
      const itemTagsCatMap = new Map();
      catData.forEach((catDetail) => {
        const { itemId, cat } = catDetail;
        itemTagsCatMap.set(itemId, cat);
      });
      const providersWithTagsAndCat = providersWithTags.map((provider: any) => ({
        ...provider,
        items: provider.items.map((item: any) => ({
          ...item,
          categories: itemTagsCatMap.get(item.id) || [], // empty array if no tags are found
        })),
      }));
      console.log("providersWithCatTags", JSON.stringify(providersWithTagsAndCat));


  
      return {
        context: filter.context,
        message: {
          catalog: {
            descriptor: {
              name: "BPP",
              code: "bpp",
              short_desc: "Unified Strapi BPP",
            },
            providers: providersWithTagsAndCat.map((e: any) => {
              return {
                id: e.id,
                descriptor: {
                  name: e?.provider_name ? e?.provider_name : "",
                  short_desc: e?.short_desc ? e?.short_desc : "",
                  long_desc: e?.long_desc ? e?.long_desc : "",
                  additional_desc: {
                    url: e?.provider_uri ? e?.provider_uri : "http://abc.com/image.jpg",
                  },
                  images: [
                    {
                      url: e?.logo?.data?.attributes?.url
                        ? e?.logo?.data?.attributes?.url
                        : "http://abc.com/image.jpg",
                    },
                  ],
                },
             //Add categories for provider if exists
                ...(e?.category_ids?.data && e.category_ids.data.length > 0
                  ? {
                      categories: e.category_ids.data.map((cat:any) => {
                        // Check if attributes.value exists
                        return cat.attributes && cat.attributes.value
                          ? {
                              id: cat.id,
                              descriptor: {
                                name: cat.attributes.value,
                              },
                            }
                          : null; // Return null for categories with missing attributes.value
                      }).filter(Boolean), // Remove null values from the array
                    }
                  : {}),
            
             //Add locations for provider if exist
                ...(e.location_id && e.location_id.data
                ? {
                    locations: [
                      {
                        id: e?.location_id?.data?.id ? e?.location_id?.data?.id : "",
                        address: e?.location_id?.data?.attributes?.address
                          ? e?.location_id?.data?.attributes?.address
                          : "",
                        city: {
                          name: e?.location_id?.data?.attributes?.city
                            ? e?.location_id?.data?.attributes?.city
                            : "",
                        },
                        country: {
                          name: e?.location_id?.data?.attributes?.country
                            ? e?.location_id?.data?.attributes?.country
                            : "",
                        },
                        state: {
                          name: e?.location_id?.data?.attributes?.state
                            ? e?.location_id?.data?.attributes?.state
                            : "",
                        },
                        area_code: e?.location_id?.data?.attributes?.zip
                          ? e?.location_id?.data?.attributes?.zip.toString()
                          : "",
                      },
                    ],
                  }
                : {}),
                fulfillments: [
                  {
                    id: "FUL_58741444",
                    type: "SCHOLARSHIP",
                    tracking: false,
                    contact: {
                      phone: "9876543210",
                      email: "maryg@xyz.com"
                    },
                    stops: [
                      {
                        type: "APPLICATION-START",
                        time: {
                          timestamp: "2023-01-01T00:00:00.000Z"
                        }
                      },
                      {
                        type: "APPLICATION-END",
                        time: {
                          timestamp: "2023-03-31T00:00:00.000Z"
                        }
                      }
                    ]
                  }
                ],
                rateable:true,
                items:e.items.map((item:any)=>{
                  return{
                    id:item?.id,
                    descriptor:{
                      name:item?.attributes?.name?item?.attributes?.name:"",
                      code:item?.attributes?.code?item?.attributes?.code:"",
                      short_desc:item?.attributes?.short_desc?item?.attributes?.short_desc:"",
                      long_desc:item?.attributes?.long_desc?item?.attributes?.long_desc:"",
                      //check if images exist for item if so then add
                      ...(item?.attributes?.image?.data && item?.attributes?.image.data.length > 0
                        ? {
                          images: item.attributes.image.data.map((img:any) => {
                              // Check if attributes.value exists
                              return img.attributes && img.attributes.url
                                ? {
                                  url:img.attributes.url
                                  }
                                : null; // Return null for categories with missing attributes.value
                            }).filter(Boolean), // Remove null values from the array
                          }
                        : {}),
                    },
                    rateable:true,
                    price: {
                            value: item?.attributes?.sc_retail_product?.data
                              ?.attributes?.min_price
                              ? item?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
                              : "0",
                            currency: item?.attributes?.sc_retail_product?.data
                              ?.attributes?.currency
                              ? item?.attributes?.sc_retail_product?.data?.attributes
                                  ?.currency
                              : "INR",
                          },
                          quantity: {
                            available: {
                              count: item?.attributes?.sc_retail_product?.data
                                ?.attributes?.stock_quantity
                                ? item?.attributes?.sc_retail_product?.data
                                    ?.attributes?.stock_quantity
                                : 0,
                            },
                          },
                    category_ids:item.categories.map((cat:any)=>
                      
                        cat?.id?cat?.id:""
                      
                    ),
                    fulfillment_ids:["FUL_58741444"],
                    tags:item.tags.map((tag:any)=>{
                   return{
                    display:true,
                    descriptor:{
                      description:tag?.attributes?.tag_group_id?.data?.attributes?.tag_group_name?tag?.attributes?.tag_group_id?.data?.attributes?.tag_group_name:""
                    },
                    list:[
                   {
                    value:tag?.attributes?.tag_name?tag?.attributes?.tag_name:"",
                    display:true
                   }
                    ]
                   }
                    })

                  }
                })
              };
            }),
          },
        },
      };
    } else if (appointmentWorkFlow.includes(filter.context.domain)) {
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
