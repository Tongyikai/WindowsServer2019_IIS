// Asynchronous JavaScript and XML
<<<<<<< HEAD

// 同源 /api
const API_BASE = `${window.location.origin}/api`;  // 例: http(s)://r5599.xyz/api
const httpRequest = new XMLHttpRequest();
const AUTHORIZATION_FORMAT = /(?:(?:^|.*;\s*)authorization\s*\=\s*([^;]*).*$)|^.*$/;

// 共用 onload：根據伺服器回應做動作
httpRequest.onload = function() {
    if ( httpRequest.status >= 200 && httpRequest.status < 400 ) {
        let jsonObject = {};
        try { jsonObject = JSON.parse( httpRequest.responseText ); } catch(e){}
=======
const httpRequest = new XMLHttpRequest();
const AUTHORIZATION_FORMAT = /(?:(?:^|.*;\s*)authorization\s*\=\s*([^;]*).*$)|^.*$/;

httpRequest.onload = function() {
    if ( httpRequest.status >= 200 && httpRequest.status < 400 ) {
        let jsonObject = JSON.parse( httpRequest.responseText );
>>>>>>> origin/developer

        console.log( "===== From Server =====" );
        console.log( jsonObject );

        // 註冊成功, 讓使用者自行登入
        if ( jsonObject.register == "done" ) {
            alert( "Register Done" );
            return;
        }

        if ( jsonObject.addBuddy == true ) {
            alert( "🫱🏻‍🫲🏽 New Buddy!" );
            return;
        } else if ( jsonObject.addBuddy == false ) {
            alert( "Not found! or Already friends" );
            return;
        }

        if ( jsonObject.updateProfile == "finished" ) {
            alert( "📝 Update Profile!" );
            return;
        }

        if ( jsonObject.createCircle == "finished" ) {
            alert( "📜 Create Circle!" );
            return;
        }

<<<<<<< HEAD
        // 取得個人資料（大廳頁）
        if (  jsonObject[ "profileData" ] != undefined ) { 
            let setProfileData = setProfile; // 引用外部 script "lobbyCounter.js"
            setProfileData( jsonObject.profileData, jsonObject.buddyListData );
            return;
        }

        // 認證流程
=======
        // 取得個人資料
        if (  jsonObject[ "profileData" ] != undefined ) { 
            let setProfileData = setProfile; // 引用外部 script "lobbyCounter.js"
            setProfileData( jsonObject.profileData, jsonObject.buddyListData );
            // console.log( "profileData: " + jsonObject.profileData );
            // console.log( "buddyListData: " + jsonObject.buddyListData );
            return;
        }

>>>>>>> origin/developer
        switch( jsonObject.authorization ) {
            case "empty":
                alert( "Account password is wrong!!" );
                break;

            case "Okay":
                alert( "Welcome To Entrust Lobby" );
<<<<<<< HEAD
                // 進入大廳頁（請確定有此檔案）
                window.location.href = "/public/lobby.html";
=======
                window.location.href = "http://127.0.0.1:8888/lobby";
>>>>>>> origin/developer
                break;

            case "NotOkay":
                alert( "Token Authentication Failed: " + jsonObject.authorization );
                break;

            default:
<<<<<<< HEAD
                // 預期從 /auth/login 回來的是 { authorization: "<JWT_TOKEN>" }
                if (typeof jsonObject.authorization === "string" && jsonObject.authorization.length > 0) {
                    // 寫入 cookie（前端可讀；若改走 HttpOnly，這段可移除）
                    document.cookie = "authorization=" + jsonObject.authorization + "; path=/;";
                    // 立刻用 token 試登入
                    loginAuthorization();
                }
        }
    }
};

httpRequest.onerror = function() {
    alert( "Can't connect to this network." );
};

// === 註冊（呼叫 /api/auth/register，與你原後端風格一致） ===
async function userRegister(username, email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    if (res.status === 201) {
      // 與舊流程相容：送回 { register: "done" } 的語意 → 直接 alert
      alert("Register Done");
      return;
    }

    if (res.status === 409) {
      const body = await res.text();
      alert(`Email 或 Username 已存在。${body || ""}`);
      return;
    }

    const text = await res.text();
    alert(`註冊失敗 (${res.status}). ${text || "請稍後再試"}`);
  } catch (err) {
    alert(`網路錯誤：${err.message}`);
  }
}

// === 登入（呼叫 /api/auth/login；成功回 {authorization:"<JWT>"}，接著自動 /auth/me 驗證） ===
async function userLogin(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    let data = {};
    try { data = await res.json(); } catch(e){}

    if (res.ok && typeof data.authorization === "string" && data.authorization.length > 0) {
      document.cookie = "authorization=" + data.authorization + "; path=/;";
      loginAuthorization();
      return;
    }

    if (res.status === 401 || data.authorization === "empty") {
      alert("Account password is wrong!!");
    } else {
      alert(`登入失敗 (${res.status}).`);
    }
  } catch (err) {
    alert(`網路錯誤：${err.message}`);
  }
}

