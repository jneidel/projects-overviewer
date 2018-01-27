/* globals Vue url axios $ checkResponse */
/* eslint-disable no-alert */

/* Visual DOM Selection Tree - always applies to the one above
 *>div.item      // > signifies entry point item
 *  span.class
 *<   p.2ndChild // < signifies out point item
 */

const createNew = {
  item( parent, side, setListener, options = false ) {
    if ( options && options.last ) { // remove empty item to be added to the end later on
      options.last.parentNode.remove();
    }

    const newItem = parent.appendChild( document.createElement( "li" ) );

    const span = newItem.appendChild( document.createElement( "span" ) );
    span.className = "bullet";
    span.innerHTML = "&#9679;";

    const input = newItem.appendChild( document.createElement( "input" ) );
    input.className = "item";
    input.type = "text";
    input.value = options ? options.value : "";

    const svg = newItem.appendChild( document.createElementNS( "http://www.w3.org/2000/svg", "svg" ) );
    svg.setAttribute( "class", "switch" );
    svg.setAttribute( "viewBox", "0 0 477.175 477.175" );
    svg.setAttribute( "style", "enable-background:new 0 0 477.175 477.175;" );
    const g = svg.appendChild( document.createElementNS( "http://www.w3.org/2000/svg", "g" ) );
    const path = g.appendChild( document.createElementNS( "http://www.w3.org/2000/svg", "path" ) );
    path.setAttribute( "fill", "#f5f7fa" );
    path.setAttribute( "d", side === "front" ? "M360.731,229.075l-225.1-225.1c-5.3-5.3-13.8-5.3-19.1,0s-5.3,13.8,0,19.1l215.5,215.5l-215.5,215.5   c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4c3.4,0,6.9-1.3,9.5-4l225.1-225.1C365.931,242.875,365.931,234.275,360.731,229.075z   " : "M145.188,238.575l215.5-215.5c5.3-5.3,5.3-13.8,0-19.1s-13.8-5.3-19.1,0l-225.1,225.1c-5.3,5.3-5.3,13.8,0,19.1l225.1,225   c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4c5.3-5.3,5.3-13.8,0-19.1L145.188,238.575z" );

    setListener.item( input );
    setListener.bullet( span );
    setListener.itemSwitch( svg );

    if ( options && options.last ) { // move previously removed empty item to last position
      createNew.item( parent, side, setListener );
    }
  },
};

const setListener = {
  item( item ) {
    let originalItem = item.value;

    item.addEventListener( "keydown", async () => {
      if ( event.which === 13 ) {
        const innerCard = item.parentNode.parentNode.parentNode;
        /*
         *<div.inner
         *  ul
         *    li
         *>     input.item
         */
        const side = innerCard.className.match( /back/ ) ? "back" : "front";
        const ul = innerCard.getElementsByTagName( "UL" )[0];
        /*
         *>div.inner(.front/.back)
         *  (p.future)
         *  input.title
         *< ul
         */
        const title = innerCard.getElementsByClassName( "title" )[0].value;
        /*
         *>div.inner(.front/.back)
         *  (p.future)
         *< input.title
         */
        const lastItem = ul.children[ul.children.length - 1].children[1];
        /*
         *>ul
         *  li
         *< li [-1]
         */

        if ( lastItem === item ) {
          axios.post( "/api/add-new-item", { side, title } );

          createNew.item( ul, side, setListener );
        }

        await axios.post( "/api/update", {
          updatedItem: item.value,
          item       : originalItem,
          side,
          title,
        } );

        originalItem = item.value;
	 		}
    } );
  },
  title( title ) {
    let originalTitle = title.value;

    title.addEventListener( "keydown", async () => {
      if ( event.which === 13 ) {
        if ( title.value.length >= 20 ) {
          alert( `The title "${title.value}" will probably be cut off as its too long.
							${title.value.length}` );
        }

        const cards = title.parentNode.parentNode.children;
        /*
         *<div.inner.front
         *<div.inner.back
         *  (p.future)
         *> input.title
         */
        const side = title.parentNode.className.match( /back/ ) ? "back" : "front";
        if ( side === "front" ) { // Update title on other card side
          cards[1].children[1].value = title.value;
        } else {
          cards[0].children[0].value = title.value;
        }

        await axios.post( "/api/update", { updatedTitle: title.value, title: originalTitle } );

        originalTitle = title.value;
      }
    } );
  },
  bullet( bullet ) {
    async function removeItem() {
      const item = bullet.parentNode.children[1].value;
      /*
       * li
       *> span.bullet
       *< input.item
       */
      const side = bullet.parentNode.parentNode.parentNode.className.match( /back/ ) ? "back" : "front";
      /*
       *<div.inner(.front/.back)
       *  ul
       *    li
       *>     span.bullet
       */
      const title = side === "back" ?
        bullet.parentNode.parentNode.parentNode.children[1].value :
        bullet.parentNode.parentNode.parentNode.children[0].value;
      /*
       * div.inner
       *  (p.future)
       *< input.title
       *  ul
       *    li
       *>     span.bullet
       */
      bullet.parentNode.remove();

      const response = await axios.post( "/api/remove-item", { title, item, side } );
      checkResponse( response.data, "app", true );
    }

    bullet.addEventListener( "mouseenter", () => {
      bullet.style = "color: #333;";

      bullet.addEventListener( "click", removeItem );
    } );
    bullet.addEventListener( "mouseleave", () => {
      bullet.style = "color: #F5F7FA";

      bullet.removeEventListener( "click", removeItem );
    } );
  },
  itemSwitch( switchEl, toBack = false ) {
    async function switchHandler() {
      const item = switchEl.parentNode.getElementsByClassName( "item" )[0];
      /*
       * li
       *  span.bullet
       *< input.item 
       *> svg.switch 
       */
      const sideEl = switchEl.parentNode.parentNode.parentNode;
      /*
       *<div.inner
       *  ul
       *    li
       *>     svg.switch
       */
      const side = sideEl.className.match( /back/ ) ? "back" : "front";
      const otherSide = side === "back" ? "front" : "back";
      const title = sideEl.getElementsByClassName( "title" )[0];
      /*
       *>div.inner
       *  (p.future)
       *< input.title
       */
      const card = switchEl.parentNode.parentNode.parentNode.parentNode;
      /*
       *<div.card
       *  div.inner
       *    ul
       *      li
       *>       svg.switch
       */
      const otherCard = card.getElementsByClassName( otherSide )[0];
      const ul = otherCard.getElementsByTagName( "UL" )[0].children;
      const lastItem = ul[ul.length - 1].getElementsByClassName( "item" )[0];
      /*
       *>div.inner
       *  ul
       *    li
       *<     input.item
       */

      const options = { value: item.value };

      if ( lastItem.value === "" ) {
        options.last = lastItem;
      }

      createNew.item( otherCard.getElementsByTagName( "UL" )[0], otherCard, setListener, options );

      item.parentNode.remove();

      const response = await axios.post( "/api/switch-item", {
        title: title.value, item : item.value, side, otherSide,
      } );
      checkResponse( response.data, "app", true );
    }

    switchEl.addEventListener( "mouseenter", () => {
      switchEl.addEventListener( "click", switchHandler );
    } );
    switchEl.addEventListener( "mouseleave", () => {
      switchEl.removeEventListener( "click", switchHandler );
    } );
  },
};

