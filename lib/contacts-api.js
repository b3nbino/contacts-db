const dbQuery = require("./dbQuery");
const bcrypt = require("bcrypt");

module.exports = class ContactAPI {
  constructor(reqSession) {
    this.username = reqSession.username;
  }

  async getAllContacts(username) {
    //Returns list of all contacts including groups, groups sorted by name. For use on home page
    let qResults = await dbQuery(
      "SELECT contacts.id, first_name, last_name, phone_number, string_agg(group_name, ', ') AS group_name " +
        "FROM contacts LEFT JOIN contacts_groups ON contacts.id = contacts_groups.contact_id " +
        "LEFT JOIN groups ON groups.id = contacts_groups.group_id  WHERE contacts.username = $1 GROUP BY contacts.id",
      this.username
    );

    //Changes groups from single string into array of sorted strings
    let contacts = qResults.rows;
    contacts.forEach((contact) => {
      if (contact.group_name) {
        contact.group_name = contact.group_name.split(", ").sort((a, b) => {
          if (a > b) {
            return 1;
          } else if (a < b) {
            return -1;
          } else {
            return 0;
          }
        });
      } else {
        contact.group_name = [];
      }
    });

    return contacts;
  }

  async addContact(firstName, lastName, phoneNumber) {
    let qResults = await dbQuery(
      "INSERT INTO contacts (first_name, last_name, phone_number, username) VALUES ($1, $2, $3, $4)",
      firstName,
      lastName,
      phoneNumber,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async getContact(contactId) {
    let qResults = await dbQuery(
      "SELECT contacts.id, first_name, last_name, phone_number, string_agg(group_name, ', ') AS group_name " +
        "FROM contacts LEFT JOIN contacts_groups ON contacts.id = contacts_groups.contact_id " +
        "LEFT JOIN groups ON groups.id = contacts_groups.group_id  WHERE contacts.id = $1 AND contacts.username = $2 GROUP BY contacts.id",
      contactId,
      this.username
    );
    return qResults.rows[0];
  }

  async getGroups() {
    let qResults = await dbQuery(
      "SELECT * FROM groups WHERE username = $1",
      this.username
    );
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

  async createGroup(groupName) {
    let qResults = await dbQuery(
      "INSERT INTO groups (group_name, username) VALUES ($1, $2)",
      groupName,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async deleteGroup(groupId) {
    let qResults = await dbQuery(
      "DELETE FROM groups WHERE id = $1 AND username = $2",
      groupId,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async deleteContact(contactId) {
    let qResults = await dbQuery(
      "DELETE FROM contacts WHERE id = $1 AND username = $2",
      contactId,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async updateFirstName(firstName, contactId) {
    let qResults = await dbQuery(
      "UPDATE contacts SET first_name = $1 WHERE id = $2 AND username = $3",
      firstName,
      contactId,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async updateLastName(lastName, contactId) {
    let qResults = await dbQuery(
      "UPDATE contacts SET last_name = $1 WHERE id = $2 AND username = $3",
      lastName,
      contactId,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async updatePhoneNumber(phoneNumber, contactId) {
    let qResults = await dbQuery(
      "UPDATE contacts SET phone_number = $1 WHERE id = $2 AND username = $3",
      phoneNumber,
      contactId,
      this.username
    );

    return qResults.rowCount > 0;
  }

  async login(username, password) {
    let qResults = await dbQuery(
      "SELECT password FROM users WHERE username = $1",
      username
    );
    if (qResults.rowCount === 0) return false;

    return bcrypt.compare(password, qResults.rows[0].password);
  }
};