// === 用 token 驗證（呼叫 /api/auth/me；成功回 {authorization:"Okay"} → 轉大廳） ===
=======
                document.cookie = "authorization=" + jsonObject.authorization;
                loginAuthorization();
        }
    }
}

httpRequest.onerror = function() {
    alert( "Can't connect to this network." );
}

function userLogin( username, password ) {
    httpRequest.open( "POST", "http://127.0.0.1:8888/SignIn", false );
    httpRequest.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
    httpRequest.send( "username=" + username + "&password=" + password );
}

function userRegister( username, email, password ) {
    httpRequest.open( "POST", "http://127.0.0.1:8888/SignUp", false );
    httpRequest.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
    httpRequest.send( "username=" + username + "&email=" + email + "&password=" + password );
}

>>>>>>> origin/developer
function loginAuthorization() {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
    console.log( "Token: " + cookieValue );

<<<<<<< HEAD
    if ( cookieValue !== "" ) {
        httpRequest.open( "POST", `${API_BASE}/auth/me`, false );
=======
    if ( cookieValue !== "" ) { // 如果authorization有值，傳給伺服器認證
        httpRequest.open( "POST", "http://127.0.0.1:8888/logInWithToken", false );
>>>>>>> origin/developer
        httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue );
        httpRequest.send();
    }
}

<<<<<<< HEAD
// === 下列功能先全改同源 /api，若後端尚未實作可之後再補 ===

function addBuddyFromEmail( email ) {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
    httpRequest.open( "POST", `${API_BASE}/addBuddy`, false );
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
    httpRequest.send( "email=" + encodeURIComponent(email) );
=======
function addBuddyFromEmail( email ) {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
    httpRequest.open( "POST", "http://127.0.0.1:8888/addBuddy", false );
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.send( "email=" + email );
>>>>>>> origin/developer
}

function addBuddyFromUsername( username ) {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
<<<<<<< HEAD
    httpRequest.open( "POST", `${API_BASE}/addBuddy`, false );
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
    httpRequest.send( "username=" + encodeURIComponent(username) );
=======
    httpRequest.open( "POST", "http://127.0.0.1:8888/addBuddy", false );
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.send( "username=" + username );
>>>>>>> origin/developer
}

function uploadProfileData( form ) {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
    const FD = new FormData( form );
<<<<<<< HEAD
    httpRequest.addEventListener( "load", function( event ) {});
    httpRequest.addEventListener( "error", function( event ) {
        alert( "Oops! Something went wrong..." + event );
    });
    httpRequest.open( "POST", `${API_BASE}/updateProfile` );
=======
    httpRequest.addEventListener( "load", function( event ) {
        // alert( "Server: " + event.target.responseText );
    });
    httpRequest.addEventListener( "error", function( event ) {
        alert( "Oops! Something went wrong..." + event );
    });
    httpRequest.open( "POST", "http://127.0.0.1:8888/updateProfile" );
>>>>>>> origin/developer
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.send( FD );
}

function loadingProfileData() {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
<<<<<<< HEAD
    httpRequest.open( "POST", `${API_BASE}/loadingProfileData`, false );
=======
    httpRequest.open( "POST", "http://127.0.0.1:8888/loadingProfileData", false );
>>>>>>> origin/developer
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue );
    httpRequest.send();
}

function circleData( form ) {
    var cookieValue = document.cookie.replace( AUTHORIZATION_FORMAT, "$1" );
    const FD = new FormData( form );
<<<<<<< HEAD
    httpRequest.addEventListener( "load", function( event ) {});
    httpRequest.addEventListener( "error", function( event ) {
        alert( "Oops! Something went wrong..." + event );
    });
    httpRequest.open( "POST", `${API_BASE}/createCircle` );
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.send( FD );
}
=======
    httpRequest.addEventListener( "load", function( event ) {
        // alert( "Server: " + event.target.responseText );
    });
    httpRequest.addEventListener( "error", function( event ) {
        alert( "Oops! Something went wrong..." + event );
    });
    httpRequest.open( "POST", "http://127.0.0.1:8888/createCircle" );
    httpRequest.setRequestHeader( "Authorization", "Bearer " + cookieValue  );
    httpRequest.send( FD );
}
>>>>>>> origin/developer
