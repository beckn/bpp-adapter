import axiosInstance from "axios";
import https from 'https';
import config from "../config";

const apiUrl = config.STRAPI_API

//const apiUrl="https://strapi-bpp.becknprotocol.io/graphql"
//console.log("URL",apiUrl)
const apiToken = config.API_TOKEN
//const apiToken="1b8e2e1f6ce05a6cdae76863c630c6656be19450efdc8fa7196774cb368065c8fbee1b4cdfe8c39fb46d207b7241dc64ece560bc95270c3376dcd7fbe24cf44cd3869737ffcce3bbcb992e3313a183f20a18cbb73fbea9f696a3c852dcc55f4ed70be2f74983f609f7117a2f53c587408838d908a50f0a9597215fb7880111b3"

const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/json",
};

const axios = axiosInstance.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});



export async function makeGraphQLRequest(query: string): Promise<any> {
  try {
    return axios.post(
      apiUrl,
      {
        query,
      },
      {
        headers,
      }
    ).then((res) => res.data)


  } catch (error) {
    // Handle errors here
    console.error('GraphQL Request Error:', error);
    throw error;
  }
}
