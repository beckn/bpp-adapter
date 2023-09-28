 export const queryFieldsCatTax = `
    {
      data
      {
        id
        attributes{
          taxanomy
          taxanomy_id
          item_id
          {
            data
            {
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
          }
        }
      }
    }`;

export const queryTableCatTax="catAttrTagRelations"