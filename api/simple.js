// 가장 단순한 API - 텍스트만 반환
module.exports = (req, res) => {
  res.send('API가 작동합니다! ' + new Date().toISOString());
};
