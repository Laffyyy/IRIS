

class login {
    constructor(userID, Email, Password, user_type, Security_Question, Security_Question2, Security_Question3,
        Security_Answer, Security_Answer2, Security_Answer3, last_login, status, LastUpdate, created_by, created_at,
        dPassword2_hash, dPassword3_hash, tExpiration_date) {
        this.userID = userID;
        this.Email = Email;
        this.Password = Password;
        this.user_type = user_type;
        this.Security_Question = Security_Question;
        this.Security_Question2 = Security_Question2;
        this.Security_Question3 = Security_Question3;
        this.Security_Answer = Security_Answer;
        this.Security_Answer2 = Security_Answer2;
        this.Security_Answer3 = Security_Answer3;
        this.last_login = last_login;
        this.status = status;
        this.LastUpdate = LastUpdate;
        this.created_by = created_by;
        this.created_at = created_at;
        this.dPassword2_hash = dPassword2_hash;
        this.dPassword3_hash = dPassword3_hash;
        this.tExpiration_date = tExpiration_date;
    
    }   
    //Gio note, added the lat 3 fields to the constructor.
}

module.exports = login;
// Compare this snippet from Backend/routes/userRoutes.js: