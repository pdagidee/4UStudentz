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
        mainmenuPage: document.getElementById("main-menu"),
        cybersecurityinfoPage: document.getElementById("cybersecurity-page"),
        passwordstoragePage: document.getElementById("password-storage-page"),
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
    displayPage.showPage('registerPage');
}

function showMainMenuPage(){
    displayPage.showPage('mainmenuPage');
}

function showCybSecInfoPage(){
    displayPage.showPage('cybersecurityinfoPage');
}

function showPasswordStoragePage(){
    if(UserAccount.CheckifUserisLoggedIn()){
    displayPage.showPage("passwordstoragePage");
    loadAndDisplayPasswords();
    } else{
        alert('Please login to access your passwords');
        showLoginPage();
    }
}
/* ----------------------------------------------------------------------------------------------------------*/
// Creating a function for exiting the SPA
function quitSPA(){
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
// Creating a Class for UserAccount

class UserAccount{
    constructor(username, password){    
        this.username = username;
        this.password = password;}

    static generateSalt(){
        return CryptoJS.lib.WordArray.random(128/28).toString();
    }

    static hashPassword(password, salt){
        return CryptoJS.SHA256(password + salt).toString();
    }

    // Register method
    register(){
        if(!this.username || !this.password){
            alert("Please fill in all fields")
            return false;
        }

        if(localStorage.getItem(this.username)){
            alert("This username already exists!");
            return false;
        }

        if (this.password.length < 10){
            alert("Please create a password with a minimum of 10 characters");
            return false;
        }

        const salt = UserAccount.generateSalt();
        const hashedPassword = UserAccount.hashPassword(this.password, salt);

        localStorage.setItem(
            this.username,
            JSON.stringify({
                password: hashedPassword,
                salt : salt,
            })
        );

        alert("Account created successfully!")
        return true;
    }

    //Login method
    login(){
        const storedUser = JSON.parse(localStorage.getItem(this.username));

        if(!storedUser){
            alert("User not found!");
            return false;
        }

        const hashedPassword = UserAccount.hashPassword(this.password, storedUser.salt)

        if(hashedPassword === storedUser.password){
            alert("Login successful!");
            sessionStorage.setItem("loggedInUser", this.username);
            return true;
        } else{
            alert("Incorrect password");
            return false;
        }
    }

    // Logout method
    static logout(){
        sessionStorage.removeItem("loggedInUser");
        alert("You have logged out successfully");
        showFrontPage();
    }

    //Check if the user is still logged in
    static CheckifUserisLoggedIn(){
        return sessionStorage.getItem("loggedInUser") !=null;
    }
}

// Function for UserLogin
function LoginUser(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("pwd").value;

    if (!username || !password){
        alert("Please fill in all fields.");
        return;
    }

    let user = new UserAccount(username, password);
    console.log("Attempting login for:", username);

    if (user.login()){
        passwordManager = new PasswordManager(password);
        passwordManager.loadPasswords();
        alert("Login successful!");
        sessionStorage.setItem("loggedInUser", username);
        document.getElementById("front-page-header").innerText = `Welcome, ${username}`;
        document.getElementById("user-name").innerText = username;
        showMainMenuPage(); 
    } else {
        alert("Login failed. Please check your credentials again.");
    }
}

// Function for Registration
function SignInUser(){
    let username = document.getElementById("username2").value;
    let password = document.getElementById("pwd2").value;

    if(!username || !password){
        alert("Please fill in all fields.");
        return;
    }

    let user = new UserAccount (username, password);

    if(user.register()){
        alert("Sign-in successful");
        showLoginPage();
    } else{
        alert("Sign-in failed. Username already exists");
    }
}

// Function for logging out
function LogOutUser(){
    UserAccount.logout();
    document.getElementById("front-page-header").innerText = "Welcome, User";
    document.getElementById("user-name").innerText = "User";

    showFrontPage();
    alert("You have been logged out successfully.");

}

/* Password Storage */

// Password Entry class
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

// Encryption and Decryption using CryptoJS
// Generating iv
class PasswordManager{
    constructor(masterKey){
        this.masterKey = masterKey;
        this.passwords = [];
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    static generateSalt(){
        return CryptoJS.lib.WordArray.random(128/8).toString();
    }

    // Encrypt data
    encrypt(data){
        if(!this.masterKey){
            console.error("Master key is not initialized");
            throw new Error("Master key is not initialized");
        }
        const salt = PasswordManager.generateSalt();
        const iv = CryptoJS.lib.WordArray.random(128/8);
        
        const key = CryptoJS.PBKDF2(this.masterKey, salt, {
        keySize: 256 / 32,
        iterations: 1000,
    });

        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
            iv: iv,
        });

        return {
            encryptedData: encrypted.toString(),
            iv: iv.toString(CryptoJS.enc.Hex),
            salt: salt,
        };
    }

    // Decryption using AES
    decrypt(encryptedObj){
        const { encryptedData, iv, salt } = encryptedObj;

        const key = CryptoJS.PBKDF2(this.masterKey, salt, {
            keySize: 256 / 32,
            iterations: 1000,

        });

        const decrypted = CryptoJS.AES.decrypt(
            encryptedData, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
        });

        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    }
    // Load passwords method
    loadPasswords(){
        const username = sessionStorage.getItem("loggedInUser")
        if(!username){
            console.log("No logged in user found")
            return false;
        }

        const passwordsKey = `${username}_passwords`;
        const encryptedData = localStorage.getItem(passwordsKey);

        if(!encryptedData){

            const testData = {validation: "valid" };
            try {
                const encryptedTest = this.encrypt(testData);
                localStorage.setItem(`${username}_validation`, JSON.stringify(encryptedTest));
                this.passwords = [];
                return true;
            } catch(error){
                console.error("Failed to initialize password validation, error");
                return false;
            }
            
        }

        const validationData = localStorage.getItem(`${username}_validation`);
        if (validationData){
            try{
                const decryptedValidation = this.decrypt(JSON.parse(validationData));

                if (!decryptedValidation || decryptedValidation.validation !== "valid"){
                    console.log("Invalid master password");
                    return false;
                }

            } catch (error){
                console.log("Failed to decrypt validation data - incorrect password");
                return false;
            }
        }

        
        try {
        const decryptedPasswords = this.decrypt(JSON.parse(encryptedData));

            if (decryptedPasswords){
            this.passwords = decryptedPasswords;
            alert("You've successfully opened your password storage");
            return true;
        }    else {
            console.log("Failed to decrypt passwords");
            this.passwords = [];
            return false;
        } 
        }  catch(error){
        console.log("Failed to decrypt passwords");
        this.passwords = [];
        return false;
    }

    }

    savePasswords(){
        const username = sessionStorage.getItem("loggedInUser")
        if(!username){
            console.log("No logged in user found");
            return false;
        }

        if (!this.passwords || this.passwords.length === 0){
            console.warn("No passwords to save.");
            return false;
        }

        const passwordsKey = `${username}_passwords`;

        try{
        const encryptedData = this.encrypt(this.passwords);
        localStorage.setItem(passwordsKey, JSON.stringify(encryptedData));
        return true;
        } catch (error){
            console.error("Failed to save passwords:", error);
            return false;
        }
    }

    addPassword(website, username, password, notes =""){
        const newEntry = new PasswordEntry(
            PasswordManager.generateId(),
            website,
            username,
            password,
            notes
        );

        this.passwords.push(newEntry);
        return this.savePasswords() ? newEntry : null
    }

    getPasswordById(id) {
        return this.passwords.find(entry => entry.id === id);
    }

    getAllPasswords(){
        return this.passwords;
    }

    //Update passwords method
    updatePasswords(id, updates){

        if(!id || typeof id !== "string"){
            console.error("Invalid id provided for updating passwords");
            return false;
        }


        const index = this.passwords.findIndex(entry => entry.id === id);
        if(index === -1){
            console.error(`No password entry found with id: ${id}`);
            return false;
        }

        if(!updates || typeof updates !=="object"){
            console.error("Invalid updates object provided");
            return false;
        }

        this.passwords[index] = {
            ...this.passwords[index],
            ...updates,
            dateModified: new Date().toISOString()
        };

        return this.savePasswords();
    }
    // Delete Passwords
    deletePassword(id){
        if(!id){
            console.error("No id provided for deletion");
            return false;
        }
        const initialLength = this.passwords.length;
        this.passwords = this.passwords.filter(entry => entry.id !== id);

        if(this.passwords.length < initialLength){
            return this.savePasswords();
        }

        console.warn(`No passwords with id ${id} found to delete`);
        return false;

    }



}

