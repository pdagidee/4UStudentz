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
        document.getElementById("front-page-header").innerText = `Welcome, ${username}`;
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
        document.getElementById("front-page-header").innerText = `Welcome, ${loggedInUser}`;
        document.getElementById("user-name").innerText = loggedInUser;
        showMainMenuPage();
    }
});

// Logging out functionality

function logoutUser(){
    
    UserAccount.logout();

    document.getElementById("front-page-header").innerText = "Welcome User";
    document.getElementById("user-name").innerText = "User";

    showFrontPage();
}

/* Password Storage */

//Password Entry class
class PasswordEntry{
    constructor(id, website, username, password, notes =""){
        this.id = id;
        this.website = website;
        this.username = username;
        this.password = password;
        this.notes = notes;
        this.dateCreated = new Date().toISOString();
        this.dateModified = new Date().toISOString();
    }
}

class PasswordManager{
    constructor(masterKey) {
        this.masterKey = masterKey;
        this.passwords = [];
    }

    
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Encryption useing AES-256
    async encrypt(data){
        const encoder = new TextEncoder();
        const salt = UserAccount.generateSalt();

        // Deriving a key from master key
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(this.masterKey),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const cryptoKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256},
        false,
        ["encrypt"]
        );


        const iv = crypto.getRandomValues(new Uint8Array(16));

        // Encryption of data
        const encryptedContent = await crypto.subtle.encrypt(
            { name: "AES-CBC", iv: iv},
            cryptoKey,
            encoder.encode(JSON.stringify(data))

        );

        return {
            encryptedData: UserAccount.arrayBufferToBase64(encryptedContent),
            iv: UserAccount.arrayBufferToBase64(iv),
            salt: UserAccount.arrayBufferToBase64(salt)
        };
    }

    // Decryption using AES-256
    async decrypt(encryptedObj){
        const encoder = new TextEncoder();

    const encryptedData = UserAccount.base64ToArrayBuffer(encryptedObj.encryptedData);
    const iv = UserAccount.base64ToArrayBuffer(encryptedObj.iv);
    const salt = UserAccount.base64ToArrayBuffer(encryptedObj.salt);

    // Derive same key used for encryption
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(this.masterKey),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    const cryptoKey = await crypto.subtle.deriveKey(

        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-CBC", length: 256},
        false,
        ["decrypt"]
    );

    const decryptedContent = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: iv },
        cryptoKey,
        encryptedData
    );

    return JSON.parse(new TextDecoder().decode(decryptedContent));
    }

    // Loading passwords method
    async loadPasswords() {
        const username = sessionStorage.getItem("loggedInUser");
        if(!username) return false;

        const passwordsKey = `${username}_passwords`;
        const encryptedData = localStorage.getItem(passwordsKey);

        if(!encryptedData){
            this.passwords = [];
            return true;
        }

        try{
            this.passwords = await this.decrypt(JSON.parse(encryptedData));
            return true;
        } catch (error){
            console.error("Failed to decrypt passwords:", error);
            return false;
        }
    }

    // Save passwords to localStorage
    async savePasswords(){
        const username = sessionStorage.getItem("loggedInUser");
        if(!username) return false;

        const passwordsKey = `${username}_passwords`;
        const encryptedData = await this.encrypt(this.passwords);

        localStorage.setItem(passwordsKey, JSON.stringify(encryptedData));
        return true;
    }

    // Add a new password method
    async addPassword(website, username, password, notes =""){
        const newEntry = new PasswordEntry(
            PasswordManager.generateId(),
            website,
            username,
            password,
            notes
        );

        this.passwords.push(newEntry);
        await this.savePasswords();
        return newEntry;
    }

    getPasswordById(id) {
        return this.passwords.find(entry => entry.id === id);
    }

    getAllPasswords(){
        return this.passwords;
    }

    //Update Password method
    async updatePassword(id, updates){
        const index = this.passwords.findIndex(entry => entry.id === id);
        if (index === - 1) return false;

        this.passwords[index] = {
            ...this.passwords[index],
            ...updates,
            dateModified: new Date().toISOString()
        };

        await this.savePasswords();
        return true;
    }

    // Delete Password  method

    async deletePassword(id) {
        const initialLength = this.passwords.length;
        this.passwords = this.passwords.filter(entry => entry.id !== id);

        if(this.passwords.length < initalLength){
            await this.savePasswords();
            return true;
        }

        return false;
    }

    // Search for Passwords
    searchPasswords(query){
        query = query.toLowerCase();
        return this.passwords.filter(entry =>
            entry.website.toLowerCase().includes(query) ||
            entry.username.toLowerCase().includes(query) ||
            entry.notes.toLowerCase().includes(query)
        );
    }
}

