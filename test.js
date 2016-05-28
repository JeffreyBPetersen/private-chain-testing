var web3;

var accounts;
var contracts;

function setDefaultAccount(address){
  web3.eth.defaultAccount = address;
  displayAccounts();
}

function displayAccounts(){
  web3.eth.getAccounts((error, accounts) => {
    var html = `default account: ${web3.eth.defaultAccount}<br><br>accounts:<br>`;
    for(var index in accounts) html += `${accounts[index]} <button onclick=setDefaultAccount('${accounts[index]}')>set as default</button>
    <button onclick=unlockAccount('${index}')>unlock</button><br>`;
    document.getElementById('accountsDisplay').innerHTML = html;
  });
}

function startMining(){
  var call = new XMLHttpRequest();
  call.open('POST', 'http://localhost:8545', true);
  call.send(JSON.stringify({method: 'miner_start', params: [], id: 1}));
  refreshTestchainSection(); //?~ move into callback
}

function stopMining(){
  var call = new XMLHttpRequest();
  call.open('POST', 'http://localhost:8545', true);
  call.send(JSON.stringify({method: 'miner_stop', params: [], id: 1}));
  refreshTestchainSection(); //?~ move into callback
}

function generateAccount(){
  var call = new XMLHttpRequest();
  call.open('POST', 'http://localhost:8545', true);
  call.send(JSON.stringify({method: 'personal_newAccount', params: [''], id: 1}));
  call.onreadystatechange = () => {
    if(call.readyState == XMLHttpRequest.DONE) displayAccounts();
  };
}

function unlockAccount(accountNum){
  var call = new XMLHttpRequest();
  call.open('POST', 'http://localhost:8545', true);
  call.send(JSON.stringify({method: 'personal_unlockAccount', params: [web3.eth.accounts[accountNum], '', 0], id: 1}));
  call.onreadystatechange = () => {
    if(call.readyState == XMLHttpRequest.DONE) displayAccounts();
  };
}

function unlockAccountZero(){
  unlockAccount(0);
}

//!~ don't take arguments, check input elements for them
function deployContract(name, hasConstructor){
  var constructorArguments = [];//'PLACEHOLDER PLEASE IGNORE'; //!~ replace with grabbing arguments from input elements
  if(hasConstructor){
    var constructorParameters = contracts[name].info.abiDefinition.slice(-1)[0].inputs;
    console.log(constructorParameters);
    for(var i = 0; i < constructorParameters.length; i++){
      constructorArguments.push(document.getElementById(`${name}_${name}_${constructorParameters[i].name}`).value);
    }
    //!+ populate constructorArguments
  }
  console.log(`this function should deploy a "${name}" contract with arguments == [${constructorArguments}]`);
  web3.eth.contract(contracts[name].info.abiDefinition).new(...constructorArguments, {
    data: contracts[name].code,
    gas: 2500000
  }, (error, contract) => { //* callback fires twice: when transaction created and when address created
    if(error) alert(error);
    else {
      if(!contract.address) contracts[name].instance = contract;
      else refreshContractsSection();
    }
  });
}

//!+ needs the ability to use arguments (arguments need conversion to the correct types as well)
function contractCall(contractName, funcIndex){
  var funcName = contracts[contractName].info.abiDefinition[funcIndex].name;
  var inputs = contracts[contractName].info.abiDefinition[funcIndex].inputs;
  console.log(`contract: ${contractName}, function: ${funcName}`); //! debug
  var args = [];
  for(var argIndex in inputs){
    args[argIndex] = document.getElementById(`${contractName}_${funcName}_${inputs[argIndex].name}`).value;
  }
  console.log(args); //! debug
  // state when an instance of the contract isn't loaded
  if(!contracts[contractName].instance) document.getElementById(`${contractName}_${funcName}_output`).innerHTML = '<i>unavailable, contract not found</i>';
  else if(!contracts[contractName].instance.address) document.getElementById(`${contractName}_${funcName}_output`).innerHTML = '<i>unavailable, deployment in progress</i>';
  // call the function and display its output
  else {
    console.log(`args: ${args}\nfunc: ${contracts[contractName].instance[funcName]}`); //! debug
    document.getElementById(`${contractName}_${funcName}_output`).innerText = contracts[contractName].instance[funcName](...args);
  }
}

