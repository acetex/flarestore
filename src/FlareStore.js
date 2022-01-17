const ROrm = require('./RecordOrm.js');
const BaseFireStore = require('./BaseFireStore.js');

class FlareStore {
    #where = [];
    #orWhere = [];
    #orderBy = [];
    #limit = null;
    #descFlag = '[-]';

    async create(params){
        const fireStore = new BaseFireStore(this.table);
        
        const paramsCreate = {};
        this.fields.forEach(field => {
            paramsCreate[field] =  params[field];
        });
        
        let newDocRef = fireStore.activeTable.doc();
        let tiemStamp = new Date().getTime();
        paramsCreate['__timestamp'] = tiemStamp;
        paramsCreate['__id'] = newDocRef.id;

        try{
            let modelObject = this;
            let creteData = await newDocRef.set(paramsCreate);
            
            if(creteData){
                let rorm = new ROrm;
                let obj = rorm.getOrm(modelObject, fireStore.activeTable, paramsCreate);

                return obj;
            }else{
                return false;
            }
        }catch(err){
            return false;
        }
    }

    async #getData(type = 'get'){
        const fireStore = new BaseFireStore(this.table);
        let docs = [];
        let pickoff = [];
        let unionSet = 0;

        if(this.#where.length > 0){
            unionSet++;
            let whereCollection = fireStore.activeTable;
            this.#where.forEach((where) => {
                let [field, condition, value] = where;
                whereCollection = whereCollection.where(field, condition, value);
            });
            if(this.#limit != null){
                whereCollection = whereCollection.limit(this.#limit);
            }
            let where = await whereCollection.get();
            
            where.forEach(doc => {
                docs.push(doc);
                if(this.#orWhere.length > 0){
                    pickoff.push(doc.id);
                }
            })
        }

        if(this.#orWhere.length > 0){
            let orWhere = [];
            this.#orWhere.forEach((where) => {
                unionSet++;
                let orWhereCollection = fireStore.activeTable;
                let [field, condition, value] = where;
                orWhere.push(orWhereCollection.where(field, condition, value));
            });
            
            await Promise.all(orWhere.map(obj => {
                if(this.#limit != null){
                    obj = obj.limit(this.#limit);
                }

                return obj.get();
            }))
            .then((snapshots) => {
                snapshots.forEach((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        if(!pickoff.includes(doc.id)){
                            docs.push(doc);
                            pickoff.push(doc.id);
                        }
                    });
                }); 
            });
        }

        if(this.#where.length == 0 && this.#orWhere.length == 0){
            let Collection = fireStore.activeTable;
            if(this.#limit != null){
                Collection = Collection.limit(this.#limit);
            }

            docs = await Collection.get();
        }
        
        let record;
        const orm = [];
        const modelObject = this;
        for (let doc of docs) {
            record = doc.data();

            let rorm = new ROrm;
            orm.push(rorm.getOrm(modelObject, fireStore.activeTable, record));
            if(orm.length == this.#limit){
                break;
            }
        };

        if(this.#orderBy.length == 0 && unionSet > 1){
            orm.sort(this.#dynamicSortMultiple(['__timestamp']));
        }else{
            orm.sort(this.#dynamicSortMultiple(this.#orderBy));
        }

        return orm;
    }

    async get(){
        let data;
        if(this.$fsCurrentRelationType == 'hasOne' || this.$fsCurrentRelationType == 'belongTo'){
            data = await this.#getData('first');
            data = data[0];
        }else{
            data = await this.#getData();
        }
            
        return data;
    }

    async first(){
        let data = await this.#getData('first');

        return data[0];
    }

    where(...aggs){
        if(aggs.length == 2){
            var [field, value] = aggs;
            var operation = '==';
        }else{
            var [field, operation, value] = aggs;
        }

        this.#where.push([field, operation, value]);

        return this;
    }

    orWhere(...aggs){
        if(aggs.length == 2){
            var [field, value] = aggs;
            var operation = '==';
        }else{
            var [field, operation, value] = aggs;
        }

        this.#orWhere.push([field, operation, value]);

        return this;
    }

    orderBy(field, sorting = 'asc'){
        sorting = sorting.toLowerCase();

        if(sorting == 'asc'){
            this.#orderBy.push(field);
        }else if(sorting == 'desc'){
            this.#orderBy.push(this.#descFlag+field);
        }

        return this;
    }

    limit(limit){
        this.#limit = limit;

        return this;
    }

    #dynamicSort(property) {
        var sortOrder = 1;
        if(property.substr(0, this.#descFlag.length) === this.#descFlag) {
            sortOrder = -1;
            property = property.substr(this.#descFlag.length);
        }

        return function (a, b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            //console.log(a[property]=' < '+b[property]+' = '+result);
            return result * sortOrder;
        }
    }

    #dynamicSortMultiple(props) {
        let flarestore = this;
        return function (obj1, obj2) {
            var i = 0, result = 0, numberOfProperties = props.length;
            /* try getting a different result from 0 (equal)
             * as long as we have extra properties to compare
             */
            while(result === 0 && i < numberOfProperties) {
                result = flarestore.#dynamicSort(props[i])(obj1, obj2);
                i++;
            }
            return result;
        }
    }

    resetOperation(){
        this.#where = [], this.#orWhere, this.#orderBy = [];
        this.#limit = null;

        return this;
    }

}

module.exports = FlareStore