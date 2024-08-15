//Ideas: Change contact name and phone number from edit page, separate users, look through todos for extra inspo
//Stuff: catchError, config
const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("express-flash");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const catchError = require("./lib/catch-error");
const ContactAPI = require("./lib/contacts-api");

const app = express();
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;
const LokiStore = store(session);

//Callback function used for sorting by contact.last_name passed into .sort()
let stringSort = (a, b) => {
  let aLastName = a.last_name.toLowerCase();
  let bLastName = b.last_name.toLowerCase();

  if (aLastName > bLastName) {
    return 1;
  } else if (aLastName < bLastName) {
    return -1;
  } else {
    return 0;
  }
};

function requiresAuthentication(req, res, next) {
  if (!res.locals.signedIn) {
    res.redirect("/contacts/sign-in");
  } else {
    next();
  }
}

//Sets view engine and directory
app.set("views", "./views");
app.set("view engine", "pug");

//Middlewear setup, Tells express to:
app.use(express.static("public")); //use "public" folder to serve static files
app.use(express.urlencoded({ extended: false })); //make it possible to read request body(AKA form input) without use of a body parser
app.use(
  //use cookies for some session persistence
  session({
    cookie: {
      httpOnly: true,
      maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
      path: "/",
      secure: false,
    },
    name: "launch-school-contacts-session-id",
    resave: false,
    saveUninitialized: true,
    secret: "Extremely safe cookie here guys",
    store: new LokiStore({}),
  })
);
app.use(flash()); //persist flash messages
app.use(morgan("common")); //log request data

//Set session persistence
app.use((req, res, next) => {
  res.locals.store = new ContactAPI(req.session);
  next();
});

// Extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

//Home page redirect
app.get("/", (req, res) => {
  res.redirect("/contacts");
});

//Get contacts route handler
app.get(
  "/contacts",
  requiresAuthentication,
  catchError(async (req, res) => {
    let contacts = await res.locals.store.getAllContacts();
    res.render("contacts", { contacts });
  })
);

//Get contacts sorted by name, or phone number
app.get(
  "/contacts/sorted/:sortBy",
  requiresAuthentication,
  catchError(async (req, res) => {
    let sortBy = req.params.sortBy;
    let contacts = await res.locals.store.getAllContacts();

    if (sortBy === "last_name") {
      contacts.sort(stringSort);
    } else if (sortBy === "phone_number") {
      contacts.sort((a, b) => a.phone_number - b.phone_number);
    } else {
      contacts = contacts.filter((contact) =>
        contact.group_name.includes(sortBy)
      );
    }

    res.render("contacts", { contacts });
  })
);

//Get contact creation page
app.get("/contacts/new", requiresAuthentication, (req, res) => {
  res.render("new_contact");
});

//Add a new contact
app.post(
  "/contacts/new",
  requiresAuthentication,
  [
    body("firstName")
      .trim()
      .isLength({ min: 1, max: 25 })
      .withMessage("First name must be between 1 and 25 characters."),
    body("lastName")
      .trim()
      .isLength({ min: 1, max: 25 })
      .withMessage("Last name must be between 1 and 25 characters."),
    body("phoneNumber")
      .isLength({ min: 10, max: 14 })
      .withMessage("Please enter a valid phone number."),
  ],
  catchError(async (req, res) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let phoneNumber = req.body.phoneNumber.replace(/[^\d]/g, "");
    let contacts = await res.locals.store.getAllContacts();
    let errors = validationResult(req);

    //Checks for existing phone number
    if (contacts.some((contact) => contact.phone_number === phoneNumber)) {
      errors.errors.push({
        type: "field",
        value: "",
        msg: "Phone number already in contacts.",
        path: "phoneNumber",
        location: "body",
      });
    } else if (!phoneNumber.match(/^\d{10}$/)) {
      //Checks for valid phone number
      errors.errors.push({
        type: "field",
        value: "",
        msg: "Please enter a valid phone number",
        path: "phoneNumber",
        location: "body",
      });
    }

    //Create new contact in db
    if (errors.isEmpty()) {
      let added = await res.locals.store.addContact(
        firstName,
        lastName,
        phoneNumber
      );
      if (!added) throw new Error("Not found.");

      req.flash("success", "New contact added!");
      res.redirect("/contacts");
    } else {
      //Re-render new contact page with flash messages
      errors.array().forEach((message) => req.flash("error", message.msg));

      res.render("new_contact", {
        firstName,
        lastName,
        phoneNumber,
        flash: req.flash(),
      });
    }
  })
);

//Get edit contact page
app.get(
  "/contacts/edit-contact/:contactId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let contactId = req.params.contactId;
    let contact = await res.locals.store.getContact(contactId);
    let allGroups = await res.locals.store.getGroups();
    if (contact === undefined) {
      next(new Error("Not found."));
    } else if (!contact.group_name) {
      contact.group_name = "";
    }

    res.render("edit_contact", {
      contact,
      allGroups,
      contactId,
    });
  })
);

