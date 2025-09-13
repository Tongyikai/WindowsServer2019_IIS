/* *********#*********#*********#*********#*********#
 *                      網頁功能                     *
 #*********#*********#*********#*********#********* */
 
CLEAR_TOKEN = "authorization=";
HOST_URL = "http://127.0.0.1:8888/index";

/* *********#*********#*********#*********#*********#
*					  Notify Bell 				    *
#*********#*********#*********#*********#********* */
var graph_bell = document.querySelector( ".graph_bell" );
graph_bell.addEventListener( "click", function() {
    this.classList.toggle( "active" );
    // alert("未讀");
    var n = document.getElementsByClassName("notify")[0];

    if ( n.style.display === "block" ) {
        alert( "1" );
    } else {
        alert( "2" );
    }
});

/* *********#*********#*********#*********#*********#
*					   Menu 選單				     *
#*********#*********#*********#*********#********* */
var graph_o = document.querySelector( ".graph_o" );
graph_o.addEventListener( "click", function() {
    this.classList.toggle( "active" );
});

// 頭像 menu 底下的, 新增好友
var addFriendBtn = document.querySelector( "#menu_addFriend" ); // 取 id
addFriendBtn.addEventListener( "click", function() {
    var addNewFriendWindow = document.getElementsByClassName( "addNewFriendWindow" )[ 0 ];
    if ( addNewFriendWindow.style.display === "none" || addNewFriendWindow.style.display === "" ) {
        addNewFriendWindow.style.display = "block";
    } else {
        addNewFriendWindow.style.display = "none";
    }
});

let middleWindow = document.getElementsByClassName( "container_middle" )[ 0 ];
// edit
let editButton = document.getElementById( "menu_edit" );
editButton.onclick = () => {
    let editWindow = document.getElementsByClassName( "editWindow" )[ 0 ];
    if ( editWindow.style.display === "none" ) {
        editWindow.style.display = "block";
        middleWindow.style.display = "none";
    } else {
        editWindow.style.display = "none";
        middleWindow.style.display = "block";
    }
}
// club
let clubButton = document.getElementById( "menu_club" );
clubButton.onclick = () => {
    let clubWindow =  document.getElementsByClassName( "container_club" )[ 0 ];
    if ( clubWindow.style.display === "none" ) {
        clubWindow.style.display = "block";
        middleWindow.style.display = "none";
    } else {
        clubWindow.style.display = "none";
        middleWindow.style.display = "block";
    }
}
// edit_closeButton
let edit_closeButton = document.getElementById( "edit_closeButton" );
edit_closeButton.onclick = () => {
    let editWindow = document.getElementsByClassName( "editWindow" )[ 0 ];
    editWindow.style.display = "none";
    middleWindow.style.display = "block";
}
// club_closeButton
let club_closeButton = document.getElementById( "club_closeButton" );
club_closeButton.onclick = () => {
    let clubWindow =  document.getElementsByClassName( "container_club" )[ 0 ];
    clubWindow.style.display = "none";
    middleWindow.style.display = "block";
}
 
// logout
let logoutButton = document.getElementById( "menu_logout" );
logoutButton.onclick = () => {
     document.cookie = CLEAR_TOKEN;
     window.location.href = HOST_URL;
}

// 引用外部 script "formCheck.js"
let emailCorrect = checkEmailFormat;
let nameLengthCorrect = checkNameLengthFormat;
let includeSymbolsCorrect = checkIncludeSymbolsFormat;
let usernameCorrect = checkUsernameFormat;
let checkProfile = checkProfileData;
let checkCircle = checkCircleData;
// 引用外部 script "clientAJAX.js"
let addFriendEmail = addBuddyFromEmail;
let addFriendUsername = addBuddyFromUsername;
let uploadProfile = uploadProfileData;
let loadingProfile = loadingProfileData;
let createCircle = circleData;

function newFriend() { // onclick功能, 寫在lobby.html
    var addFriendName = document.getElementById( "addFriendName" );
    if ( emailCorrect( addFriendName.value ) ) {
        alert( "email Ok." );
        addFriendEmail( addFriendName.value );

    } else if ( nameLengthCorrect( addFriendName.value ) ) {
        alert( "Error: Name exceeds 24 characters." );

    } else if ( includeSymbolsCorrect( addFriendName.value ) ) {
        alert( "Error: Name has other symbols or email address is incorrect format." );

    } else if ( usernameCorrect( addFriendName.value ) ) {
        alert( "Error: The name must contain English and Numbers. Characters longer than 6." );

    } else {
        alert( "username Ok." );
        addFriendUsername( addFriendName.value );
    }
}

