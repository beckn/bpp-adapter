import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";
import { DOMAIN } from "../../constants";

@injectable()
export class ConfirmService {
  constructor() { }

  async confirm(filter: any) {
   
      const itemArray = filter.message.order.items;
      const itemValue = itemArray.map((obj: { id: string }) => `"${obj.id}"`);
      const currentDate = new Date();
      const isoString = currentDate.toISOString();

      const queryMutationOrder = `mutation {
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
        }`

      const orderResponse = await makeGraphQLRequest(queryMutationOrder)

      const order_id = orderResponse.data.createOrder.data.id;
     console.log("orderAdress",filter.message.order.billing)
     const billing=filter.message.order.billing
     const billingName=billing?.name?billing.name:""
     const billingAddress=billing?.address?billing?.address:""
     const billingState=billing?.state?.name?billing?.state?.name:billing?.state?.code
     const billingCity=billing?.city?.name?billing?.city?.name:billing?.city?.code
     const billingEmail=billing?.email?billing?.email:""
     const billingPhone=billing?.phone?billing?.phone:""
     const billingCode=billing?.area_code?billing?.area_code:""

     const queryMutationOrderAdress = `mutation {
      createOrderAddress(
        data: {
          order_id:${order_id}
          first_name:"${billingName}"
          address_line_1:"${billingAddress}"
          city:"${billingCity}"
          email:"${billingEmail}"
          phone:"${billingPhone}"
          publishedAt:"${isoString}"
          postcode:"${billingCode}"
        }
      ) {
        data {
          id
          attributes {
           first_name
          }
        }
      }
    }`
    console.log("queryMutationOrderAdress",queryMutationOrderAdress)
    const orderAddressResponse = await makeGraphQLRequest(queryMutationOrderAdress)

      //const order_id = orderResponse.data.createOrder.data.id;
      console.log("orderAddressResponse",orderAddressResponse)
      return order_id;
    }





   
  
}


