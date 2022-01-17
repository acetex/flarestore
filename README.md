# Welcom to Flarestore the ORM Firestore for node.js
>** Important this package just `Very begining of development phase` it have alot of limitation to use, becareful if you plan to use on production **

The Node.Js Firestore ORM inspire by laravel eloquent, extremely easy and simple to use, super lightweight package.

[Visit Github Project](https://github.com/acetex/flarestore).

and sorry about my english.

# Requirement and Limitation
1. This package support `orWhere()`, but it take `extended price cost` because firestore not have operator 'or' in where clause. every time your use 'orWhere()' the library must split request query to normal API `where()` and then merge union the data on every split request on your nodejs server.
2. This package not support firestore sub collection at all. the concept of this library your must imagine to `RDB (Relational Data Base` it just `DB->TABLE->COLUMN` schema and `Relational` data with `foreign key`, yes no need sub collection for `RDB`.
3. This Package not require a `composite or single field index`  when your use `orderBY()` to sort your query, because the library use your nodejs server to do this.
4. Currently version not support difining `field type`, you can workaround to edit field type manualy on gcp firestore page.
5. Currently version also not support `LIKE %%` query same base firestore query api, but in the nearly next version of this package i try to support `full text search` with `term`, `bigram` and `trigram`, you just config field type with `term`, `bigram` or `trigram` type to use this feature.
6. Support `==`, `>`, `<`, `>=`, `<=`, `!=`, `array-contains`, `array-contains-any`, `in`, `not-in` on `where()` operator same of gcp firestore.
7. Currently version suport only `limit()` not support `startAt()`, `endAt()`.
8. Currently version not support realtime snapshot but you can workaround to get model instant property `.activeTable` it will return `instant of firestore target collection` then you can follow to use firestore official nude.js api sdk like realtime snapshot or other default official api.
9. Support `MVC` structure project as well, you can build `Model` with this flarestore package.


## Installation
### Before you begin
To authenticate a service account and authorize it to access Firebase services, you must generate a private key file in JSON format.

__To generate a private key file for your service account:__
1. In the Firebase console, open Settings > [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).

2. Click __Generate New Private Key__, then confirm by clicking __Generate Key__.

3. The JSON key file will download to your computer, This key must use for .env file to nearly next step.

### Install via npm
```
npm i @acetex/flarestore
```

### Configulation
Create the .env file to root of your node.js project.
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
    table = 'users'; // define the name of table
    fields = ['name', 'address']; // fillable field list

}

module.exports = User // export User model

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

    await user.create(params); // when you create a new data record, the '__id' and '__timestamp' is automatic generated.
}

createUser();

```

Get the user and where query then update current user
```
# /index.js
var User = require('./models/User.js');

async function getUser(){
    const user = new User;

    user.where('name', '==', 'firstname lastname');
    user.orWhere('address', 'customer address');
    user.orderBy('__timestamp', 'desc');

    let users = await user.get();
    users[0].name = 'firstname lastname changed!';
    users[0].save();
}

getUser();

```

Delete Record
```
# /index.js
var User = require('./models/User.js');

async function deleteUser(){
    const user = new User;

    let users = await user.limit(3).get(); // limit only 3 record
    users[2].delete(); // delete user record by index position 3

}

deleteUser();

```

Relational Data

First: modify `User` model by adding `post()` with `User->hasMany->Post` and create new `Post` model with `Post->belongTo->User`
```
# /models/User.js
var FlareStore = require('@acetex/flarestore')

class User extends FlareStore {
    table = 'users'; // define the name of table
    fields = ['name', 'address']; // fillable field list

    post(){
        return this.hasMany('models/Post', 'users_id', '__id');
        // you can type just 'this.hasMany('models/Post')' if your foreignKey is {table name}_id
    }
}

module.exports = User // export User model

```

```
# /models/Post.js
var FlareStore = require('@acetex/flarestore')

class Post extends FlareStore {
    table = 'posts'; // define the name of table
    fields = ['title', 'description', 'uses_id'];

    user(){
        this.belongTo('models/User');
    }
}

module.exports = Post // export Post model

```

Secord: create new 'Post' record with 'users_id' foreignKey
```
# /index.js
var Post = require('./models/Post.js');

async function createPost(){
    const user = new User;
    let userData = await user.first();  // 'first()' return only first one record with 'object' not 'array of object'

    const post = new Post;
    const params = {
        title: 'test title',
        description: 'test description',
        users_id: userData.__id
    };

    await post.create(params); // when you create a new data record, the '__timestamp' field is automatic generated.
}

createPost();
```

Third: try to retrieving relation model;
```
# /index.js
var User = require('./models/User.js');
var Post = require('./models/Post.js');

async function getUser(){
    //example with hasMany
    const user = new User;

    let userData = await user.first();

    let posts = await userData.post().get();
    console.log(posts);

    // '.post()' is relation method to 'Post' model it will return 'Post' model object, of course you can use all property/method of 'Post' model like where(), orWhere(), orderBy(), etc. just like example below.
    let posts = await userData.post().where('description', 'test description').get();
    console.log(posts);


    //example with belongTo
    const postBelongTo = new Post;
    let postBelongToData = await postBelongTo.first();
    let belongToUser = postBelongToData.user().first();
    console.log(belongToUser);
}


getUser();

```
> Note! `hasOne()` use the same mechanic as `hasMany()` but have some difference `return type` with `get()` method, `hasOne()` return single object and `hasMany()` return array of object