function contractTransaction(contractName, funcIndex){
  var funcName = contracts[contractName].info.abiDefinition[funcIndex].name;
  var inputs = contracts[contractName].info.abiDefinition[funcIndex].inputs;
  console.log(`contract: ${contractName}, function: ${funcName}`); //! debug
  var args = [];
  for(var argIndex in inputs){
    args[argIndex] = document.getElementById(`${contractName}_${funcName}_${inputs[argIndex].name}`).value;
  }
  console.log(args); //! debug
  // state when an instance of the contract isn't loaded
  if(!contracts[contractName].instance) document.getElementById(`${contractName}_${funcName}_output`).innerHTML = '<i>unavailable, contract not found</i>';
  else if(!contracts[contractName].instance.address) document.getElementById(`${contractName}_${funcName}_output`).innerHTML = '<i>unavailable, deployment in progress</i>';
  // call the function and display its output
  else document.getElementById(`${contractName}_${funcName}_output`).innerText = contracts[contractName].instance[funcName](...args);
}

function renderContract(name){
  var abi = contracts[name].info.abiDefinition;
  var html = `<b>${name}</b><br>
  <span class='data'>address: ${contracts[name].instance ? contracts[name].instance.address : 'none / unknown'}</span><br><br>`;
  var hasConstructor = !abi[abi.length-1].name;
  if(hasConstructor){
    //!+ thing
    html += `<i>constructor</i> `;
    for(var argIndex in abi[abi.length-1].inputs){
      // add input fields with IDs of form contractName_contractName_constructorParameterName for constructor
      html += ` <input id='${name}_${name}_${abi[abi.length-1].inputs[argIndex].name}' placeholder='${abi[abi.length-1].inputs[argIndex].type} ${abi[abi.length-1].inputs[argIndex].name}'></input>`;
    }
  }
  html += `<button onclick='deployContract("${name}", ${hasConstructor})'>deploy</button><br><br>`;
  // render function excluding the constructor
  for(var index = 0; index < abi.length - hasConstructor; index++){
    html += `${abi[index].name}`;
    for(var argIndex in abi[index].inputs){
      html += ` <input id='${name}_${abi[index].name}_${abi[index].inputs[argIndex].name}' placeholder='${abi[index].inputs[argIndex].type} ${abi[index].inputs[argIndex].name}'></input>`;
    }
    if(abi[index].constant) html += ` <button onclick='contractCall("${name}", "${index}")'>call</button> <span id='${name + '_' + abi[index].name + '_output'}'></span>`;
    else html += ` <button onclick='contractTransaction("${name}", "${index}")'>transact</button> <span id='${name + '_' + abi[index].name + '_output'}'></span>`;
    html += `<br>`;
  }
  /*! contracts don't necessarily have a constructor, this needs to be handled as a special case
  // render constructor
  html += `<i>constructor</i>`;
  for(var argIndex in abi[abi.length-1].inputs){
    html += ` <input id='${name}_${name}_${abi[abi.length-1].inputs[argIndex].name}' placeholder='${abi[abi.length-1].inputs[argIndex].type} ${abi[abi.length-1].inputs[argIndex].name}'></input>`;
  }
  html += `<button onclick='deployContract("${name}", [1,2,3])'>deploy</button>`; //!~ replace [1,2,3] with getInputArguments('${name}_constructor')
  */
  return html;
}

function refreshContractsSection(){
  var html = `<b>Contracts</b><br>`;
  html += `<button onclick='compileSource()'>Compile Source</button>`
  for(var id in contracts){
    html += `<div class='section'>${renderContract(id)}</div>`;
  }
  document.getElementById('contracts').innerHTML = html;
}

function refreshTestchainSection(){
  var html = `<b>Testchain</b><br>mining active: <span class='data'>${web3.eth.mining}</span><br>`;
  document.getElementById('testchain').innerHTML = html;
}

function compileSource(){
  contracts = web3.eth.compile.solidity(source);
  refreshContractsSection();
}

function loadTheTavern(address){
  TheTavern = web3.eth.contract(tavernABI).at(address);
  //!+ thing
}

function main(){
  console.log('hi');
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  if(!web3.isConnected()) alert('no node connected, please set one up accordingly and refresh the page');
  web3.eth.defaultAccount = web3.eth.accounts[0]; // undefined is a valid possibility
  displayAccounts();
  refreshContractsSection();
  refreshTestchainSection();
}

onload = main;
