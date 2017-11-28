import request from "then-request";

/* eslint-disable no-alert */

// Listening for item/title changes
function itemListener( item ) {
    let originalItem = item.value;
    item.addEventListener( "keydown", () => {
        if ( event.which === 13 ) {
            const parentNode = item.parentNode.parentNode.parentNode,
                titleNode = parentNode.children;

            if ( titleNode.length == 3 ) {
                var title = titleNode[1].value;
            } else {
                var title = titleNode[0].value;
            }

            originalItem = item.value;
            request( "POST", `http://localhost:8080/api/update?newItem=${item.value}&oldItem=${originalItem}&title=${title}` );
        }
    } );
}

function titleListener( title ) {
    let originalTitle = title.value;
    title.addEventListener( "keydown", () => {
        if ( event.which === 13 ) {
            if ( title.value.length >= 20 ) {
                alert( `The title "${title.value}" will probably be cut off as its too long.
                        ${title.value.length}` );
            }

            const parent = title.parentNode.parentNode.children;
            if ( !title.parentNode.className.match( /back/ ) ) {
                parent[1].children[1].value = title.value;
            } else {
                parent[0].children[0].value = title.value;
            }

            originalTitle = title.value;
            request( "POST", `http://localhost:8080/api/update?newTitle=${title.value}&title=${originalTitle}` );
        }
    } );
}

const items = document.getElementsByClassName( "item" ),
    titles = document.getElementsByClassName( "title" );

for ( const item of items ) {
    itemListener( item );
}

for ( const title of titles ) {
    titleListener( title );
}

// Flip cards
const cards = document.getElementsByClassName( "card" );

function flipCard( card ) {
    let cardState = "front";
    card.addEventListener( "dblclick", () => {
        if ( cardState === "front" ) {
            card.style.transform = "rotateY( 180deg )";
            cardState = "back";
        } else {
            card.style.transform = "rotateY( 0deg )";
            cardState = "front";
        }
    } );
}

const cardListenerCallback = function() {
    setNewCardToInput( this, cardListenerCallback );
};

for ( const card of cards ) {
    const classes = card.className;
    if ( !classes.match( /.addCardContainer/ ) ) {
        flipCard( card );
    } else {
        card.addEventListener( "dblclick", cardListenerCallback );
    }
}

// Add new card
async function setNewCardToInput( cardToBeSet, callingFunction ) {
    cardToBeSet.removeEventListener( "dblclick", callingFunction );
    cardToBeSet.className = "card";
    cardToBeSet.innerHTML = `
        <div class="front inner">
            <input class="title" type="text" placeholder="Add title">
                <ul>
                    <li>
                        <input class="item" type="text" placeholder="Add items">
                    </li>
                </ul>
        </div>
        <div class="back inner">
            <p class="future">Future</p> 
            <input class="title" type="text" placeholder="Add title">
                <ul>
                    <li>
                        <input class="item" type="text" placeholder="Add items">
                    </li>
                </ul>
        </div>
    `;

    for ( const item of cardToBeSet.children ) {
        if ( item.children.length == 3 ) {
            itemListener( item.children[2].children[0].children[0] );
        } else {
            itemListener( item.children[1].children[0].children[0] );
        }
    }
    for ( const title of cardToBeSet.children ) {
        titleListener( title.children[0] );
    }

    flipCard( cardToBeSet );

    const content = document.getElementById( "content" ),
        newCard = content.appendChild( document.createElement( "span" ) );
    newCard.innerHTML += `<img class="addCard" src="img/add.png">`;
    newCard.className = "card addCardContainer";
    newCard.addEventListener( "dblclick", cardListenerCallback );

    const cardIdRequest = await request( "GET", `http://localhost:8080/api/generate-cardId` ),
        cardId = JSON.parse( cardIdRequest.body )._id;

    await request( "POST", `http://localhost:8080/api/add-new-card?_id=${cardId}` );
}