//Update contact info
app.post(
  "/contacts/edit-contact/:contactId",
  requiresAuthentication,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ max: 25 })
      .withMessage("First name must be between 1 and 25 characters."),
    body("lastName")
      .optional()
      .trim()
      .isLength({ max: 25 })
      .withMessage("Last name must be between 1 and 25 characters."),
    body("phoneNumber")
      .optional()
      .isLength({ max: 14 })
      .withMessage("Phone number length exceeded."),
  ],
  catchError(async (req, res) => {
    //Retreive values or set to empty string
    let firstName = req.body.firstName || "";
    let lastName = req.body.lastName || "";
    let phoneNumber = req.body.phoneNumber
      ? req.body.phoneNumber.replace(/[^\d]/g, "")
      : "";
    let contacts = await res.locals.store.getAllContacts();
    let contactId = req.params.contactId;
    let contact = await res.locals.store.getContact(contactId);
    let errors = validationResult(req);

    //Checks for existing phone number
    if (phoneNumber) {
      if (
        contacts.some(
          (contact) =>
            contact.phone_number === phoneNumber && contact.id !== contactId
        )
      ) {
        errors.errors.push({
          type: "field",
          value: "",
          msg: "Phone number already in contacts.",
          path: "phoneNumber",
          location: "body",
        });
      } else if (!phoneNumber.match(/^\d{10}$/)) {
        //Checks for valid phone number
        errors.errors.push({
          type: "field",
          value: "",
          msg: "Please enter a valid phone number.",
          path: "phoneNumber",
          location: "body",
        });
      }
    }

    if (errors.isEmpty()) {
      let updated;
      if (firstName && firstName !== contact.first_name) {
        updated = await res.locals.store.updateFirstName(firstName, contactId);
        if (!updated) throw new Error("First name not updated.");
      }
      if (lastName && lastName !== contact.last_name) {
        updated = await res.locals.store.updateLastName(lastName, contactId);
        if (!updated) throw new Error("Last name not updated.");
      }
      if (phoneNumber && phoneNumber !== contact.phone_number) {
        updated = await res.locals.store.updatePhoneNumber(
          phoneNumber,
          contactId
        );
        if (!updated) throw new Error("Phone number not updated.");
      }
      res.redirect(`/contacts/edit-contact/${contactId}`);
    } else {
      errors.array().forEach((error) => req.flash("error", error.msg));
      res.redirect(`/contacts/edit-contact/${contactId}`);
    }
  })
);

//Add or remove selected group
app.post(
  "/contacts/edit-contact/:contactId/:groupId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let contactId = req.params.contactId;
    let groupId = req.params.groupId;

    let toggled = await res.locals.store.toggleGroup(contactId, groupId);
    if (!toggled) throw new Error("Not found.");

    res.redirect(`/contacts/edit-contact/${contactId}`);
  })
);

//Create new group
app.post(
  "/contacts/create_group/:contactId",
  requiresAuthentication,
  [
    body("groupName")
      .isLength({ min: 1, max: 25 })
      .withMessage("Group name must be between 1 and 25 characters."),
  ],
  catchError(async (req, res) => {
    let groupName = req.body.groupName;
    let contactId = req.params.contactId;
    let groups = await res.locals.store.getGroups();
    let errors = validationResult(req);

    //Checks for groups with same name as user input
    if (groups.some((group) => group.group_name === groupName)) {
      errors.errors.push({
        type: "field",
        value: "",
        msg: "Group already exists.",
        path: "groupName",
        location: "body",
      });
    }

    if (errors.isEmpty()) {
      //Add new group to db
      let created = await res.locals.store.createGroup(groupName);
      if (!created) throw new Error("Not found.");

      req.flash("success", "New group created!");
      res.redirect(`/contacts/edit-contact/${contactId}`);
    } else {
      //Add error flash messages to req
      errors.array().forEach((message) => req.flash("error", message.msg));

      res.redirect(`/contacts/edit-contact/${contactId}`);
    }
  })
);

//Delete group
app.post(
  "/contacts/delete_group/:contactId/:groupId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let contactId = req.params.contactId;
    let groupId = req.params.groupId;

    let deleted = await res.locals.store.deleteGroup(groupId);
    if (!deleted) throw new Error("Not found.");

    req.flash("success", "Group deleted!");
    res.redirect(`/contacts/edit-contact/${contactId}`);
  })
);

//Delete contact
app.post(
  "/contacts/delete_contact/:contactId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let contactId = req.params.contactId;
    let deleted = await res.locals.store.deleteContact(contactId);

    if (!deleted) throw new Error("Not found.");

    res.redirect("/contacts");
  })
);

app.get("/contacts/sign-in", (req, res) => {
  res.render("sign_in");
});

//Sign-in
app.post(
  "/contacts/sign-in",
  catchError(async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username === "admin" && password === "secret") {
      req.session.username = username;
      req.session.signedIn = true;
      res.redirect("/contacts");
    } else {
      req.flash("error", "Incorrect username or password.");
      res.render("sign_in", { username, flash: req.flash() });
    }
  })
);

//Sign-out
app.post("/contacts/sign-out", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/contacts/sign-in");
});

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

//Server listen
app.listen(PORT, HOST, () => {
  console.log(`Server is now listening on ${HOST} port ${PORT}`);
});
