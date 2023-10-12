import { makeGraphQLRequest } from "../utils/api";
import { retailQueryFields } from "../../template/retail/select/selectItem.template";
import { retailQueryTable } from "../../template/retail/select/selectItem.template";
import { serviceQueryFields } from "../../template/service/select/selectItem.template";
import { serviceQueryTable } from "../../template/service/select/selectItem.template";
import {fulfillments_scholarship} from "../../template/fulfillment/fulfillment_scholarship"
import{fulfillments_jobs} from"../../template/fulfillment/fulfillment_jobs"
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
    const commerceWorkFlow = config.ECOMMERCE.split(",");
    //const appointmentWorkFlow = config.APPOINTMENT.split(",");
    if (commerceWorkFlow.includes(filter.context.domain))
    {
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
        console.log("RESULT:::",JSON.stringify(res))
       
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
        
        console.log("tag",JSON.stringify(tag))
        console.log("CAT",JSON.stringify(category))
        filter.context["action"] = "on_select";
  
        filter.context["bpp_id"] =
          "beckn-strapi-sandbox-bpp";
  
        filter.context["bpp_uri"] =
          "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";
        const output = {
            context:filter.context,
              message: {
             order:{
              provider:{
                id:res?.attributes?.provider?.data?.id,
                descriptor:{
                  name:res?.attributes?.provider?.data?.attributes?.provider_name?res?.attributes?.provider?.data?.attributes?.provider_name: "",
                  short_desc:res?.attributes?.provider?.data?.attributes?.short_desc?res?.attributes?.provider?.data?.attributes?.short_desc: "",
                  long_desc:res?.attributes?.provider?.data?.attributes?.long_desc?res?.attributes?.provider?.data?.attributes?.long_desc: "",
                  additional_desc: {
                    url:res?.attributes?.provider?.data?.attributes?.provider_uri?res?.attributes?.provider?.data?.attributes?.provider_uri: "http://abc.com/image.jpg",
                  },
                  images: [
                    {
                      url:res?.attributes?.provider?.logo?.data?.attributes?.url?res?.attributes?.provider?.logo?.data?.attributes?.url
                        : "http://abc.com/image.jpg",
                    },
                  ],
                },
                fullfillments:filter.context.domain==="dsep:jobs"?fulfillments_jobs
                :filter.context.domain==="dsep:scholarships"?fulfillments_scholarship:"",
                //Add if location exists
                ...(res.attributes.provider.data.attributes.location_id && res.attributes.provider.data.attributes.location_id.data
                  ? {
                      locations: [
                        {
                          id: res?.attributes?.provider?.data?.attributes?.location_id?.data?.id ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.id : "",
                          address: res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.address
                            ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.address
                            : "",
                          city: {
                            name: res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.city
                              ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.city
                              : "",
                          },
                          country: {
                            name: res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.country
                              ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.country
                              : "",
                          },
                          state: {
                            name: res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.state
                              ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.state
                              : "",
                          },
                          area_code: res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.zip
                            ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.attributes?.zip.toString()
                            : "",
                        },
                      ],
                    }
                  : {}),
       
                   //Add categories for provider if exists
                   ...(category?.data?.categories?.data && category?.data?.categories?.data.length > 0
                    ? {
                        categories: category.data.categories.data.map((cat:any) => {
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
              },
              items:[
                {
                  id:res.id,
                  descriptor:{
                    name:res.attributes.name,
                    long_desc:res.attributes.long_desc,
                    short_desc:res.attributes.short_desc
                  },
                  //Add category ids if exists
                  ...(category?.data?.categories?.data && category?.data?.categories?.data.length > 0
                    ? {
                      category_ids: category?.data?.categories?.data.map((cat:any) => cat.id) }
                      
                    : {}),
                  //Add location id if exists
                  ...(res.attributes.provider.data.attributes.location_id && res.attributes.provider.data.attributes.location_id.data
                    ? {
                        location_ids: [
                           res?.attributes?.provider?.data?.attributes?.location_id?.data?.id ? res?.attributes?.provider?.data?.attributes?.location_id?.data?.id : "",
                        ],
                      }
                    : {}),
                    fulfillment_ids:filter.context.domain==="dsep:jobs"?fulfillments_jobs.map((ful:any)=>ful.id)
                    :filter.context.domain==="dsep:scholarships"?fulfillments_scholarship.map((ful:any)=>ful.id):"",
                    xinput: {
                      "required": true,
                      "form": {
                        "url": "http://localhost:8001/public/getForm/a9aaecca-10b7-4d19-b640-022723112309/da0052a822dc4cdf95ab136b5614d0c9",
                        "mime_type": "text/html"
                      }
                    },
                    price: {
                      value: res?.attributes?.sc_retail_product?.data
                        ?.attributes?.min_price
                        ? res?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
                        : "0",
                      currency: res?.attributes?.sc_retail_product?.data
                        ?.attributes?.currency
                        ? res?.attributes?.sc_retail_product?.data?.attributes
                            ?.currency
                        : "INR",
                    },
                    quantity: {
                      available: {
                        count: res?.attributes?.sc_retail_product?.data
                          ?.attributes?.stock_quantity
                          ? res?.attributes?.sc_retail_product?.data
                              ?.attributes?.stock_quantity
                          : 0,
                      },
                    },
                    //Add tags if exists
                    
                   ...(tag?.data?.tags?.data && tag?.data?.tags?.data.length > 0
                    ? {
                  
                        tags: tag.data.tags.data.map((tg:any) => {
                          // Check if attributes.value exists
                          return tg.attributes 
                            ? {
                              display:true,
                              descriptor:{
                                description:tg?.attributes?.tag_name?tg?.attributes?.tag_name:""
                              },
                              list:[
                             {
                              value:tg?.attributes?.tag_group_id?.data?.attributes?.tag_group_name?tg?.attributes?.tag_group_id?.data?.attributes?.tag_group_name:"",
                              display:true
                             }
                              ]
                              }
                            : null; // Return null for categories with missing attributes.value
                        }).filter(Boolean), // Remove null values from the array
                      }
                    : {}),
                }
              ]
             }
              },
            
          
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
    }
   
  } catch (error: any) {
    throw new Error(error.message);
  }
};
