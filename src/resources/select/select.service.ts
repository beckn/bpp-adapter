import { makeGraphQLRequest } from "../utils/api";
import { retailQueryFields } from "../../template/retail/select/selectItem.template";
import { retailQueryTable } from "../../template/retail/select/selectItem.template";
import { serviceQueryFields } from "../../template/service/select/selectItem.template";
import { serviceQueryTable } from "../../template/service/select/selectItem.template";
import config from "../../config";
const selectItem = async (itemValue: any, fields: string, table: string) => {
  const queryFilter = `filters:{id:{in:[${itemValue}]}}`;
  const query = `query {
        ${table} (
          ${queryFilter}
        )
        ${fields}
      }`;
  const response = await makeGraphQLRequest(query).then((res) => res.data);
  return response;
};

export const select = async (filter: any) => {
  try {
    console.log(filter);
    const itemArray = filter.message.order.items;
    console.log(itemArray);
    const itemValue = itemArray.map((obj: { id: string }) => obj.id);
    console.log(itemValue);
    const commerceWorkFlow = config.ECOMMERCE.split(",");
    if (commerceWorkFlow.includes(filter.context.domain)) {
      const result = await selectItem(
        itemValue,
        retailQueryFields,
        retailQueryTable
      );

      const res = result.items.data[0];
      const filteredData: any =
        res.attributes.cat_attr_tag_relations.data.filter(
          (item: { attributes: { taxanomy: string } }) =>
            item.attributes.taxanomy === "TAG" ||
            item.attributes.taxanomy === "CATEGORY"
        );
      console.log("fetchTag", filteredData);
      const tagIds: string[] = filteredData
        .filter(
          (item: { attributes: { taxanomy: string } }) =>
            item.attributes.taxanomy === "TAG"
        )
        .map(
          (item: { attributes: { taxanomy_id: any } }) =>
            item.attributes.taxanomy_id
        );

      const categoryIds: string[] = filteredData
        .filter(
          (item: { attributes: { taxanomy: string } }) =>
            item.attributes.taxanomy === "CATEGORY"
        )
        .map(
          (item: { attributes: { taxanomy_id: any } }) =>
            item.attributes.taxanomy_id
        );
          const tagQuery=`query {
            tags (filters:{id:{in:[${tagIds}]}}){
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
      
            `

            const catQuery= `query {
              categories (filters:{id:{in:[${categoryIds}]}}){
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
  }`
      const tag= await makeGraphQLRequest(tagQuery)
      const category= await makeGraphQLRequest(catQuery)

      console.log("TAGRESULT:::",tag)
      console.log("CATEGORY::",category)
      // const fun = (keys: string[], sourceObj: any, destinationObj: any) => {
      //   return keys.reduce((acc: any, val: string) =>{
      //     if(sourceObj[val]){
      //       acc[val] = sourceObj[val]
      //     }
      //     return acc
      //   }, destinationObj)
      // };
      filter.context["action"] = "on_select";

      filter.context["bpp_id"] =
        "beckn-strapi-sandbox-bpp-network.becknprotocol.io";

      filter.context["bpp_uri"] =
        "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";
      const output = {
        context: filter.context,
        responses: [
          {
            context: filter.context,
            message: {
              order: {
                provider: res.attributes.provider_id,
                id: res.attributes.provider_id.data.id,
                descriptor: {
                  name: res.attributes.provider_id.data.attributes
                    .provider_name,
                },
                fulfillments: [
                  {
                    id: "",
                    type: "",
                    tracking: "",
                    contact: {
                      phone: "",
                      email: "",
                    },
                    stops: [
                      {
                        type: "",
                        time: {
                          timestamp: "",
                        },
                      },
                    ],
                  },
                ],
                locations: [
                  {
                    id: res.attributes.provider_id.data.attributes.location_id
                      .data.id,
                    city: {
                      name: res.attributes.provider_id.data.attributes
                        .location_id.data.attributes.city,
                    },
                  },
                ],

                items: [
                  {
                    id: res.id,
                    parent_item_id: "",
                    descriptor: {
                      name: res.attributes.name,
                      long_desc: res.attributes.long_desc,
                      images: [
                        {
                          url: res.attributes.provider_id.data.attributes.logo
                            .data.attributes.url,
                        },
                      ],
                    },
                    price: {
                      currency:
                        res.attributes.sc_retail_product.data.attributes
                          .currency,
                      value:
                        res.attributes.sc_retail_product.data.attributes
                          .min_price,
                    },
                    category_ids: category.data.categories.data.map((e:any)=>{return e.attributes.value}),
                    fulfillment_ids: [],
                    location_ids: [res.attributes.provider_id.data.attributes.location_id
                      .data.id],
                    recommended: "",
                    time: {
                      label: "",
                      duration: "",
                      range: {
                        start: "",
                        end: "",
                      },
                    },

                    rating:
                      res.attributes.sc_retail_product.data.attributes.rating,
                    rateable: true,
                    tags: tag.data.tags.data.map((e:any)=>{return{
                        descriptor:{
                          name:e.attributes.tag_name
                        },
                        list:[{
                          descriptor:{
                            name:e.attributes.tag_group_id.data.attributes.tag_group_name
                          }
                        }]
                    }})
                    
                    
                  },
                ],
              },
            },
          },
        ],
      };
      return output;
    } else {
      const result = await selectItem(
        itemValue,
        serviceQueryFields,
        serviceQueryTable
      );
      console.log(result);
      return result;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};
