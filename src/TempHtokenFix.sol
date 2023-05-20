/*HOLOGRAPH_LICENSE_HEADER*/

/*SOLIDITY_COMPILER_VERSION*/

contract TempHtokenFix {
  constructor() {}

  function withdraw() external {
    payable(address(0xC0FFEE78121f208475ABDd2cf0853a7afED64749)).transfer(address(this).balance);
  }
}
