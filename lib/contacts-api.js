const dbQuery = require("./dbQuery");

module.exports = class ContactAPI {
  constructor(reqSession) {}

  async getContacts() {
    let qResults = await dbQuery("SELECT * FROM contacts");
    return qResults.rows;
  }

  async addContact(firstName, lastName, phoneNumber) {
    let qResults = await dbQuery(
      "INSERT INTO contacts (first_name, last_name, phone_number) VALUES ($1, $2, $3)",
      firstName,
      lastName,
      phoneNumber
    );

    return qResults.rowCount > 0;
  }
};
