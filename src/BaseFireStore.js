const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

require('dotenv').config();

class BaseFireStore {
    projectId = null;
    conn = null;
    db = null;
    activeTable = null;

    constructor(table) {
        const serviceAccount = require(process.env.FS_KEY_FILENAME);
        initializeApp({
            credential: cert(serviceAccount)
        });

        this.conn = getFirestore();

        this.projectId = process.env.FS_PROJECT_ID;
        this.db = this.conn.collection(process.env.FS_DB_NAME).doc('schema');
        this.activeTable = this.db.collection(table);
    }
}


module.exports = BaseFireStore;