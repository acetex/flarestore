const BaseFireStore = require('./BaseFireStore.js');

class RecordOrm {
    #modelObject;
    #activeTable;
    #original;

    hasMany(relationModel){
        const { dirname } = require('path');
        const appDir = dirname(require.main.filename);

        let Model =  require(`${appDir}/${relationModel}`);
        this.data = new Model;

        return this;
    }

    async get(){
        let data = await this.data.get();
        
        return data;
    }

    getOrm(modelObject, activeTable, records){
        let getMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(modelObject));
        getMethods.forEach((prop) => {
            if(prop != 'constructor')
                this[prop] = modelObject[prop];
        });
        this.#modelObject = modelObject;
        this.#activeTable = activeTable;
        this.#original = records;

        for (let field in records) {
            let value = records[field];
            this[field] = value;
        }

        return this;
    }

    async save() {
        try{
            const params = {};
            this.#modelObject.fields.forEach(field => {
                if(this[field] != this.#original[field]){
                    params[field] =  this[field];
                }
            });
            
            if(Object.keys(params).length){
                const updated = await this.#activeTable.doc(this.__id).update(params);
    
                if(updated){
                    this.#original = Object.assign({}, this.#original, params);
                }
            }

            return true;
        }catch(err){
            return err;
        }
    }
}

module.exports = RecordOrm