function setEventListeners() {
  const items = $( ".item" );
  const titles = $( ".title" );
  const bullets = $( ".bullet" );
  const switchElems = $( ".switch" );

  for ( const item of items ) {
	  setListener.item( item );
  }
  for ( const title of titles ) {
	  setListener.title( title );
  }
  for ( const bullet of bullets ) {
    setListener.bullet( bullet );
  }
  for ( const switchEl of switchElems ) {
    setListener.itemSwitch( switchEl );
  }

  const cards = document.getElementsByClassName( "card" );

  // flip cards
  function flipCard( card ) {
    let cardState = "front";

    card.addEventListener( "dblclick", ( event ) => {
      const el = event.target.tagName;
      const permitted = [ "DIV", "P" ];
      if ( ~permitted.indexOf( el ) ) {
        if ( cardState === "front" ) {
          card.style.transform = "rotateY( 180deg )";
          cardState = "back";
        } else {
          card.style.transform = "rotateY( 0deg )";
          cardState = "front";
        }
      }
    } );
  }

  // Add new card
  const cardListenerCallback = function cardListenerCallbackWrapper() {
    setNewCardToInput( this, cardListenerCallback );
  };

  async function setNewCardToInput( cardToBeSet, callingFunction ) {
    cardToBeSet.removeEventListener( "dblclick", callingFunction );
    cardToBeSet.className = "card";
    cardToBeSet.innerHTML = `
      <div class="front inner">
        <input class="title" type="text" placeholder="Add title">
        <ul></ul>
      </div>
      <div class="back inner">
        <p class="future">Future</p> 
        <input class="title" type="text" placeholder="Add title">
        <ul></ul>
      </div>
     `;

    const ul = cardToBeSet.getElementsByTagName( "UL" );
    createNew.item( ul[0], "front", setListener );
    createNew.item( ul[1], "back", setListener );

    for ( const title of cardToBeSet.children ) {
      const side = title.children.length == 3 ? 1 : 0;
      setListener.title( title.children[side] );
      /*
       * title.children[ side ]
       *>div.inner(.front/.back)
       *  (p.future)
       *  input.title
       *  ul
       */
    }

    flipCard( cardToBeSet );

    const content = document.getElementById( "inner" );
    const newCard = content.appendChild( document.createElement( "span" ) );

    newCard.innerHTML += `<img class="addCard" src="img/add.png">`;
    newCard.className = "card addCardContainer";
    newCard.addEventListener( "dblclick", cardListenerCallback );

    const cardIdRequest = await axios.post( "/api/generate-cardId" );
    const cardId = cardIdRequest.data._id;

    axios.post( "/api/add-new-card", { _id: cardId } );
  }

  for ( const card of cards ) {
    const classes = card.className;
    if ( !classes.match( /.addCardContainer/ ) ) {
      flipCard( card );
    } else {
      card.addEventListener( "dblclick", cardListenerCallback );
    }
  }
}

setEventListeners();
