import { injectable } from "inversify";
import { makeGraphQLRequest } from "../../util/api";

@injectable()
export class XInputService {
  constructor() {}
  async xInput(filter: any) {
    const currentDate = new Date();
    const isoString = currentDate.toISOString();

    const xInputData = Object.entries(filter).map((ele) => {
      if (typeof ele[1] === "string") {
        return `${ele[0]}:"${ele[1]}"`;
      } else {
        return `${ele[0]}:${ele[1]}`;
      }
    });
    const query = `mutation {
    createInputDetail(
      data: {
       form_data: {${xInputData}},
       form_id:"${filter.form_id}"
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
  }
}
