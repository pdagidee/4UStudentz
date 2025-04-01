// Creating a Class speicifcally for the display of all pages
class DisplayPage{
    constructor(pages){
        this.pages = pages;
        this.activePage = null;
    }

    showPage(pageId){
        // Hide all pages first
        Object.values(this.pages).forEach(page=> {
            page.style.display= 'none';
        });
        // Show the target page
        this.pages[pageId].style.display = 'flex';
        this.activePage = pageId;
    }

}    
/*********************************************************************************************************************** */
// Initialising DisplayManager with some elements
    const displayPage = new DisplayPage({
        frontPage: document.getElementById('front-page'),
        exitPage: document.getElementById('exit-page'),
        loginPage: document.getElementById('login-page'),
        registerPage: document.getElementById('register-page'),
        passwordresetPage: document.getElementById('forgot-password-page'),
        mainmenuPage: document.getElementById("main-menu"),
        cybersecurityinfoPage: document.getElementById("cybersecurity-page"),
    });

    // Show the front page by default
displayPage.showPage('frontPage');

// Functions to switch between pages

function showExitPage() {
    displayPage.showPage('exitPage');
}

function showFrontPage() {
    displayPage.showPage('frontPage');
}

function showLoginPage(){
    document.getElementById("username").value="";
    document.getElementById("pwd").value="";
    displayPage.showPage('loginPage');
}

function showRegisterPage(){
    document.getElementById("username2").value="";
    document.getElementById("pwd2").value="";
    document.getElementById("sq").value="";
    displayPage.showPage('registerPage');
}

function showPasswordResetPage(){
    document.getElementById("forgot-uname").value="";
    document.getElementById("forgot-answer").value="";
    document.getElementById("new-password").value="";
    displayPage.showPage('passwordresetPage')
}

function showMainMenuPage(){
    displayPage.showPage('mainmenuPage');
}

function showCybSecInfoPage(){
    displayPage.showPage('cybersecurityinfoPage');
}
/* ----------------------------------------------------------------------------------------------------------*/
// Creating a function for exiting the SPA
function quitSPA(){

    UserAccount.logout(); 

    document.body.innerHTML = "<h1 style='color:red;text-align:center;'>You have now left the SPA.</h1>"
}

/*-----------------------------------------------------------------------------------------------------------*/
// Creating a function that will allow the user to view their password in the login and sign-in page
function showPassword(button){
    var input = button.previousElementSibling
    var icon = button.querySelectorAll('i');
    if (input.type === "password") {
        input.type = "text";
        icon.forEach(i => i.classList.replace('fa-eye', 'fa-eye-slash')); // Change the eye to eye slash when showing/not showing password for visual effect
    } else {
        input.type = "password";
        icon.forEach(i => i.classList.replace('fa-eye-slash', 'fa-eye')); // Vice-versa with line 58
    }
}
/*********************************************************************************************************** */
// Creating a class for user accounts
class UserAccount{
    constructor(username, password, secretAnswer = null){
        this.username = username;
        this.password = password;
        this.secretAnswer = secretAnswer;
    }

    static generateSalt(){
        return crypto.getRandomValues(new Uint8Array(16));
    }


    static arrayBufferToBase64(buffer){
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }


    static base64ToArrayBuffer(base64){
        const binaryString = atob(base64);
        return Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    }


    static async hashInput(input, salt){
        const encoder = new TextEncoder();
        const data = encoder.encode(input + this.arrayBufferToBase64(salt));
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return this.arrayBufferToBase64(hashBuffer);
    }

    // User registration
    async register() {
        if(!this.username || !this.password || !this.secretAnswer){
            alert("Please fill in all fields.");
            return false;
        }

        if (localStorage.getItem(this.username)){
            alert("Username already exists!");
            return false;
        }

        if(this.password.length < 8){
            alert("Password must have at least 8 characters");
            return false;
        }
        
        let salt = UserAccount.generateSalt();
        let hashedPassword = await UserAccount.hashInput(this.password, salt);
        let secretSalt =UserAccount.generateSalt();
        let secretAnswerHash = await UserAccount.hashInput(this.secretAnswer, secretSalt);

        localStorage.setItem(
            this.username,
            JSON.stringify({
                password: hashedPassword,
                salt: UserAccount.arrayBufferToBase64(salt),
                secretAnswer : secretAnswerHash, 
                secretSalt : UserAccount.arrayBufferToBase64(secretSalt),
            })
        );

        alert("Account created successfully!");
        return true;

    }

