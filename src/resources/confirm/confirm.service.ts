import { makeGraphQLRequest } from "../utils/api";

export const confirm = async (filter: any) => {
    console.log("ENTEREDL::::");
    const itemArray = filter.message.order.items;
    console.log(itemArray);
    const itemValue = itemArray.map((obj: { id: string }) => `"${obj.id}"`);
    console.log(itemValue);
  
    const currentDate = new Date();
    const isoString = currentDate.toISOString();
    console.log(isoString)
  

    const query=`mutation {
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

    const confirmResponse= await makeGraphQLRequest(query)
    console.log(confirmResponse,JSON.stringify(confirmResponse))

    filter.context["action"] = "on_confirm";
  
  filter.context["bpp_id"] =
    "beckn-strapi-sandbox-bpp-network.becknprotocol.io";

  filter.context["bpp_uri"] =
    "https://beckn-strapi-sandbox-bpp-network.becknprotocol.io";

    const output={
      context:filter.context,
      message:
      {
        order:{
            id:confirmResponse.data.createOrder.data.id,
            status:confirmResponse.data.createOrder.data.attributes.status,
            ...filter.message.order
        }
      }
    }
    return output;
  };