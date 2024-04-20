const mysql = require('mysql2');
const config = require('../config.json'); // Load configuration
const process = require('process');

// Implementation of a singleton pattern for database connections
let the_db = null;

module.exports = {
    get_db_connection,
    set_db_connection,
    create_tables,
    insert_items,
    send_sql,
    close_db
}


function close_db() {
    if (the_db) {
        the_db.end();
        the_db = null;
    }
}

/**
 * For mocking
 * 
 * @param {*} db 
 */
function set_db_connection(db) {
    the_db = db;
}

/**
 * Get a connection to the MySQL database
 * 
 * @returns An SQL connection object or mock object
 */
async function get_db_connection() {
    if (the_db) {
        return the_db;
    }   
    const dbConfig = {
        host: config.database.host,
        user: process.env.RDS_USER,
        password: process.env.RDS_PWD,
        database: config.database.name
    };

    the_db = mysql.createConnection(dbConfig);

    // Connect to MySQL
    return new Promise(function(resolve, reject) {
        the_db.connect(err => {
            if (err) {
                return reject(err);
            } else {
                console.log('Connected to the MySQL server.');
                resolve(the_db);
            }
        });
    });
}



/**
 * Execute a SQL query with parameters
 * 
 * @param {string} sql - The SQL query with placeholders for parameters
 * @param {Array} params - Array of parameter values
 * @returns {Promise} - Promise that resolves with the query result or rejects with an error
 */
async function send_sql(sql, params) {
    try {
        const db = await get_db_connection();
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (err) {
        throw err;
    }
}




 /**
 * Sends an SQL CREATE TABLES to the database
 * 
 * @param {*} query 
 * @param {*} params 
 * @returns promise
 */
 async function create_tables(query, params = []) {
    return send_sql(query, params);
}


/**
 * Executes an SQL INSERT request
 * 
 * @param {*} query 
 * @param {*} params 
 * @returns The number of rows inserted
 */
async function insert_items(query, params = []) {
    result = await send_sql(query, params);

    return result.affectedRows;
}
