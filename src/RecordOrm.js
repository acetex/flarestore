const BaseFireStore = require('./BaseFireStore.js');

class RecordOrm {
    #modelObject;
    #activeTable;
    #original;
    
    #setRelation(relationType, relationModel, foreignKey = null, localKey){
        if(this[localKey] === undefined){
            throw (`No property key '${localKey}' in '${this.#modelObject.table}' model.`);
        }

        if(foreignKey === null){
            foreignKey = this.#modelObject.table+'_id';
        }

        let relationData = this.#getModelClass(relationModel);

        if(!relationData.fields.includes(foreignKey)){
            throw (`No property key '${foreignKey}' in '${relationData.table}' model.`);
        }
    
        relationData.$fsCurrentRelationType = relationType;
        relationData.where(foreignKey, this[localKey]);

        return relationData;
    }

    #setInvertRelation(relationType, relationModel, ownerKey = null, relateKey = null){    
        let relationData = this.#getModelClass(relationModel);
        if(ownerKey === null){
            ownerKey = relationData.table+'_id';
        }
        
        if(this[ownerKey] === undefined){
            throw (`No property key '${ownerKey}' in '${this.#modelObject.table}' model.`);
        }

        if(!relationData.fields.includes(relateKey) && relateKey != '__id'){
            throw (`No property key '${relateKey}' in '${relationData.table}' model.`);
        }
        
        relationData.$fsCurrentRelationType = relationType;
        relationData.where(relateKey, this[ownerKey]);

        return relationData;
    }

    #getModelClass(relationModel){
        if(relationModel.indexOf("/") == 0){
            relationModel = relationModel.substring(1);
        }

        const { dirname } = require('path');
        const appDir = dirname(require.main.filename);

        let Model =  require(`${appDir}/${relationModel}`);
        let relationData = new Model;

        return relationData;
    }

    belongTo(relationModel, ownerKey = null, relateKey = '__id'){
        let relationData = this.#setInvertRelation('belongTo', relationModel, ownerKey, relateKey);

        return relationData;
    }

    hasOne(relationModel, foreignKey = null, localKey = '__id'){
        let relationData = this.#setRelation('hasOne', relationModel, foreignKey, localKey);

        return relationData;
    }

    hasMany(relationModel, foreignKey = null, localKey = '__id'){
        let relationData = this.#setRelation('hasMany', relationModel, foreignKey, localKey);

        return relationData;
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

    async delete() {
        try{
            const deleted = await this.#activeTable.doc(this.__id).delete();
        }catch(err){
            return err;
        }
    }
}

module.exports = RecordOrm