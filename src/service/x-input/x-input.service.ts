import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";

@injectable()
export class XInputService {
  constructor() { }

  async xInput(filter: any) {
    const currentDate = new Date();
    const isoString = currentDate.toISOString();

    const query = `mutation {
    createInputDetail(
      data: {
       form_data: ${filter}
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
}



