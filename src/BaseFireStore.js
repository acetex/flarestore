const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

require('dotenv').config();

class BaseFireStore {
    conn = null;
    db = null;
    activeTable = null;

    constructor(table) {
        const serviceAccount = require(process.env.FS_KEY_FILENAME);
        if(!admin.apps.length){
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        this.conn = getFirestore();

        this.db = this.conn.collection(process.env.FS_DB_NAME).doc('schema');
        this.activeTable = this.db.collection(table);
    }
}


module.exports = BaseFireStore;