    // Login user
    async login() {
        let storedUser = JSON.parse(localStorage.getItem(this.username));

        if(!storedUser){
            alert("User not found!");
            return false;
        }

        let hashedPassword = await UserAccount.hashInput(this.password, UserAccount.base64ToArrayBuffer(storedUser.salt));

        if (hashedPassword === storedUser.password){
            alert("Login successful!");
            sessionStorage.setItem("loggedInUser", this.username);
            return true;
        } else{
            alert("Incorrect password!");
            return false;
        }
    }

    // Verification of secret question answer for password reset
    static async verifySecretAnswer(username, secretAnswer){
        let storedUser = JSON.parse(localStorage.getItem(username));

        if(!storedUser){
            alert("User not found!");
            return false;
        }


        let hashedAnswer = await this.hashInput(secretAnswer, this.base64ToArrayBuffer(storedUser.secretSalt));

        if (hashedAnswer !== storedUser.secretAnswer){
            alert("Incorrect answer to the secret question!");
            return false;
        }

        return true;
    }

    // Logout
    static logout(){
        sessionStorage.removeItem("loggedInUser");
        alert("Logged out successfully!");
    }

    static isLoggedIn(){
        return sessionStorage.getItem("loggedInUser") !==null;
    }
}

// Registering and Logging in a user
document.getElementById("sign-in-button").addEventListener("click", async () => {
    let username = document.getElementById("username2").value;
    let password = document.getElementById("pwd2").value;
    let secretAnswer = document.getElementById("sq").value;

    let user = new UserAccount(username, password, secretAnswer);
    let success = await user.register();

    if(success){
        showLoginPage();
    }

});


document.getElementById("login-button2").addEventListener("click", async() => {
    let username = document.getElementById("username").value;
    let password = document.getElementById("pwd").value;

    console.log("Attempting login for: ", username);

    let user = new UserAccount(username, password);
    let success = await user.login();

    if (success){
        document.getElementById("header").innerText = `Welcome, ${username}`;
        document.getElementById("user-name").innetText = username;
        showMainMenuPage();
    }

});

// Verification for password reset page
document.getElementById("veritas-button").addEventListener("click", async () => {
    let username = document.getElementById("forgot-uname").value;
    let secretAnswer = document.getElementById("forgot-answer").value;

    if(!username || !secretAnswer){
        alert("Please enter your username and answer.");
        return;
    }

    let isCorrect = await UserAccount.verifySecretAnswer(username, secretAnswer);

    if (isCorrect){
        alert("Secret answer verified! You can now reset your password.");
        document.getElementById("password-reset-section").style.display ="block";
    }
});

// Resetting password
document.getElementById("reset-password-button").addEventListener("click", async() => {
    let username = document.getElementById("forgot-uname").value;
    let newPassword = document.getElementById("new-password").value;

    if(!username || !newPassword) {
        alert("Please enter your new password.");
        return;
    }

    if(newPassword.length < 8) {
        alert("Password must have at least 8 characters");
        return;
    }

    let storedUser = JSON.parse(localStorage.getItem(username));

    if(!storedUser){
        alert("User not found!");
        return false;
    }

    let newSalt = UserAccount.generateSalt();
    let newPasswordHash = await UserAccount.hashInput(newPassword, newSalt);

    storedUser.password = newPasswordHash;
    storedUser.salt = UserAccount.arrayBufferToBase64(newSalt);

    localStorage.setItem(username, JSON.stringify(storedUser));

    alert("Password reset successful! You can now log in with your new password now!")
    showLoginPage();

});

window.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = sessionStorage.getItem("loggedInUser");
    if(loggedInUser) {
        document.getElementById("header").innerText = `Welcome, ${loggedInUser}`;
        document.getElementById("user-name").innerText = loggedInUser;
        showMainMenuPage();
    }
});

// Logging out functionality

function logoutUser(){
    
    UserAccount.logout();

    document.getElementById("header").innerText = "Welcome User";
    document.getElementById("user-name").innerText = "User";

    showFrontPage();
}