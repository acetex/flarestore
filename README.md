# Welcom to Flarestore the ORM Firestore for node.js
>** Important this package just `starter development phase` becareful if you plan to use on production **

and sorry about my english.

# Requirement and Limitation
1. This package support `orWhere()`, but it take `extended price cost` because firestore not have operator 'or' in where clause. every time your use 'orWhere()' the library must split request query to normal API `where()` and then merge union the data on every split request on your nodejs server.
2. This package not support firestore sub collection at all. the concept of this library your must imagine to `RDB (Relational Data Base` it just `DB->TABLE->COLUMN` schema and `Relational` data with `foreign key`, yes no need sub collection for `RDB`.
3. This Package not require a `composite or single field index`  when your use `orderBY()` to sort your query, because the library use your nodejs server to do this.
4. Currently version not support difining `field type`, you can workaround to edit field type manualy on gcp firestore page.
5. Currently version of package also not support `LIKE %%` query same base firestore query api, but in the nearly next version of this package i try to support `full text search` with `term`, `bigram` and `trigram`, you just config field type with `term`, `bigram` or `trigram` type to use this feature.
6. Support `==`, `>`, `<`, `>=`, `<=`, `!=`, `array-contains`, `array-contains-any`, `in`, `not-in` on `where()` operator same of gcp firestore.
7. Currently version not support `limit()`, `startAt()`, `endAt()`.
8. Currently version not support realtime snapshot but you can workaround to get model instant property `.activeTable` it will return `instant of firestore target collection` then you can follow to use firestore official nude.js api sdk like realtime snapshot or other default official api.
9. Currently version not support `delete()` the data record.
10. github project incoming.

## Installation
### Before you begin
[Select or create a Google Cloud Platform project](https://console.cloud.google.com/project).

[Enable the Cloud Firestore API](https://console.cloud.google.com/flows/enableapi?apiid=firestore.googleapis.com).

[Set up authentication with a service account](https://cloud.google.com/docs/authentication/getting-started) so you can access the API from your local workstation.


### Install via npm
```
npm i @acetex/flarestore
```

### Configulation
Create the .env file to root off your node.js project.
```
#.env 
FS_PROJECT_ID=[Your firestore project ID]
FS_KEY_FILENAME=[A path/to/file.json service account JSON key file on your computer]
FS_DB_NAME=[The name of firestore root collection for your database name]
```

## Usage with Example
### Create the model file

The model it mean table in `RDB` for example we try to create 'users' table in `models` directory
```
# /models/User.js
var FlareStore = require('@acetex/flarestore')

class User extends FlareStore {
    table = 'users'; // difine the name of table
    fields = ['name', 'address']; // fillable field list

}

module.exports = User // export User model Module

```

Create the user
```
# /index.js
var User = require('./models/User.js');

async function createUser(){
    const user = new User;
    const params = {
        name: 'firstname lastname',
        address: 'customer address'
    };

    await user.create(params);
}

createUser();

```

Get the user and where query
```
# /index.js
var User = require('./models/User.js');

async function getUser(){
    const user = new User;

    user.where('name', '==', 'firstname lastname');
    user.orWhere('address', 'customer address');
    user.orderBy('__timestamp', 'desc');

    let users = await user.get();

}

getUser();

```

Relational Data
```
    #nearly release feature in the next version.

```