/* *********#*********#*********#*********#*********#
 *					 編輯視窗裡的功能 				   *
 #*********#*********#*********#*********#********* */
// 限制上傳圖片的大小
const UPLOAD_AVATAR_MAX_SIZE = 1*1024*1024; 
const ERROR_MESSAGE = "The uploaded attachment file cannot exceed 1 Mega Byte";

var loadFile = function( event ) {
    let uploadAvatar = document.getElementById( "edit_uploadAvatar" );

    // 上傳的檔案如果大於限制顯示警告
    if ( uploadAvatar.files[ 0 ].size > UPLOAD_AVATAR_MAX_SIZE ) {
        alert( ERROR_MESSAGE );
        cancelUploadAvatar(); // 取消頭像
    } else {
        // avatar = uploadAvatar;


    }
}

function cancelUploadAvatar() {
    document.getElementById( "edit_uploadAvatar" ).value = "";
}

// 出生年月日參數
function displayYear() {
    let options = "<option>Year</option>";
    for ( var i = 1900; i <= 2020; i++ ) {
        options += ( "<option>" + i + "</option>" );
    }
    document.getElementById( "edit_yearBox" ).innerHTML = options;
}

function displayMonth() {
    let options = "<option>Month</option>";
    for ( var i = 1; i <= 12; i++ ) {
        options += ( "<option>" + i + "</option>" );
    }
    document.getElementById( "edit_monthBox" ).innerHTML = options;
}

function displayDay() {
    let options = "<option>Day</option>";
    for ( var i = 1; i <= 31; i++ ) {
        options += ( "<option>" + i + "</option>" );
    }
    document.getElementById( "edit_dayBox" ).innerHTML = options;
}

// edit表單_提交
window.addEventListener( "load", () => {
    const form = document.getElementById( "edit_profileForm" );
    form.addEventListener( "submit", ( event ) => {
        event.preventDefault();
        if ( checkProfile( form ) ) uploadProfile( form );
    });
});

// circle表單_提交
window.addEventListener( "load", () => {
    const form = document.getElementById( "create_circleForm" );
    form.addEventListener( "submit", ( event ) => {
        event.preventDefault();

        let cookieValue = document.cookie.replace( /(?:(?:^|.*;\s*)authorization\s*\=\s*([^;]*).*$)|^.*$/, "$1" );
        document.getElementById( "circle_token" ).value = cookieValue; // 隱藏欄位給自己的token
        document.getElementById( "circle_inviteMember" ).value = ""; // 隱藏欄位清空

        var inviteMember = [];
        for ( var i = 0; i < circleMember.length; i++ ) { // 取得邀請成員的username
            // console.log( buddyData[ circleMember[ i ] ].username );
            inviteMember[ i ] = buddyData[ circleMember[ i ] ].username;
        }
        document.getElementById( "circle_inviteMember" ).value = inviteMember; // 邀請成員的username 放到隱藏欄位裡
        console.log( "inviteMember: " + inviteMember );
        // console.log( document.getElementById( "circle_inviteMember" ).value );

        checkCircle( form );
        if ( checkCircle( form ) ) createCircle( form );
    });
});

/* *********#*********#*********#*********#*********#
 *				   Circle視窗裡的功能 				  *
 #*********#*********#*********#*********#********* */
// 金額數值加千分位符號
var dues = 0;
function convertNumberIntoThousands( value ) {
    dues = value;
    if ( value ) {
        value += "";
        var arr = value.split( "." ); 
        var re = /(\d{1,3})(?=(\d{3})+$)/g;
        totalAmount(); // 更新總金額
        return arr[ 0 ].replace( re, "$1," ) + ( arr.length == 2 ? "." + arr[ 1 ] : "" );
    } else {
        return ''
    }
}

// 輸入金額或邀請成員都會計算一次總金額
function totalAmount() {
    let howManyPeople = circleMember.length;
    var multiply = dues * howManyPeople;
    multiply += "";
    var arr = multiply.split( "." );
    var re = /(\d{1,3})(?=(\d{3})+$)/g;
    document.getElementById( "circle_amount" ).value = "$" + arr[ 0 ].replace( re, "$1," ) + ( arr.length == 2 ? "." + arr[ 1 ] : "" );
}

