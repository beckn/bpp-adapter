export const retailQueryFields = `   {
    data
    {
      id
      attributes
      {
        order_tracking_id
        {
          data
          {
            id
            attributes
            {
              url
              status
            }
          }
        }
      }
    }
  }`;
export const retailQueryTable = "orderFulfillments";
