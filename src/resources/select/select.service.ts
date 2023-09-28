import httpStatus from "http-status";

import AppError from "../../library/exception";
import axiosInstance from "axios";
import https from "https";
import qs from "qs";

const axios = axiosInstance.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const apiUrl = "https://strapi-bpp.becknprotocol.io/graphql";

const apiToken =
  "1b8e2e1f6ce05a6cdae76863c630c6656be19450efdc8fa7196774cb368065c8fbee1b4cdfe8c39fb46d207b7241dc64ece560bc95270c3376dcd7fbe24cf44cd3869737ffcce3bbcb992e3313a183f20a18cbb73fbea9f696a3c852dcc55f4ed70be2f74983f609f7117a2f53c587408838d908a50f0a9597215fb7880111b3";

const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/JSON",
};

export const select = async (filter: any) => {
  try {
    console.log(filter);
    const itemArray = filter.message.order.items;
    console.log(itemArray);
    const itemValue = itemArray.map((obj: { id: string }) => obj.id);
    console.log(itemValue);
    
    const query = `items(filters:{id:{in:[${itemValue}]} provider_id:{id:{eq:${filter.message.order.provider.id}}}})`;
    const queryFields = ` {
        data{
          id
          attributes
          {
            name
                  long_desc
                  short_desc
                  code
                  provider_id
                  {
                    data{
                      id
                      attributes
                      {
                        provider_id
                        provider_uri
                        provider_name
                        short_desc
                        long_desc
                        domain_id{
                          data
                          {
                            id
                            attributes
                            {
                              DomainName
                            }
                          }
                          
                        }
                        location_id{
                          data{
                            id
                            attributes
                            {
                              address
                              city
                              state
                              country
                              zip
                            }
                          }
                        }
                        logo{
                          data{
                            id
                            attributes
                            {url}
                          }
                        }
                  
                        
                      }
                    }
                  }
                  sc_retail_product{
                    data
                    {
                      id
                      attributes
                      {
                        
                        sku
                        virtual
                        downloadable
                        min_price
                        max_price
                        on_sale
                        stock_status
                        stock_quantity
                        rating_count
                        average_rating
                        tax_class
                        tax_status
                        total_sales
                        currency
                      }
                    }
                  }
          }
        }
      }`;
      console.log(query, queryFields)
      const response = await axios
      .post(
        apiUrl,
        {
          query: `{${query}${queryFields}}`,
        },
        {
          headers,
        }
      )
      .then((res) => res.data);
    return response;
  } catch (error) {
    throw new Error("SOMETHING WENT WRONG");
  }
};