// 邀請成為Circle成員
var circleMember = []; // 存放的是buddyData的序號
function inviteMember( obj ) { // 取得好友視窗底下的標籤內容 DOM(Document Object Model)
    let imgData = obj.children[ 0 ].children[ 0 ].src; // 取得圖檔
    let name = obj.children[ 1 ].children[ 1 ].textContent; // 取得名字
    let number = obj.children[ 1 ].children[ 0 ].textContent; // #取得編號
    var ordinalNum = number.substring( 1 ); // 把編號#, 移除
    ordinalNum--; // 減1, 為buddyData的陣列位置

    // 尋找是否有符合的元素
    if ( circleMember.indexOf( ordinalNum ) == -1 ) { // Circle沒有邀請為成員, 可以加入
        // console.log( "++" );
        circleMember.push( ordinalNum );

        // 手創標籤內容
        var td = document.querySelector( ".container_club .box .buddyCircle" );
        td.innerHTML += '<div class="buddyLabel" id="' + ordinalNum + '" name="circle_member" onclick="removeLabel( this )">' +
                            '<img class="buddyLabelAvatar" src="' + imgData + '">' +
                            '<a>' + name + '</a>' +
                        '</div>&emsp;';
    }
    totalAmount(); // 更新總金額
    console.log( "Join circle(Ordinal): " + circleMember );
}

function removeLabel( obj ) {
    let ordinalNum = obj.id;
    circleMember = circleMember.filter( function( item ) { // 陣列中刪除特定元素
        return item != ordinalNum;
    });
    console.log( "Delete circle(Ordinal): " + circleMember );
    obj.remove();
    totalAmount();
}

/* *********#*********#*********#*********#*********#
*				       取得個人資料			          *
#*********#*********#*********#*********#********* */
function displayProfile() {
    loadingProfile();
}

/* *********#*********#*********#*********#*********#
*			 通知訊息( 紅色小圖示 mail 開關 ) 			*
#*********#*********#*********#*********#********* */
function unreadNotification( bool ) {
    var e = document.getElementById( "mailElement" );
    if ( bool ) {
        e.style.opacity = 1;
    } else {
        e.style.opacity = 0;
    }
}

/* *********#*********#*********#*********#*********#
*				 給外部引用 clientAJAX.js			  *
#*********#*********#*********#*********#********* */
let buddyData; // 好友資料, 給其他 method 使用, 頁面載入就會執行(就有資料)
function setProfile( profileData, buddyListData ) { // 個人資料顯示
    if ( profileData.unreadMessage.length == 0 ) { // 陣列為空
        console.log( "profileData.unreadMessage = empty" );
    } else {
        unreadNotification( true ); // 顯示通知訊息
    }
    document.getElementById( "menuAvatar" ).src = profileData.avatar64code;
    buddyData = buddyListData;
    var count = buddyListData.length;
    for ( var i = 0; i < count; i++ ) {
        // console.log( buddyListData[ i ]  );
        dynamicallyAddBuddyList( buddyListData[ i ].familyName, buddyListData[ i ].givenName, buddyListData[ i ].nickname, buddyListData[ i ].avatar64code, buddyListData[ i ].jobTitle, i );
    }
}

/* *********#*********#*********#*********#*********#
*					 動態新增好友清單				   *
#*********#*********#*********#*********#********* */
function dynamicallyAddBuddyList( familyName, givenName, nickname, avatar64code, jobTitle, ordinalNumber ) {
    var name = givenName + " " + familyName + "(" + nickname + ")";
    if ( familyName == "" || givenName == "" || nickname == "" ) {
        name = "NONAME";
    }
    var div = document.querySelector( ".container_left .box" );
    var count = ordinalNumber + 1; // 陣列位置+1 變編號
    div.innerHTML += '<div class="list" onclick="inviteMember( this )">' +
                         '<div class="imgBx">' +
                             '<img src="' + avatar64code + '">' +
                         '</div>' +
                         '<div class="content">' +
                             '<h2 class="rank"><small>#</small>' + count + '</h2>' +
                             '<h4>' + name + '</h4>' +
                             '<p>' + jobTitle + '</p>' +
                         '</div>' +
                     '</div>';
}

/* *********#*********#*********#*********#*********#
*					 動態顯示創立日期				   *
#*********#*********#*********#*********#********* */
function dynamicallyDate() {
    const monthNamesEn = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    n =  new Date();
    y = n.getFullYear();
    m = monthNamesEn[ n.getMonth() + 1 ];
    d = n.getDate();
    document.getElementById( "created_on" ).placeholder = d + "/" + m + "/" + y;
}

/* *********#*********#*********#*********#*********#
*					畫面載入執行的功能				   *
#*********#*********#*********#*********#********* */
displayYear();
displayMonth();
displayDay();
displayProfile();
dynamicallyDate();