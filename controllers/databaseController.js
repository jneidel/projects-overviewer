const { throwUserError } = require( "../handlers/errorHandlers" );

/* eslint-disable global-require */

exports.updateDatabase = async ( req, res, next ) => {
  /*
   * Out: updated item/title in db
   */
  const username = req.body.username;
  const title = req.body.title;
  const updatedTitle = req.body.updatedTitle;
  const item = req.body.item;
  const updatedItem = req.body.updatedItem;
  const side = req.body.side;
  const db = req.db.collection( "cards" );

  const query = { username, title };
  const update = {};

  if ( updatedItem === undefined ) {
    update.$set = { title: updatedTitle };
  } else {
    query[side] = item;

    update.$set = {};
    update.$set[`${side}.$`] = updatedItem;
  }

  const response = await db.updateOne( query, update );

  res.json( { success: true } );
};

exports.generateCardId = async ( req, res, next ) => {
  /*
   * Out: available card id
   */
  const db = req.db.collection( "cards" );

  const cursor = db.find( {}, { _id: 1 } );
  cursor.sort( { _id: -1 } );
  cursor.limit( 1 );

  cursor.forEach( ( doc ) => {
    res.json( { _id: doc._id + 1 } );
  } );
};

exports.addNewCard = async ( req, res, next ) => {
  /*
   * Out: new card added to db
   */
  const username = req.body.username;
  const db = req.db.collection( "cards" );

  const lastPosition = await db.aggregate( [
    { $match: { username } },
    { $group: { position: { $max: "$position" }, _id: null } },
  ] ).toArray();

  let newPosition = 1; // fallback if first card
  try {
    newPosition = lastPosition[0].position + 1;
  } catch ( e ) {} // eslint-disable-line no-empty

  const insertion = {
    _id     : Number( req.body._id ),
    username,
    title   : "",
    front   : [ "" ],
    back    : [ "" ],
    position: newPosition,
  };

  const response = await db.insertOne( insertion );

  return res.json( { success: true } );
};

exports.addNewItem = async ( req, res, next ) => {
  /*
   * Out: new item added to db
   */
  const username = req.body.username;
  const title = req.body.title;
  const side = req.body.side;
  const db = req.db.collection( "cards" );

  const query = { title, username };
  const insert = { $push: {} };
  insert.$push[side] = "";

  const response = await db.updateOne( query, insert );

  return res.json( { success: true } );
};

exports.connectDatabase = async ( req, res, next ) => {
  /*
   * Out: req.db 
   * Throw: connection error
   */
  const mongodb = require( "mongodb" );
  require( "dotenv" ).config( { path: "../variables.env" } );

  req.db = await mongodb.MongoClient.connect( process.env.DATABASE )
    .catch( () => { throwUserError( "Database connection error", req, res ); } );

  return next();
};

exports.getCards = async ( req, res, next ) => {
  /*
   * Out: cards of username
   */
  const username = req.body.username;
  const db = req.db.collection( "cards" );

  req.cards = await db.find( { username }, { _id: 1, title: 1, front: 1, back: 1, position: 1 } )
    .sort( { position: 1 } ).toArray();

  return next();
};

exports.removeItem = async ( req, res, next ) => {
  /*
   * Out: remove item from card
   * Throw: item to remove is last item in array
   */
  const username = req.body.username;
  const title = req.body.title;
  const side = req.body.side;
  const db = req.db.collection( "cards" );

  const card = await db.find( { username, title } ).toArray();

  if ( card[0][side].length <= 1 ) {
    req.flash( "info", "The last item of a card shall not be removed" );
    return res.json( { info: true } );
  }

  const $pull = {};
  $pull[side] = req.body.item;

  await req.db.collection( "cards" ).update( { username, title }, { $pull } );

  if ( req.body.otherSide ) {
    return next();
  }
  return res.json( { success: true } );
};

exports.appendItemToOtherSide = async ( req, res, next ) => {
  /*
   * Out: add item to side array
   */
  const username = req.body.username;
  const title = req.body.title;
  const side = req.body.otherSide;
  const db = req.db.collection( "cards" );

  const card = await db.find( { username, title } ).toArray();
  const arr = card[0][side];
  if ( arr[arr.length - 1] === "" ) {
    var emptyItem = true;

    const $pullAll = {};
    $pullAll[side] = [ "" ];

    await db.update( { username, title }, { $pullAll } );
  }

  const update = { $push: {} };
  update.$push[side] = emptyItem ? { $each: [ req.body.item, "" ] } : req.body.item;

  await db.update( { username, title }, update );

  return res.json( { success: true } );
};
