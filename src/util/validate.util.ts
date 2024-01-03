
import Joi from 'joi';


interface JsonSchema {
  [key: string]: {
    type: 'string' | 'number';
    required: boolean;
  };
}


const convertToJoiSchema = (jsonSchema: JsonSchema): Joi.ObjectSchema => {
  const keys: { [key: string]: Joi.StringSchema | Joi.NumberSchema } = {};
  for (const key in jsonSchema) {
    const rule = jsonSchema[key];
    switch (rule.type) {
      case 'string':
        keys[key] = rule.required ? Joi.string().required() : Joi.string();
        break;
      case 'number':
        keys[key] = rule.required ? Joi.number().required() : Joi.number();
        break;

    }
  }
  return Joi.object(keys).unknown(false);
};


export { convertToJoiSchema };
