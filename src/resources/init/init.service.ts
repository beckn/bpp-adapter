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
  const checkCustomerExistence = async (phoneNumber: any) => {
    const removeCountryCode = (phoneNumber: any) => {
      const countryCodePattern = /^\+\d{2}-/;
      return phoneNumber.replace(countryCodePattern, "");
    };

    const phoneNumberWithoutCountryCode = removeCountryCode(phoneNumber);

    const query = `query {
      customers(filters: { contact: { eq: "${phoneNumberWithoutCountryCode}" } }) {
        data {
          id
          attributes {
            first_name
            last_name
            contact
          }
        }
      }
    }`;

    const customerExist = await makeGraphQLRequest(query);
    console.log("Strapi::", customerExist);
    const custId = customerExist?.data?.customers?.data[0]?.id || "";

    console.log("customerExists", custId);
    return custId;
  };

  const customerExists = await checkCustomerExistence(
    filter.message.order.billing.phone
  );
  const initOrder = await makeGraphQLRequest(filter.message.order);

  return initOrder;
};
