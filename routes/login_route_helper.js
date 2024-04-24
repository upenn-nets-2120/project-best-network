const bcrypt = require('bcrypt'); 


var login_route_helper = function() {
    return {
        // Function for encrypting passwords WITH SALT
        // Look at the bcrypt hashing routines
        encryptPassword: (password, callback) => {
            // TODO: Implement this
           
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    return callback(err, null);
                }
        
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        return callback(err, null);
                    }
                    callback(null, hash);
                });
            });
       
        },

        // Function that validates the user is actually logged in,
        // which should only be possible if they've been authenticated
        // It can look at either an ID (as an int) or a username (as a string)
        isLoggedIn: (req, obj) => {
            if (typeof obj === 'string' || obj instanceof String)
                return req.session.username != null && req.session.username == obj;
            else
                return req.session.user_id != null && req.session.user_id == obj;
        },

        // Checks that every character is a space, letter, number, or one of the following: .,?,_
        isOK: (str) => {
            if (str == null)
                return false;
            for (var i = 0; i < str.length; i++) {
                if (!/[A-Za-z0-9 \.\?,_]/.test(str[i])) {
                    return false;
                }
            }
            return true;
        }        
    };
};

var encryptPassword = function(password, callback) {
    return login_route_helper().encryptPassword(password, callback);
}

var isOK = function(req) {
    return login_route_helper().isOK(req);
}

var isLoggedIn = function(req, obj) {
    return login_route_helper().isLoggedIn(req, obj);
}


module.exports = {
    isOK,
    isLoggedIn,
    encryptPassword
};

