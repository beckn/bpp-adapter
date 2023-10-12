import { makeGraphQLRequest } from "../utils/api";
import config from "../../config";

export const init = async (filter: any) => {
  console.log("ENTEREDL::::");

  // const countryCodePattern = /^\+\d{2}-/;
  // const phoneNumberWithoutCountryCode = filter.message.order.billing.phone.replace(countryCodePattern, '');
  // const query=`query {
  //   customers(filters:{contact:{eq:${phoneNumberWithoutCountryCode}}})
  //   {
  //     data{
  //       id
  //       attributes{
  //         first_name
  //         last_name
  //         contact
  //       }
  //     }
  //   }
  // }`

  // const customerExist= await makeGraphQLRequest(query)
  // const custId=customerExist?.data?.customers?.data[0]?.id?customerExist.data.customers.data[0].id: ""
  // console.log("custId",custId)
  // const checkCustomerExistence = async (phoneNumber: any) => {
  //   const removeCountryCode = (phoneNumber: any) => {
  //     const countryCodePattern = /^\+\d{2}-/;
  //     return phoneNumber.replace(countryCodePattern, "");
  //   };

  //   const phoneNumberWithoutCountryCode = removeCountryCode(phoneNumber);

  //console.log("FILTERRR",filter.message.order.items)
  //const commerceWorkFlow = config.ECOMMERCE.split(",");
  //if (commerceWorkFlow.includes(filter.context.domain))
 // { 
    const itemIds = filter.message.order.items.map((item:any) => item.id);
    console.log(itemIds)
    filter.context["action"] = "on_init";
    
    filter.context["bpp_id"] =
      "beckn-strapi-sandbox-bpp";
  
    filter.context["bpp_uri"] =
      "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";
  
      const output={
        context:filter.context,
        message:filter.message
      }
      return output
    //}
    
};

