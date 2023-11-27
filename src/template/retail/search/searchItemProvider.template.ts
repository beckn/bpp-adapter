export const queryFields = `{
  data {
    id
    attributes {
      provider_name
      short_desc
      long_desc
      provider_uri
      category_ids
      {
        data
        {
          id
          attributes
          {
            category_code
            value
          }
        }
      }
      domain_id {
        data {
          id
          attributes {
            DomainName
          }
        }
      }
      location_id {
        data {
          id
          attributes {
            address
            city
            state
            country
            zip
          }
        }
      }
      logo {
        data {
          id
          attributes {
            url
          }
        }
      }
      items {
        data {
          id
          attributes {
            name
            short_desc
            long_desc
            code
            image{
              data{
                id
                attributes
                {
                  url
                }
              }
            }
            sc_retail_product {
              data {
                id
                attributes {
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
                  currency
                }
              }
            }
             cat_attr_tag_relations {
              data {
                id
                attributes {
                  taxanomy
                  taxanomy_id
                }
              }
            }
          }
        }
      }
    }
  }
  }`;

export const queryTable="providers"




