const ROrm = require('./RecordOrm.js');
const BaseFireStore = require('./BaseFireStore.js');

class FlareStore {
    #query = null;
    #where = [];
    #orWhere = [];
    #orderBy = [];
    #descFlag = '[-]';

    async create(params){
        const fireStore = new BaseFireStore(this.table);
        
        const paramsCreate = {};
        this.fields.forEach(field => {
            paramsCreate[field] =  params[field];
        });
        
        let tiemStamp = new Date().getTime();
        paramsCreate['__timestamp'] = tiemStamp;
        await fireStore.activeTable.add(paramsCreate);
    }

    async get(){
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
            docs = await Collection.get();
        }
        
        let record;
        const orm = [];
        const modelObject = this;
        docs.forEach(doc => {
            record = doc.data();
            record['__id'] = doc.id;

            let rorm = new ROrm;
            orm.push(rorm.getOrm(modelObject, fireStore.activeTable, record));
        });

        if(this.#orderBy.length == 0 && unionSet > 1){
            console.log('default order');
            orm.sort(this.#dynamicSortMultiple(['__timestamp']));
        }else{
            orm.sort(this.#dynamicSortMultiple(this.#orderBy));
        }
        

        return orm;
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

}

module.exports = FlareStore