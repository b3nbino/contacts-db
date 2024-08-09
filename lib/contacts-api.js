const dbQuery = require("./dbQuery");

module.exports = class ContactAPI {
  constructor(reqSession) {}

  async getAllContacts() {
    let qResults = await dbQuery(
      "SELECT contacts.id, first_name, last_name, phone_number, string_agg(group_name, ', ') AS group_name " +
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

  async getContact(contactId) {
    let qResults = await dbQuery(
      "SELECT contacts.id, first_name, last_name, phone_number, string_agg(group_name, ', ') AS group_name " +
        "FROM contacts LEFT JOIN contacts_groups ON contacts.id = contacts_groups.contact_id " +
        "LEFT JOIN groups ON groups.id = contacts_groups.group_id  WHERE contacts.id = $1 GROUP BY contacts.id",
      contactId
    );
    return qResults.rows[0];
  }

  async getGroups() {
    let qResults = await dbQuery("SELECT * FROM groups");
    return qResults.rows;
  }

  async toggleGroup(contactId, groupId) {
    let inGroup = await dbQuery(
      "SELECT * FROM contacts_groups WHERE contact_id = $1 AND group_id = $2",
      contactId,
      groupId
    );
    inGroup = inGroup.rowCount > 0;

    if (!inGroup) {
      let qResults = await dbQuery(
        "INSERT INTO contacts_groups (contact_id, group_id) VALUES ($1, $2)",
        contactId,
        groupId
      );
      return qResults.rowCount > 0;
    } else {
      let qResults = await dbQuery(
        "DELETE FROM contacts_groups WHERE contact_id = $1 AND group_id = $2",
        contactId,
        groupId
      );
      return qResults.rowCount > 0;
    }
  }
};
