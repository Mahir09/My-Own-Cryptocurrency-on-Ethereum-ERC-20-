const MmsToken = artifacts.require("MmsToken");
var MmsTokenSale = artifacts.require("MmsTokenSale");

module.exports = function(deployer) {
  deployer.deploy(MmsToken, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000; // in wei
    return deployer.deploy(MmsTokenSale, MmsToken.address, tokenPrice);
  });
};
