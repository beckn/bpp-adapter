export const queryFields = `{
    data {
      id
      attributes{
        sku
        downloadable
        min_price
        max_price
        on_sale
        stock_quantity
        stock_status
        rating_count
        average_rating
        total_sales
        tax_class
        virtual
        item_id{
          data{
            id
            attributes{
              name
              short_desc
              long_desc
              provider_id{
                data{
                  id
                  attributes{
                    provider_name
                    short_desc
                    long_desc
                    domain_id{
                      data{
                        id
                        attributes{
                          DomainName
                        }
                      }
                    }
                    location_id{
                      data{
                        id
                        attributes{
                          address
                          city
                          state
                          country
                          zip
                        }
                      }
                    }
                    logo{
                      data
                      {
                        id
                        attributes{
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

export const queryTable="scProducts"




