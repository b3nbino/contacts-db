const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const flash = require("express-flash");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const ContactAPI = require("./lib/contacts-api");

const app = express();
const HOST = "localhost";
const PORT = 3000;
const LokiStore = store(session);

//Sets view engine and directory
app.set("views", "./views");
app.set("view engine", "pug");

//Middlewear setup, Tells express to:
//use "public" folder to serve static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
//use cookies for some session persistence
app.use(
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
app.use(flash());
app.use(morgan("common"));

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
app.get("/contacts", async (req, res) => {
  let contacts = await res.locals.store.getAllContacts();
  res.render("contacts", { contacts });
});

//Get contact creation page
app.get("/contacts/new", (req, res) => {
  res.render("new_contact");
});

//Add a new contact
app.post(
  "/contacts/new",
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
      .isLength({ min: 10, max: 10 })
      .withMessage("Please enter a valid phone number."),
  ],
  async (req, res) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let phoneNumber = req.body.phoneNumber;
    let errors = validationResult(req);

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
      errors.array().forEach((message) => req.flash("error", message.msg));

      res.render("new_contact", {
        firstName,
        lastName,
        phoneNumber,
        flash: req.flash(),
      });
    }
  }
);

//Get edit groups page
app.get("/contacts/:contactId", async (req, res) => {
  let contactId = req.params.contactId;
  let contact = await res.locals.store.getContact(contactId);
  let allGroups = await res.locals.store.getGroups();
  res.render("edit_groups", { contact, allGroups });
});

//Add or remove selected group
app.post("/contacts/:contactId/:groupId", async (req, res) => {
  let contactId = req.params.contactId;
  let groupId = req.params.groupId;

  let toggled = await res.locals.store.toggleGroup(contactId, groupId);
  if (!toggled) throw new Error("Not found.");

  res.redirect(`/contacts/${contactId}`);
});

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

app.listen(PORT, HOST, () => {
  console.log(`Server is now listening on ${HOST} port ${PORT}`);
});
