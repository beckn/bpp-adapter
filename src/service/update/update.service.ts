import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import config from "../../config";
import {
  fulfillmentQueryFields,
  fulfillmentQueryTable,
} from "../../template/retail/update/orderFulfillment.template";
import {
  retailQueryFields,
  retailQueryTable,
} from "../../template/retail/update/updateItem.template";
import {
  mutateCustomerTable,
  mutateCustomerFields,
} from "../../template/retail/update/updateCustomer.template";
@injectable()
export class UpdateService {
  constructor() {}

  async update(filter: any) {
    try {
      const commerceWorkFlow = config.ECOMMERCE.split(",");

      if (commerceWorkFlow.includes(filter.context.domain)) {
        const orderId = filter.message.order.id.toString();

        const orderResponse = await this.updateItem(
          orderId,
          retailQueryFields,
          retailQueryTable
        );
        const orderFulfillmentResponse = await this.orderFulfillment(
          orderId,
          fulfillmentQueryFields,
          fulfillmentQueryTable
        );

        if (filter.message.updated_target.includes("order.fulfillments[0]")) {
          const customerID =
            orderFulfillmentResponse.orderFulfillments.data[0].attributes
              .customer_id.data.id;
          const updateCustomer = await this.mutateCustomer(
            customerID,
            filter,
            mutateCustomerTable,
            mutateCustomerFields
          );
        }

        const orderFulfillmentDetail =
          orderFulfillmentResponse.orderFulfillments.data;
        const res = orderResponse.orders.data[0].attributes.items.data[0];
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
        const response = orderResponse.orders.data[0].attributes.items.data;
        const resProvider =
          orderResponse.orders.data[0].attributes.items.data[0].attributes
            .provider.data;

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

        const fulfillmentData = orderFulfillmentDetail.map(
          (fulfillment: any) => {
            const data = fulfillment.attributes;
            return {
              id: data.fulfilment_id.data.id,
              state: {
                descriptor: {
                  code: data.state_code,
                  short_desc: data.state_value,
                },
                updated_at: data.updatedAt,
              },
              customer: {
                contact: {
                  email: data?.customer_id?.data?.attributes?.email
                    ? data?.customer_id?.data?.attributes?.email
                    : "",
                  phone: filter?.message?.order?.fulfillments[0]?.customer
                    ?.contact?.phone
                    ? filter?.message?.order?.fulfillments[0]?.customer?.contact
                        ?.phone
                    : data?.customer_id?.data?.attributes?.contact,
                },
                person: {
                  name: data?.customer_id?.data?.attributes?.first_name
                    ? data?.customer_id?.data?.attributes?.first_name
                    : "",
                },
              },
              stops: [
                {
                  type: "end",
                  location: {
                    gps: data?.order_fulfillment_location_id?.data?.attributes
                      ?.gps
                      ? data?.order_fulfillment_location_id?.data?.attributes
                          ?.gps
                      : "",
                    address: data?.order_fulfillment_location_id?.data
                      ?.attributes?.address
                      ? data?.order_fulfillment_location_id?.data?.attributes
                          ?.address
                      : "",
                    city: {
                      name: data?.order_fulfillment_location_id?.data
                        ?.attributes?.city_name
                        ? data?.order_fulfillment_location_id?.data?.attributes
                            ?.city_name
                        : "",
                      code: data?.order_fulfillment_location_id?.data
                        ?.attributes?.city_code
                        ? data?.order_fulfillment_location_id?.data?.attributes
                            ?.city_code
                        : "",
                    },
                    country: {
                      name: data?.order_fulfillment_location_id?.data
                        ?.attributes?.country_name
                        ? data?.order_fulfillment_location_id?.data?.attributes
                            ?.country_name
                        : "",
                      code: data?.order_fulfillment_location_id?.data
                        ?.attributes?.country_code
                        ? data?.order_fulfillment_location_id?.data?.attributes
                            ?.country_code
                        : "",
                    },
                    state: {
                      name: data?.order_fulfillment_location_id?.data
                        ?.attributes?.state_name
                        ? data?.order_fulfillment_location_id?.data?.attributes
                            ?.state_name
                        : "",
                      code: data?.order_fulfillment_location_id?.data
                        ?.attributes?.state_code
                        ? data?.order_fulfillment_location_id?.data?.attributes
                            ?.state_code
                        : "",
                    },
                    area_code: data?.order_fulfillment_location_id?.data
                      ?.attributes?.area_code
                      ? data?.order_fulfillment_location_id?.data?.attributes
                          ?.area_code
                      : "",
                  },
                },
              ],
            };
          }
        );
        const billingDetails =
          orderFulfillmentDetail[0].attributes.order_id.data.attributes
            .order_address.data.attributes;
        const billingData = {
          name: billingDetails?.first_name ? billingDetails?.first_name : "",
          address: billingDetails?.address_line_1
            ? billingDetails?.address_line_1
            : "",
          city: {
            name: billingDetails?.city ? billingDetails?.city : "",
            code: billingDetails?.city ? billingDetails?.city : "",
          },
          state: {
            name: billingDetails?.state ? billingDetails?.state : "",
            code: billingDetails?.state ? billingDetails?.state : "",
          },
          email: billingDetails?.email ? billingDetails?.email : "",
          phone: billingDetails?.phone ? billingDetails?.phone : "",
          tax_id: billingDetails?.tax_id ? billingDetails?.tax_id : "",
        };
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
              id: filter.message.order.id.toString(),
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

  private async updateItem(itemValue: any, fields: string, table: string) {
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

  private async orderFulfillment(
    itemValue: any,
    fields: string,
    table: string
  ) {
    const queryFilter = `filters:{order_id:{id:{in:[${itemValue}]}}}`;
    const query = `query {
          ${table} (
            ${queryFilter}
          )
          ${fields}
        }`;
    const response = await makeGraphQLRequest(query).then((res) => res.data);
    return response;
  }

  private async mutateCustomer(
    itemValue: any,
    filter: any,
    table: string,
    fields: string
  ) {
    const queryFilter = `id:${itemValue},data:{contact:"${filter.message.order.fulfillments[0].customer.contact.phone}"}`;
    const query = `mutation {
          ${table} (
            ${queryFilter}
          )
          ${fields}
        }`;

    const response = await makeGraphQLRequest(query).then((res) => res.data);
    return response;
  }
}
