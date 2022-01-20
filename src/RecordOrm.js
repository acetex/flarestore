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

        if(!relationData.fields.hasOwnProperty(foreignKey)){
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

        if(!relationData.fields.hasOwnProperty(relateKey) && relateKey != '__id'){
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

        this['__id'] = records['__id'];
        this['__timestamp'] = records['__timestamp'];
        for (let property in modelObject.fields) {
            this[property] = records[property];
        }
        
        return this;
    }

    async save() {
        try{
            const params = {};
            for (let property in this.#modelObject.fields) {
                if(this[property] != this.#original[property]){
                    params[property] =  this[property];

                    let fieldObj = this.#modelObject.fields[property];
                    if(fieldObj.includes('-gram')){
                        let position = fieldObj.indexOf('-gram');
                        let ngram = parseInt(fieldObj.substring(position-1, position));

                        let mapCreate = {};
                        let gram = nGram(ngram)(params[property].replace(/ /g,'').toLowerCase());
                        gram.forEach(function(g){
                            mapCreate[''+g] = true;
                        });
                        
                        params[this.#modelObject.fullTextSearchFieldPrefix+property] = mapCreate;
                    }
                }
            }
            
            
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