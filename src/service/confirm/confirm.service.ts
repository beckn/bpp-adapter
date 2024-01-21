import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import { AppLogger } from "../../app/app.logger";
import config from "../../config";
import {
  retailQueryFields,
  retailQueryTable,
} from "../../template/retail/confirm/confirmItem.template";

@injectable()
export class ConfirmService {
  constructor() {}

  async confirm(filter: any) {
    try {
      const commerceWorkFlow = config.ECOMMERCE.split(",");
      if (commerceWorkFlow.includes(filter.context.domain)) {
        const appLogger = new AppLogger();
        let customerID = "";
        const itemArray = filter.message.order.items;
        const itemValue = itemArray.map((obj: { id: string }) => `"${obj.id}"`);
        const currentDate = new Date();
        const isoString = currentDate.toISOString();
        const billing = filter.message.order.billing;
        const shipping = filter.message.order.fulfillments[0].stops[0].location;
        const billingName = billing?.name ? billing.name : "";
        const billingAddress = billing?.address ? billing?.address : "";
        const billingState = billing?.state?.name
          ? billing?.state?.name
          : billing?.state?.code;
        const billingCity = billing?.city?.name
          ? billing?.city?.name
          : billing?.city?.code;
        const billingEmail = billing?.email ? billing?.email : "";
        const billingPhone = billing?.phone ? billing?.phone : "";
        const billingCode = billing?.area_code ? billing?.area_code : "";
        const tax_id = billing?.tax_id ? billing?.tax_id : "";

        const mutateOrder = `mutation {
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
          }`;

        const orderResponse = await makeGraphQLRequest(mutateOrder);

        const order_id = orderResponse.data.createOrder.data.id;
        appLogger.info("Order Id is created", order_id);

        const MutateOrderAdress = `mutation {
        createOrderAddress(
          data: {
            order_id:${order_id}
            first_name:"${billingName}"
            address_line_1:"${billingAddress}"
            state:"${billingState}"
            city:"${billingCity}"
            email:"${billingEmail}"
            phone:"${billingPhone}"
            publishedAt:"${isoString}"
            postcode:"${billingCode}"
            tax_id:"${tax_id}"
          }
        ) {
          data {
            id
            attributes {
             first_name
           
            }
          }
        }
      }`;
        const orderAddressResponse = await makeGraphQLRequest(
          MutateOrderAdress
        );
        appLogger.info(
          "Billing Address is inserted into DB",
          orderAddressResponse
        );

        const custEmail =
          filter.message.order.fulfillments[0].customer.contact.email;
        appLogger.info("To check the customer email in DB");

        const queryCustEmail = `query {
      customers(filters:{email:{eq:"${custEmail}"}})
      {
       data
       {
          id
        }
      }
    
      }`;

        const custEmailResponse = await makeGraphQLRequest(queryCustEmail);
        customerID = custEmailResponse?.data?.customers?.data[0]?.id
          ? custEmailResponse?.data?.customers?.data[0]?.id
          : "";
        if (customerID === "" || customerID === undefined) {
          const queryMutationCustomer = ` mutation{
      createCustomer (data:{
        first_name:"${filter.message.order.fulfillments[0].customer.person.name}"
        email:"${filter.message.order.fulfillments[0].customer.contact.email}"
        contact:"${filter.message.order.fulfillments[0].customer.contact.phone}"
        publishedAt:"${isoString}"
      })
      {
        data
        {
          id
        }
      }
    }
  `;
          const createCustomerResponse = await makeGraphQLRequest(
            queryMutationCustomer
          );
          customerID = createCustomerResponse.data.createCustomer.data.id;
          appLogger.debug("Customer Created", createCustomerResponse);
        }

        const mutateShippingLocation = `mutation{
      createOrderFulfillmentLocation (data:{
       gps:"${shipping?.gps ? shipping?.gps : ""}",
        city_name:"${shipping?.city?.name ? shipping?.city?.name : ""}"
        city_code:"${shipping?.city?.code ? shipping?.city?.code : ""}"
        state_code:"${shipping?.state?.name ? shipping?.state?.name : ""}"
        state_name:"${shipping?.state?.code ? shipping?.state?.code : ""}"
        country_name:"${shipping?.country?.name ? shipping?.country?.name : ""}"
        country_code:"${shipping?.country?.code ? shipping?.country?.code : ""}"
        area_code:"${shipping?.area_code ? shipping?.area_code : ""}"
        address:"${shipping?.address ? shipping?.address : ""}"
        publishedAt:"${isoString}"
      })
      {
        data
        {
          id
        }
      }
    }
  `;

        const shippingLocationResponse = await makeGraphQLRequest(
          mutateShippingLocation
        );
        const shippingLocationId =
          shippingLocationResponse.data.createOrderFulfillmentLocation.data.id;

        const mutateOrderFulfillment = `mutation{
    createOrderFulfillment (data:{
     fulfilment_id:${filter.message.order.fulfillments[0].id}
       order_id:${order_id}
      customer_id:${customerID}
      order_fulfillment_location_id:${shippingLocationId}
      publishedAt:"${isoString}"
      
      
     
    })
    {
      data
      {
        id
      }
    }
  }`;
        const OrderFulfillmentResponse = await makeGraphQLRequest(
          mutateOrderFulfillment
        );

        const result = await this.confirmItem(
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
        const tagQuery = `query {
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
  
        `;

        const catQuery = `query {
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
  }`;
        const tag = await makeGraphQLRequest(tagQuery);
        const category = await makeGraphQLRequest(catQuery);

        const response = result.items.data;
        const resProvider = result.items.data[0].attributes.provider.data;
        const providerData = {
          id: resProvider?.id,
          descriptor: {
            name: resProvider?.attributes?.provider_name
              ? resProvider.attributes?.provider_name
              : "",
            short_desc: resProvider?.attributes?.short_desc
              ? resProvider?.attributes?.short_desc
              : "",
            long_desc: resProvider?.attributes?.long_desc
              ? resProvider?.attributes?.long_desc
              : "",
            additional_desc: {
              url: resProvider?.attributes?.provider_uri
                ? resProvider?.attributes?.provider_uri
                : "http://abc.com/image.jpg",
            },
            images: [
              {
                url: resProvider?.attributes?.logo?.data?.attributes?.url
                  ? resProvider?.attributes?.logo?.data?.attributes?.url
                  : "http://abc.com/image.jpg",
                size_type: resProvider?.attributes?.logo?.data?.attributes
                  ?.size_type
                  ? resProvider?.attributes?.logo?.data?.attributes?.size_type
                  : "sm",
              },
            ],
          },
        };
        const itemData = response.map((item: any) => {
          return {
            id: item.id,
            descriptor: {
              name: item?.attributes?.name ? item?.attributes?.name : "",
              long_desc: item.attributes.long_desc
                ? item.attributes.long_desc
                : "",
              short_desc: item.attributes.short_desc
                ? item.attributes.short_desc
                : "",
              images: [
                {
                  url: item?.attributes?.image?.url
                    ? item?.attributes?.image?.url
                    : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJQbANiJKOddLqjBqk3Y-bws-pUxisbxvhrw&usqp=CAU",
                  size_type: item?.attributes?.image?.size_type
                    ? item?.attributes?.image?.size_type
                    : "sm",
                },
              ],
            },
            //Add category ids if exists
            ...(category?.data?.categories?.data &&
            category?.data?.categories?.data.length > 0
              ? {
                  category_ids: category?.data?.categories?.data.map(
                    (cat: any) => cat.id
                  ),
                }
              : {}),
            //Add location id if exists
            ...(res.attributes.provider.data.attributes.location_id &&
            res.attributes.provider.data.attributes.location_id.data
              ? {
                  location_ids: [
                    res?.attributes?.provider?.data?.attributes?.location_id
                      ?.data?.id
                      ? res?.attributes?.provider?.data?.attributes?.location_id
                          ?.data?.id
                      : "",
                  ],
                }
              : {}),
            fulfillment_ids: [res.attributes.item_fulfillment_id.data.id],
            //Add tags if exists

            ...(tag?.data?.tags?.data && tag?.data?.tags?.data.length > 0
              ? {
                  tags: tag.data.tags.data
                    .map((tg: any) => {
                      // Check if attributes.value exists
                      return tg.attributes
                        ? {
                            display: true,
                            descriptor: {
                              name: tg?.attributes?.tag_name
                                ? tg?.attributes?.tag_name
                                : "",
                            },
                            list: [
                              {
                                value: tg?.attributes?.tag_group_id?.data
                                  ?.attributes?.tag_group_name
                                  ? tg?.attributes?.tag_group_id?.data
                                      ?.attributes?.tag_group_name
                                  : "",
                                display: true,
                              },
                            ],
                          }
                        : null; // Return null for categories with missing attributes.value
                    })
                    .filter(Boolean), // Remove null values from the array
                }
              : {}),
            price: {
              value: item?.attributes?.sc_retail_product?.data?.attributes
                ?.min_price
                ? item?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
                : "0",
              currency: item?.attributes?.sc_retail_product?.data?.attributes
                ?.currency
                ? item?.attributes?.sc_retail_product?.data?.attributes
                    ?.currency
                : "INR",
            },
          };
        });
        const quoteData: any = {
          price: {
            value: response[0]?.attributes?.sc_retail_product?.data?.attributes
              ?.min_price
              ? response[0]?.attributes?.sc_retail_product?.data?.attributes?.min_price.toString()
              : "0",
            currency: response[0]?.attributes?.sc_retail_product?.data
              ?.attributes?.currency
              ? response[0]?.attributes?.sc_retail_product?.data?.attributes
                  ?.currency
              : "INR",
          },
          breakup:
            response[0]?.attributes?.sc_retail_product?.data?.attributes?.price_bareakup_ids?.data.map(
              (item: any) => {
                return {
                  item: {
                    id: item.attributes.item_id,
                  },
                  title: item.attributes.title,
                  price: {
                    currency: item.attributes.currency,
                    value: item.attributes.value,
                  },
                };
              }
            ),
        };

        const paymentData = response.map((payDetails: any) => {
          return {
            collected_by: "BPP",
            params:
              payDetails.attributes.provider.data.attributes.payment_methods.data.map(
                (payItem: any) => {
                  return {
                    bank_account: payItem.attributes.bank_account_number,
                    bank_code: payItem.attributes.bank_code,
                    price: quoteData.price,
                    currency: quoteData.currency,
                  };
                }
              )[0] || {},
            type: "PRE-ORDER",
          };
        });
        const billingData = filter.message.order.billing;
        const fulfillmentData = filter.message.order.fulfillments;
        const cancelData = response.map((item: any) => {
          return {
            cancellation_fee:
              item.attributes.sc_retail_product.data.attributes.product_cancel.data.map(
                (cancelItem: any) => {
                  return {
                    cancellation_fee: {
                      amount: {
                        currency: quoteData?.price?.currency
                          ? quoteData?.price?.currency
                          : "INR",
                        value: cancelItem?.attributes?.cancel_term_id?.data
                          ?.attributes?.cancellation_fee
                          ? cancelItem?.attributes?.cancel_term_id?.data
                              ?.attributes?.cancellation_fee
                          : "",
                      },
                    },
                  };
                }
              )[0] || {},
          };
        });

        const output: any = {
          context: filter.context,
          message: {
            order: {
              id: order_id.toString(),
              provider: providerData,
              items: itemData,
              fulfillments: fulfillmentData,
              billing: billingData,
              payments: paymentData,
              quote: quoteData,
              cancellation_terms: cancelData,
            },
          },
        };
        return output;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async confirmItem(itemValue: any, fields: string, table: string) {
    const queryFilter = `filters:{id:{in:[${itemValue}]}}`;
    const query = `query {
          ${table} (
            ${queryFilter}
          )
          ${fields}
        }`;
    const response = await makeGraphQLRequest(query).then((res) => res.data);
    return response;
  }
}
