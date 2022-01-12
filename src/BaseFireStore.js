const Firestore = require('@google-cloud/firestore');
require('dotenv').config();

class BaseFireStore {
    projectId = null;
    conn = null;
    db = null;
    activeTable = null;

    constructor(table) {
        this.conn = new Firestore({
            projectId: process.env.FS_PROJECT_ID,
            keyFilename: process.env.FS_KEY_FILENAME,
        });

        this.projectId = process.env.FS_PROJECT_ID;
        this.db = this.conn.collection(process.env.FS_DB_NAME).doc('schema');
        this.activeTable = this.db.collection(table);
    }
}


module.exports = BaseFireStore;