let passwordManager;

// Add the password storage page to your DisplayPage class
document.addEventListener('DOMContentLoaded', () => {
    if (displayPage && document.getElementById('password-storage-page')) {
        displayPage.pages.passwordStoragePage = document.getElementById('password-storage-page');
    }
});

// Function to show the password storage page
function showPasswordStoragePage() {
    if (UserAccount.isLoggedIn()) {
        displayPage.showPage('passwordStoragePage');
        loadAndDisplayPasswords();
    } else {
        alert("Please log in to access your passwords.");
        showLoginPage();
    }
}

// Initialize the password manager after successful login
document.getElementById("login-button2").addEventListener("click", async () => {
    let username = document.getElementById("username").value;
    let password = document.getElementById("pwd").value;

    let user = new UserAccount(username, password);
    let success = await user.login();

    if (success) {
        document.getElementById("front-page-header").innerText = `Welcome, ${username}`;
        document.getElementById("user-name").innerText = username;
        
        // Initialize password manager with user's password as master key
        passwordManager = new PasswordManager(password);
        await passwordManager.loadPasswords();
        
        showMainMenuPage();
    }
});

// Load and display passwords
async function loadAndDisplayPasswords() {
    if (!passwordManager) {
        const password = prompt("Please enter your password to decrypt your passwords:");
        passwordManager = new PasswordManager(password);
        const success = await passwordManager.loadPasswords();
        
        if (!success) {
            alert("Failed to decrypt passwords. Please try again.");
            return;
        }
    }
    
    const passwordsList = document.getElementById("passwords-list");
    passwordsList.innerHTML = "";
    
    const passwords = passwordManager.getAllPasswords();
    
    if (passwords.length === 0) {
        passwordsList.innerHTML = "<p>No passwords stored yet.</p>";
        return;
    }
    
    passwords.forEach(entry => {
        const entryElement = document.createElement("div");
        entryElement.className = "password-entry";
        entryElement.dataset.id = entry.id;
        
        entryElement.innerHTML = `
            <div class="entry-header">
                <h3 class="ui-text-style all-headers">${entry.website}</h3>
                <div class="entry-actions">
                    <button class="view-btn eye-button" onclick="viewPassword('${entry.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="edit-btn edit-button" onclick="editPassword('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn delete-button" onclick="deletePassword('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="ui-text-style"><strong>Username:</strong> ${entry.username}</p>
            <p class="ui-text-style"><strong>Password:</strong> ********</p>
            ${entry.notes ? `<p><strong>Notes:</strong> ${entry.notes}</p>` : ''}
            <p class="entry-date ui-text-style">Last modified: ${new Date(entry.dateModified).toLocaleString()}</p>
        `;
        
        passwordsList.appendChild(entryElement);
    });
}

// Add a new password
async function addNewPassword() {
    const website = document.getElementById("new-website").value;
    const username = document.getElementById("new-username").value;
    const password = document.getElementById("new-password-value").value;
    const notes = document.getElementById("new-notes").value;
    
    if (!website || !username || !password) {
        alert("Please fill in all required fields.");
        return;
    }
    
    await passwordManager.addPassword(website, username, password, notes);
    
    // Clear the form
    document.getElementById("new-website").value = "";
    document.getElementById("new-username").value = "";
    document.getElementById("new-password-value").value = "";
    document.getElementById("new-notes").value = "";
    
    // Hide the form
    document.getElementById("add-password-form").style.display = "none";
    
    // Reload the passwords
    loadAndDisplayPasswords();
}

