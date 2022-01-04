### Setup Environment

Run [bin/setup-environment](../bin/setup-environment)

This will:

- install [.env.local.example](../.env.local.example) to .env
- install npm dependencies
### Authenticate

Follow [the authentication doc](https://www.serverless.com/framework/docs/providers/google/guide/credentials/).


```bash
gcloud auth application-default login
```

### Deploy

```shell
yarn deploy:(stg|prod|qa)
```
### Remove

```bash
yarn remove:(stg|prod|qa)
```

## Test

```bash
# unit tests
yarn run test
