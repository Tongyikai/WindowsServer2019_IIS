/* *********#*********#*********#*********#*********#
 *                      資料檢查                     *
 #*********#*********#*********#*********#********* */

emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
nameLengthRule = /[a-zA-Z0-9]{25}/; // 匹配成立代表名字超過24字元
includeSymbolsRule = /[^a-zA-Z0-9]+/; // 英文或數字以外的符號都配對，[^a-z] 方刮號前面寫一個尖號(脱字符)則代表要求匹配除了尖號後面列出"以外"的字符
usernameRule = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,23}$/; //至少有一個數字,至少有一個小寫英文字母,至少有一個大寫英文字母,字串長度在 6 ~ 23 個字母之間
passwordRule = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[\w\s]).{8,16}$/;
blankRule = /(^s*)|(s*$)/g;
includeNumber = /[0-9]/;

function checkEmailFormat( parameter ) {
    if ( emailRule.test( parameter ) ) return true;
    return false;
}

function checkNameLengthFormat( parameter ) {
    if ( nameLengthRule.test( parameter ) ) return true;
    return false;
}

function checkIncludeSymbolsFormat( parameter ) { // 匹配成功代表輸入了英文數字以外的字符
    if ( includeSymbolsRule.test( parameter ) ) return true;
    return false;
}

function checkUsernameFormat( parameter ) {
    if ( usernameRule.test( parameter ) ) return false;
    return true;
}

function checkPasswordFormat( parameter ) {
    return passwordRule.test( parameter );
}

// 檢查是否輸入了空白 ( 沒有輸入或輸入空白為 true，文字包含空白字符為 false )
function checkBlankFormat( parameter ) {
    if ( parameter.replace( blankRule, "" ).length == 0 ) {
        return true;
    }
    
    if ( parameter == "" ) return true;
    var regulation = "^[ ]+$";
    var re = new RegExp( regulation );
    return re.test( parameter );
}

// 檢查文字中是否包含空白
function checkBlankInTheWord( parameter ) {
    let str = parameter.split( "" );
    for ( var i = 0; i < str.length; i++ ) {
        if ( str[ i ] == " " ) {
            return true;
        }
    }
    return false;
}

function checkIncludeNumber( parameter ) {
    if ( includeNumber.test( parameter ) ) return true;
    return false;
}

// 檢查出生年月日是否正確
function checkDateOfBirth( year, month, day ) {
    let limitInMonth = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
    let isLeap = new Date( year, 1, 29 ).getDate() === 29;
    if ( isLeap ) {
        limitInMonth[ 1 ] = 29;
    }
    return day <= limitInMonth[ month - 1 ];
}

function checkProfileData( form ) {
    userData = { // 從 form 表單 取出要的資料
        avatarImg: form[ 0 ].value,
       familyName: form[ 2 ].value,
        givenName: form[ 3 ].value,
         nickname: form[ 4 ].value,
      yearOfBirth: form[ 5 ].value,
     monthOfBirth: form[ 6 ].value,
       dayOfBirth: form[ 7 ].value,
         jobTitle: form[ 11 ].value,
           stayAt: form[ 12 ].value,
         hometown: form[ 13 ].value,
           mobile: form[ 14 ].value,
               fb: form[ 15 ].value
    };

    const YEAR_CHARACTER = "Year";
    const MONTH_CHARACTER = "Month";
    const DAY_CHARACTER = "Day";
    var safeBall = 9;

    if ( checkBlankInTheWord( userData.familyName ) ) {
        alert( "Family Name: Words include blank" );
        safeBall--;

    } else if ( checkIncludeNumber( userData.familyName ) ) {
        alert( "Family Name: Cannot have numbers" );
        safeBall--;

    } else if ( checkNameLengthFormat( userData.familyName ) ) {
        alert( "Family Name: Text exceeds 24 characters" );
        safeBall--;
    }
    
    if ( checkBlankInTheWord( userData.givenName ) ) {
        alert( "Given Name: Words include blank" );
        safeBall--;

    } else if ( checkIncludeNumber( userData.givenName ) ) {
        alert( "Given Name: Cannot have numbers" );
        safeBall--;

    } else if ( checkNameLengthFormat( userData.givenName ) ) {
        alert( "Given Name: Text exceeds 24 characters" );
        safeBall--;
    }

    if ( checkNameLengthFormat( userData.nickname ) ) {
        alert( "Nickname: Text exceeds 24 characters" );
        safeBall--;
    }

    if ( userData.yearOfBirth != YEAR_CHARACTER && userData.monthOfBirth != MONTH_CHARACTER && userData.dayOfBirth != DAY_CHARACTER ) {
        if ( checkDateOfBirth( userData.yearOfBirth, userData.monthOfBirth, userData.dayOfBirth ) ) {
            // alert( "出生 - 修改 可以" );

        } else {
            safeBall--;
            alert( "Birth: Not the correct date" );
        }
    } else if ( userData.yearOfBirth == YEAR_CHARACTER && userData.monthOfBirth == MONTH_CHARACTER && userData.dayOfBirth == DAY_CHARACTER ) {
        // alert( "出生 - 不修改" );

    } else {
        alert( "Birth: Please enter complete date of birth" );
        safeBall--;
    }

    if ( checkNameLengthFormat( userData.jobTitle ) ) {
        alert( "Stay at: Text exceeds 24 characters" );
        safeBall--;
    }

    if ( checkNameLengthFormat( userData.stayAt ) ) {
        alert( "Stay at: Text exceeds 24 characters" );
        safeBall--;
    }

    if ( checkNameLengthFormat( userData.hometown ) ) {
        alert( "Hometown: Text exceeds 24 characters" );
        safeBall--;
    }

    if ( userData.fb.length > 100 ) {
        alert( "Facebook: Text exceeds 100 characters-" + userData.fb.length );
        safeBall--;
    } 

    if ( safeBall < 9 ) {
        alert( "Form table cannot be sent" );
        return false;
    } else {
        // alert( "送出修改");
        return true;
    }
}

function checkCircleData( form ) {
    let count = document.getElementsByClassName("buddyCircle")[0].getElementsByTagName("div").length; // 成員人數
    console.log( "===== Circle form =====" );
    console.log( "Circle name: " + form[ 0 ].value );
    // console.log( form[ 1 ].value );
    console.log( "Dues: " + form[ 2 ].value );
    console.log( "Amount: " + form[ 3 ].value );
    console.log( "Payment cycle: " + form[ 4 ].value );
    console.log( "Bulletin board: " + form[ 5 ].value );
    circleData = { // 從 form 表單 取出要的資料
           circleName: form[ 0 ].value,
                 dues: form[ 2 ].value,
               amount: form[ 3 ].value,
         paymentCycle: form[ 4 ].value,
        bulletinBoard: form[ 5 ].value
    };
    var safeBall = 4;

    if ( checkNameLengthFormat( circleData.circleName ) ) {
        alert( "Circle Name: Text exceeds 24 characters" );
        safeBall--;
    }

    if ( circleData.dues == 0 || circleData.dues >= 1000000 ) {
        alert( "Dues too much or $ = 0" );
        safeBall--;
    }

    if ( circleData.paymentCycle > 4 || circleData.paymentCycle == 0 ) {
        alert( "Less than 5 weeks or weeks = 0" );
        safeBall--;
    }

    if ( count == 0 ) {
        alert( "Need to invite someone" );
        safeBall--;
    }

    if ( safeBall < 4 ) {
        alert( "Form table cannot be sent" );
        return false;
    } else {
        return true;
    }
}