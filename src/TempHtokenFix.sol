/*HOLOGRAPH_LICENSE_HEADER*/

/*SOLIDITY_COMPILER_VERSION*/

contract TempHtokenFix {
  constructor() {}

  function withdraw() external {
    payable(address(0xc6deae10EB98f3Ed75255b41aCff54FC33FACADE)).transfer(address(this).balance);
  }
}