let passwordManager;

// Function to initialise password manager after successful login
function initialise(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("pwd").value;

    let user = new UserAccount(username, password);

    if(user.login()){
        document.getElementById("front-page-header").innerText = `Welcome, ${username}`;
        document.getElementById("user-name").innerText = username;

        passwordManager = new PasswordManager(password);
        passwordManager.loadPasswords();
        showMainMenuPage();
        return true;
    } else{
        console.log("Failed to login")
        return false;
    }
}

// Function to load and display passwords
function loadAndDisplayPasswords(){
    if(!passwordManager){

        const password = prompt("Please enter your password to view your password storage");
        if(!password){
            alert('Failed to unlock password storage')
            passwordManager = new PasswordManager(password);
            return;
        } 
        
        
          const success = passwordManager.loadPasswords();

        
        if(!success) {
            alert('Failed to unlock password storage');
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

// Function to add a new Password
function addNewPassword(){
    const website = document.getElementById("new-website").value;
    const username = document.getElementById("new-username").value;
    const password = document.getElementById("new-password-value").value;
    const notes = document.getElementById("new-notes").value;

    if(!website || !username || !password || !notes){
        alert("Please fill in all the fields");
        return;
    } 

    if(!passwordManager){
        alert("Password Manager is not initialized. Please log in again");
        showLoginPage;
    }

    try{passwordManager.addPassword(website, username, password, notes);
        alert("Password added successfully!");
    document.getElementById("new-website").value = "";
    document.getElementById("new-username").value = "";
    document.getElementById("new-password-value").value = "";
    document.getElementById("new-notes").value = "";
    document.getElementById("add-password-form").style.display = "none";
    loadAndDisplayPasswords();
    } catch(error){
        console.error("Error adding password: ", error);
        alert("Error occured while adding the password. Please try again.");
    }


}

// Function to view passwords
function viewPassword(id) {
    const entry = passwordManager.getPasswordById(id);
    if (!entry) return;
    
    const entryElement = document.querySelector(`.password-entry[data-id="${id}"]`);
    const passwordElement = entryElement.querySelector("p:nth-child(3)");
    

    if (passwordElement.innerHTML.includes("********")) {
        passwordElement.innerHTML = `<strong>Password:</strong> ${entry.password}`;
        entryElement.querySelector(".view-btn i").classList.replace("fa-eye", "fa-eye-slash");
    } else {
        passwordElement.innerHTML = `<strong>Password:</strong> ********`;
        entryElement.querySelector(".view-btn i").classList.replace("fa-eye-slash", "fa-eye");
    }
}
// Function to edit passwords
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

// Function to save edited password
function saveEditedPassword(){
    const id = document.getElementById("edit-id").value;
    const website = document.getElementById("edit-website").value;
    const username = document.getElementById("edit-username").value;
    const password = document.getElementById("edit-password-value").value;
    const notes = document.getElementById("edit-notes").value;

    if (!website || !username || !password) {
        alert("Please fill in all required fields.");
        return;
    }

    try{
        passwordManager.updatePasswords( id, { website, username, password, notes});
        document.getElementById("edit-password-form").style.display = "none";
        loadAndDisplayPasswords();
    } catch (error){
        console.log("Failed to save password", error);
        alert("An error occured while adding the password. Try again");
    }
}

function deletePassword(id){
    if(!id){
        console.log("No id selected for deletion.")
        return false;
    } else{
        if(confirm("Are you sure you want to delete?")){
            passwordManager.deletePassword(id);
            loadAndDisplayPasswords();
        }
    }

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




