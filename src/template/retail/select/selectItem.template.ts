export const retailQueryFields = `    {
  data {
    id
    attributes {
      name
      long_desc
      short_desc
      code
      image {
        data {
          id
          attributes {
            url
            size_type
          }
        }
      }
      provider {
        data {
          id
          attributes {
            provider_id
            provider_uri
            provider_name
            short_desc
            long_desc
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
                  size_type
                }
              }
            }
            fulfillments
            {
              data
              {
                id
                attributes
                {
                  type
                  rateable
                  rating
                }
              }
            }
          }
        }
      }
      sc_retail_product {
        data {
          id
          attributes {
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
            price_bareakup_ids {
              data {
                id
                attributes {
                  currency
                  value
                  title
                  item_id
                }
              }
            }
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
      item_meta_id {
        data {
          id
          attributes {
            meta_key
            meta_value
          }
        }
      }
      item_fulfillment_id {
        data {
          id
          attributes {
            
            location_id
            {
              data
              {
                id
                attributes
                {
                  zip
                  gps
                }
              }
            }
            fulfilment_id {
              data {
                id
                attributes {
                  rating
                  type
                  rateable
                  
                }
              }
            }
          }
        }
      }
    }
  }
  }`;
  export const retailQueryTable="items"