// View password
function viewPassword(id) {
    const entry = passwordManager.getPasswordById(id);
    if (!entry) return;
    
    // Find the password element for this entry
    const entryElement = document.querySelector(`.password-entry[data-id="${id}"]`);
    const passwordElement = entryElement.querySelector("p:nth-child(3)");
    
    // Toggle password visibility
    if (passwordElement.innerHTML.includes("********")) {
        passwordElement.innerHTML = `<strong>Password:</strong> ${entry.password}`;
        // Change the eye icon
        entryElement.querySelector(".view-btn i").classList.replace("fa-eye", "fa-eye-slash");
    } else {
        passwordElement.innerHTML = `<strong>Password:</strong> ********`;
        // Change the eye icon back
        entryElement.querySelector(".view-btn i").classList.replace("fa-eye-slash", "fa-eye");
    }
}

// Edit password
function editPassword(id) {
    const entry = passwordManager.getPasswordById(id);
    if (!entry) return;
    
    // Fill the edit form with the entry data
    document.getElementById("edit-id").value = entry.id;
    document.getElementById("edit-website").value = entry.website;
    document.getElementById("edit-username").value = entry.username;
    document.getElementById("edit-password-value").value = entry.password;
    document.getElementById("edit-notes").value = entry.notes || "";
    
    // Show the edit form
    document.getElementById("edit-password-form").style.display = "block";
}

// Save edited password
async function saveEditedPassword() {
    const id = document.getElementById("edit-id").value;
    const website = document.getElementById("edit-website").value;
    const username = document.getElementById("edit-username").value;
    const password = document.getElementById("edit-password-value").value;
    const notes = document.getElementById("edit-notes").value;
    
    if (!website || !username || !password) {
        alert("Please fill in all required fields.");
        return;
    }
    
    await passwordManager.updatePassword(id, { website, username, password, notes });
    
    // Hide the form
    document.getElementById("edit-password-form").style.display = "none";
    
    // Reload the passwords
    loadAndDisplayPasswords();
}

// Delete password
async function deletePassword(id) {
    if (confirm("Are you sure you want to delete this password?")) {
        await passwordManager.deletePassword(id);
        loadAndDisplayPasswords();
    }
}

// Search passwords
function searchPasswords() {
    const query = document.getElementById("search-passwords").value;
    
    if (!query) {
        loadAndDisplayPasswords();
        return;
    }
    
    const results = passwordManager.searchPasswords(query);
    
    const passwordsList = document.getElementById("passwords-list");
    passwordsList.innerHTML = "";
    
    if (results.length === 0) {
        passwordsList.innerHTML = "<p>No matching passwords found.</p>";
        return;
    }
    
    results.forEach(entry => {
        const entryElement = document.createElement("div");
        entryElement.className = "password-entry";
        entryElement.dataset.id = entry.id;
        
        entryElement.innerHTML = `
            <div class="entry-header">
                <h3 class="ui-text-style all-headers">${entry.website}</h3>
                <div class="entry-actions">
                    <button class="view-btn eye-button" onclick="viewPassword('${entry.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="edit-btn edit-button" onclick="editPassword('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn delete-button" onclick="deletePassword('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="ui-text-style"><strong>Username:</strong> ${entry.username}</p>
            <p class="ui-text-style"><strong>Password:</strong> ********</p>
            ${entry.notes ? `<p><strong>Notes:</strong> ${entry.notes}</p>` : ''}
            <p class="entry-date ui-text-style">Last modified: ${new Date(entry.dateModified).toLocaleString()}</p>
        `;
        
        passwordsList.appendChild(entryElement);
    });
}

// Generate a random password
function generateRandomPassword(length = 8) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:;?><,./-=";
    let password = "";
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    return password;
}

// Generate password button event handler
function generatePassword(targetId) {
    const password = generateRandomPassword();
    document.getElementById(targetId).value = password;
}