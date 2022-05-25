const checkQUBStatus = (entry, fieldName, showIfQUB) => {
  if (entry["Ticket Type Name"] === "Student Membership" && showIfQUB) {
    return entry[fieldName];
  }
  if (entry["Ticket Type Name"] !== "Student Membership" && !showIfQUB) {
    return entry[fieldName];
  }
  return "NA";
};

const generateValidQUBEmail = (studentNo) => `${studentNo}@ads.qub.ac.uk`;

module.exports = {
  generateValidQUBEmail,
  checkQUBStatus,
};
