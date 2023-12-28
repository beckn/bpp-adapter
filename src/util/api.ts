import axiosInstance from "axios";
import https from 'https';
import config from "../config";

const apiUrl = config.STRAPI_API

const apiToken = config.API_TOKEN

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
