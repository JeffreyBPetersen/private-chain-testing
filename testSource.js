var source = `
contract TestSet {
  uint public n;
  function set(uint num){
    n = num;
  }
}

// with constructor
contract TestSetC {
  uint public n;
  function set(uint num){
    n = num;
  }
  function TestSetC(uint num){
    n = num;
  }
}
`;
