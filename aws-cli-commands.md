## Setup

### Running
As simple as running the following command in a separate shell
```shell
docker run -p 8000:8000 amazon/dynamodb-local -sharedDb
```

In case you want to use the DB within other use cases e.g. running communicating with it from a node console, you'll need to pass the `-sharedDb` flag. But then the command needs to be extended a bit to:

```shell
docker run -p 8000:8000 -v $(pwd)/local/dynamodb:/data/ amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -dbPath /data
```

### Configuration
To not do something nasty in production, ensure to source the nested `.env` file to set
- `--enpoint-url http://localhost:8000` (local endpoint)
- `AWS_SECRET_ACCESS_KEY=local`
- `AWS_ACCESS_KEY_ID=local`
- `AWS_REGION=eu-west-1` (for authentication)


## Creating a table
```shell
AWS_SECRET_ACCESS_KEY=local aws dynamodb create-table \
    --table-name SkuTable \
    --attribute-definitions \
        AttributeName=Subset,AttributeType=S \
        AttributeName=OSLearnLang,AttributeType=S \
    --key-schema \
        AttributeName=Subset,KeyType=HASH \
        AttributeName=OSLearnLang,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5 \
    --$LOCAL
```

## Adding items
```shell
aws dynamodb put-item \
    --table-name SKUs \
    --item file://items/item-for-skus-1.json \
    --endpoint-url http://localhost:8000 \
    --return-consumed-capacity TOTAL
```

## Querying items
```shell
aws dynamodb query \
    --table-name SKUs \
    --key-condition-expression "Subset = :subset AND begins_with(OSLearnLang, :oslearnlang)" \
    --expression-attribute-values '{
        ":subset": { "S": "US-EXPERIMENT-TEST" },
        ":oslearnlang": { "S": "ANDROID" }
    }' \
    --endpoint-url http://localhost:8000
```


