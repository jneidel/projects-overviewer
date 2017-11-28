const express = require( "express" ),
    router = express.Router(),
    passport = require( "passport" ),
    appController = require( "../controller/appController" ),
    accountController = require( "../controller/accountController" ),
    databaseController = require( "../controller/databaseController" ),
    { catchErrors } = require( "../handlers/errorHandlers" );

router.get( "/", appController.renderItems );

// Account
router.get( "/login", appController.login );
router.get( "/register", appController.register );
router.post( "/login", 
    passport.authenticate( "local", {
        failureRedirect: "/login",
        failureFlash: true
    } ),
    accountController.login 
);
router.post( "/register", 
    accountController.validateRegister,
    accountController.register
);

// API
router.post( "/api/update", databaseController.updateDatabase );
router.get( "/api/generate-cardId", databaseController.generateCardId );
router.post( "/api/add-new-card", databaseController.addNewCard );
router.get( "/api/get-userid", databaseController.getUserId );

module.exports = router;
