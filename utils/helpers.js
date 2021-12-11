const generateEVCSupID = () => {
  return Math.floor(100000000 + Math.random() * 900000000);
};
const generateBankAccountNo = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const generatePIN = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const generateBankPIN = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

module.exports = {
  generateBankAccountNo,
  generateEVCSupID,
  generatePIN,
  generateBankPIN
};
