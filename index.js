const aws = require('aws-sdk');

const localDynamoEndpoint = 'http://localhost:8000';

const itemTemplate = ({ subset = 'default', os, learnLang, id, period, promoted = false }) => ({
  "Subset": { "S": subset },
  "OSLearnLang": { "S": `${os}#${learnLang}` },
  "id": { "S": id },
  "os": { "S": os },
  "learn_language_alpha3": { "S": learnLang },
  "period": { "N": `${period}` },
  "promoted": { "BOOL": promoted }
});

const requestTemplate = (item) => ({
  Item: item,
  TableName: tableName
});

const [
  _arn,
  _aws,
  _service,
  region,
  _accountID,
  resource
] = process.env.SKUS_DYNAMODB_TABLE_ARN.split(':');

let dynamoDBConfig = {
  region,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

if (process.env.ENVIRONMENT === 'development' || process.env.ENVIRONMENT === undefined) {
  dynamoDBConfig.endpoint = localDynamoEndpoint;
}

const tableName = resource.split('/')[1];
const dynamoDB = new aws.DynamoDB(dynamoDBConfig);

const updateItemCallback = (err, data) => {
  if (err) {
    console.error('encountered an error: ', err, err.stack);
  } else {
    console.log('success: ', data);
  }
};

const buildSkusFromFile = (file, subsetName, os) => {
  const skus = require(file);
  return skus.map(sku => {
    const skuItem = {
      os,
      learnLang: sku.learn_language_alpha3,
      id: sku.id,
      period: sku.period,
      subset: subsetName,
      promoted: sku.promoted
    };
    const updatedSkuItem = requestTemplate(itemTemplate(skuItem));
    return updatedSkuItem;
  });
}

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const prepedSkus = buildSkusFromFile('./skus/simple_array.json', 'all', 'android')

const putItemToDb = (item) => {
  return new Promise((res, rej) => {
    try {
      const resp = dynamoDB.putItem(item).promise();
      res(resp);
    } catch(error) {
      rej(error);
    }
  })
};

Promise.all(prepedSkus.map((sku) => sleep(300).then(putItemToDb(sku))))
.then((data) => console.log(data))
.catch((error) => console.error(error));
