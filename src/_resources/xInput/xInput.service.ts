import { makeGraphQLRequest } from "../utils/api";
export const xInput = async (filter: any) => {
  console.log(filter);

  const currentDate = new Date();
  const isoString = currentDate.toISOString();
  console.log(isoString);

  const ItemName = filter.message.itemName;
  const disputeDetails = filter.message.disputeDetails;

  const query = `mutation {
    createInputDetail(
      data: {
       form_data: ${filter}
      form_id:"${filter.message.formId}"
      
      publishedAt:"${isoString}"
      }
    ) {
      data {
        id
       
          
        }
      
    }
  }`;
  const response = await makeGraphQLRequest(query);

  const output = {
    submissionId: response.data.createInputDetail.data.id,
  };
  return output;
};
