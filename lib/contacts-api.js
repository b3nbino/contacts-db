const dbQuery = require("./dbQuery");

module.exports = class ContactAPI {
  constructor(reqSession) {}

  async getContacts() {
    let qResults = await dbQuery(
      "SELECT first_name, last_name, phone_number, string_agg(group_name, ', ') AS group_name " +
        "FROM contacts LEFT JOIN contacts_groups ON contacts.id = contacts_groups.contact_id " +
        "LEFT JOIN groups ON groups.id = contacts_groups.group_id GROUP BY contacts.id"
    );
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
