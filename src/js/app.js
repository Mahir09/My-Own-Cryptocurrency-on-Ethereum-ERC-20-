App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("MmsTokenSale.json", function(MmsTokenSale) {
      App.contracts.MmsTokenSale = TruffleContract(MmsTokenSale);
      App.contracts.MmsTokenSale.setProvider(App.web3Provider);
      App.contracts.MmsTokenSale.deployed().then(function(MmsTokenSale) {
        console.log("Mms Token Sale Address:", MmsTokenSale.address);
      });
    }).done(function() {
      $.getJSON("MmsToken.json", function(MmsToken) {
        App.contracts.MmsToken = TruffleContract(MmsToken);
        App.contracts.MmsToken.setProvider(App.web3Provider);
        App.contracts.MmsToken.deployed().then(function(MmsToken) {
          console.log("Mms Token Address:", MmsToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.MmsTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + account);
      }
    })

    // Load token sale contract
    App.contracts.MmsTokenSale.deployed().then(function(instance) {
      MmsTokenSaleInstance = instance;
      return MmsTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return MmsTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.MmsToken.deployed().then(function(instance) {
        MmsTokenInstance = instance;
        return MmsTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.Mms-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.MmsTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});



// App = {
//     web3Provider: null,
//     contracts: {},
//     account: '0x0',
//     loading: false,
//     tokenPrice: 1000000000000000,
//     tokensSold: 0,
//     tokensAvailable: 750000,

//     initMetaMask: function() {

//       async function enableUser() {
//         await window.ethereum.enable();
//         const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//         const account = accounts[0];
//         // console.log(account);
//         App.account = account;
//       }
//       enableUser();
//       },
  
//     init: function() {
//       console.log("App initialized...")
//       return App.initWeb3();
//     },
  
//     initWeb3: function() {
//       // if (typeof web3 !== 'undefined') {
//       //   // If a web3 instance is already provided by Meta Mask.
//       //   App.web3Provider = web3.currentProvider;
//       //   web3 = new Web3(web3.currentProvider);
//       // } else {
//       //   // Specify default instance if no web3 instance provided
//       //   App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
//       //   web3 = new Web3(App.web3Provider);
//       // }
//       // return App.initContracts();


//       if (window.ethereum) {
//         const web3 = new Web3(window.ethereum);
//         try {
//           // Request account access if needed
//           window.ethereum.enable()
//               .then(web3 => {
//                   // console.log(web3)
//                   App.web3Provider = web3;
//               });
//         } catch (error) {
//           console.error(error);
//         }
//       }
//       // Legacy Mms browsers...
//       else if (window.web3) {
//         // Use Mist/MetaMask's provider.
//         const web3 = window.web3;
//         console.log('Injected web3 detected.');
//         App.web3Provider = web3;
//       }
//       // Fallback to localhost; use dev console port by default...
//       else {
//         const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
//         const web3 = new Web3(provider);
//         console.log('No web3 instance injected, using Local web3.');
//         App.web3Provider = web3;
//       }
//       return App.initContracts();      
//     },
  
//     initContracts: function() {
//       $.getJSON("MmsTokenSale.json", function(MmsTokenSale) {
//         App.contracts.MmsTokenSale = TruffleContract(MmsTokenSale);
//         App.contracts.MmsTokenSale.setProvider(App.web3Provider);
//         App.contracts.MmsTokenSale.deployed().then(function(MmsTokenSale) {
//           console.log("Mms Token Sale Address:", MmsTokenSale.address);
//         });
//       }).done(function() {
//         $.getJSON("MmsToken.json", function(MmsToken) {
//           App.contracts.MmsToken = TruffleContract(MmsToken);
//           App.contracts.MmsToken.setProvider(App.web3Provider);
//           App.contracts.MmsToken.deployed().then(function(MmsToken) {
//             console.log("Mms Token Address:", MmsToken.address);
//           });
  
//           App.listenForEvents();
//           return App.render();
//         });
//       })
//     },
  
//     // Listen for events emitted from the contract
//     listenForEvents: function() {
//       App.contracts.MmsTokenSale.deployed().then(function(instance) {
//         instance.Sell({}, {
//           fromBlock: 0,
//           toBlock: 'latest',
//         }).watch(function(error, event) {
//           console.log("event triggered", event);
//           App.render();
//         })
//       })
//     },
  
//     render: function() {
//       if (App.loading) {
//         return;
//       }
//       App.loading = true;
  
//       var loader  = $('#loader');
//       var content = $('#content');
  
//       loader.show();
//       content.hide();
  
//       // Load account data
//       web3.eth.getCoinbase(function(err, account) {
//         if(err === null) {
//           App.account = account;
//           $('#accountAddress').html("Your Account: " + account);
//         }
//       })
  
//       // Load token sale contract
//       App.contracts.MmsTokenSale.deployed().then(function(instance) {
//         MmsTokenSaleInstance = instance;
//         return MmsTokenSaleInstance.tokenPrice();
//       }).then(function(tokenPrice) {
//         App.tokenPrice = tokenPrice;
//         $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
//         return MmsTokenSaleInstance.tokensSold();
//       }).then(function(tokensSold) {
//         App.tokensSold = tokensSold.toNumber();
//         $('.tokens-sold').html(App.tokensSold);
//         $('.tokens-available').html(App.tokensAvailable);
  
//         var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
//         $('#progress').css('width', progressPercent + '%');
  
//         // Load token contract
//         App.contracts.MmsToken.deployed().then(function(instance) {
//           MmsTokenInstance = instance;
//           return MmsTokenInstance.balanceOf(App.account);
//         }).then(function(balance) {
//           $('.Mms-balance').html(balance.toNumber());
//           App.loading = false;
//           loader.hide();
//           content.show();
//         })
//       });
//     },
  
//     buyTokens: function() {
//       $('#content').hide();
//       $('#loader').show();
//       var numberOfTokens = $('#numberOfTokens').val();
//       App.contracts.MmsTokenSale.deployed().then(function(instance) {
//         return instance.buyTokens(numberOfTokens, {
//           from: App.account,
//           value: numberOfTokens * App.tokenPrice,
//           gas: 500000 // Gas limit
//         });
//       }).then(function(result) {
//         console.log("Tokens bought...")
//         $('form').trigger('reset') // reset number of tokens in form
//         // Wait for Sell event
//       });
//     }
//   }
  
//   $(function() {
//     $(window).load(function() {
//       App.initMetaMask();
//       App.init();
//     })
//   });